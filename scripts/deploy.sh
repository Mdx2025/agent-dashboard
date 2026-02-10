#!/bin/bash
set -e

echo "🚀 Agent Dashboard Deploy Script"
echo "================================="

# Configuration
IMAGE_NAME="agent-dashboard"
CONTAINER_NAME="agent-dashboard"
VPS_HOST="${1:-}"
DOMAIN="mdx.agency"
SUBDIRECTORY="/dashboard"

if [ -z "$VPS_HOST" ]; then
    echo "❌ Usage: ./deploy.sh <vps-host>"
    echo "   Example: ./deploy.sh mdx.agency"
    exit 1
fi

echo "📦 Building Docker image..."
docker build -t $IMAGE_NAME .

echo "💾 Saving image..."
docker save $IMAGE_NAME | gzip > ${IMAGE_NAME}.tar.gz

echo "📡 Transferring to VPS..."
scp ${IMAGE_NAME}.tar.gz root@${VPS_HOST}:/tmp/

echo "🖥️  Deploying on VPS..."
ssh root@${VPS_HOST} << 'SSHEOF'
set -e

cd /tmp
echo "📥 Loading image..."
docker load < ${IMAGE_NAME}.tar.gz

echo "🛑 Stopping old container..."
docker rm -f $CONTAINER_NAME 2>/dev/null || true

echo "▶️  Starting new container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p 8000:8000 \
    -v /home/clawd/.openclaw/agents/main/sessions:/home/clawd/.openclaw/agents/main/sessions:ro \
    -e PYTHONUNBUFFERED=1 \
    -e OPENCLAW_SESSIONS_DIR=/home/clawd/.openclaw/agents/main/sessions \
    $IMAGE_NAME

# Wait for container to start
sleep 5

echo "✅ Container started"

# Get container IP
CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)
echo "📍 Container IP: $CONTAINER_IP"

# Configure nginx
cat > /etc/nginx/conf.d/dashboard.conf << 'NGINX'
server {
    listen 80;
    server_name mdx.agency;
    
    location /dashboard {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Rewrite for API calls
        rewrite /dashboard/api/(.*) /\$1 break;
        rewrite /dashboard/\$ /dashboard/index.html break;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX

# Test nginx config
nginx -t

# Reload nginx
nginx -s reload

echo "✅ Nginx configured"

# SSL Certificate (if not exists)
if [ ! -f "/etc/letsencrypt/live/mdx.agency/fullchain.pem" ]; then
    echo "🔒 Obtaining SSL certificate..."
    certbot --nginx -d mdx.agency --non-interactive --agree-tos -m admin@mdx.agency || true
fi

echo ""
echo "===================================="
echo "✅ Deploy complete!"
echo ""
echo "🌐 Dashboard URL: https://mdx.agency/dashboard"
echo "🔍 Health check: https://mdx.agency/dashboard/api"
echo ""

# Cleanup
rm ${IMAGE_NAME}.tar.gz
SSHEOF

echo ""
echo "🎉 All done!"

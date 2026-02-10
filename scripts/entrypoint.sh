#!/bin/bash
set -e

echo "🚀 Starting Agent Dashboard..."

# Puerto asignado por Railway (default 8001)
PORT="${PORT:-8001}"
echo "📡 Using PORT: $PORT"

# Ensure sessions directory exists
mkdir -p "$OPENCLAW_SESSIONS_DIR"

# Crear directorios necesarios para nginx
mkdir -p /run/nginx /var/log/nginx

# Generar config de nginx con el puerto correcto
export PORT
cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;

events {
    worker_connections 768;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    access_log /var/log/nginx/access.log;
    sendfile on;
    keepalive_timeout 65;
    gzip on;
    
    server {
        listen PORT_PLACEHOLDER;
        server_name localhost;
        root /var/www/html;
        index index.html;
        
        # Static assets - servir directamente
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Healthcheck endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # API requests van a gunicorn
        location /api {
            proxy_pass http://localhost:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
EOF

# Reemplazar el placeholder con el puerto real
sed -i "s/PORT_PLACEHOLDER/$PORT/g" /etc/nginx/nginx.conf

echo "📝 Nginx config generated with port $PORT"

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Shutting down..."
    if [ -n "$GUNICORN_PID" ]; then
        kill "$GUNICORN_PID" 2>/dev/null || true
    fi
    if [ -n "$NGINX_PID" ]; then
        kill "$NGINX_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGTERM SIGINT

# Test nginx config first
echo "🔍 Testing nginx configuration..."
if ! nginx -t 2>&1; then
    echo "❌ Nginx configuration test failed"
    cat /etc/nginx/nginx.conf
    exit 1
fi

# Start nginx in background
echo "🌐 Starting nginx..."
nginx &
NGINX_PID=$!

# Give nginx time to start
sleep 2

# Check if nginx started
if ! kill -0 "$NGINX_PID" 2>/dev/null; then
    echo "❌ Nginx failed to start"
    exit 1
fi

echo "✅ Nginx started on port $PORT (PID: $NGINX_PID)"

# Start gunicorn en background (escucha en 8000)
echo "🐍 Starting gunicorn..."
gunicorn main:app \
    -b 127.0.0.1:8000 \
    -k uvicorn.workers.UvicornWorker \
    --workers 2 \
    --access-logfile - \
    --error-logfile - \
    &
GUNICORN_PID=$!

echo "✅ Gunicorn started on port 8000 (PID: $GUNICORN_PID)"
echo "🎯 Dashboard available at port $PORT"

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?

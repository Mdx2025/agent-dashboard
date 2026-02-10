#!/bin/bash
set -e

echo "🚀 Starting Agent Dashboard..."

# Puerto asignado por Railway
PORT="${PORT:-8001}"
echo "📡 Railway PORT: $PORT"

# Ensure sessions directory exists
mkdir -p "$OPENCLAW_SESSIONS_DIR"

# Crear directorios necesarios para nginx con permisos correctos
mkdir -p /run/nginx /var/log/nginx /var/cache/nginx
chmod 777 /run/nginx /var/log/nginx /var/cache/nginx 2>/dev/null || true

# Generar config de nginx con el puerto de Railway
# Nota: en Docker Alpine, nginx debe correr como root para bind a puertos < 1024
# Railway asigna puertos dinámicos (normalmente > 1024 pero por seguridad usamos root)
cat > /etc/nginx/nginx.conf << EOF
user root;
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
        listen $PORT;
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
            proxy_pass http://unix:/tmp/gunicorn.sock;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }
        
        # SPA fallback
        location / {
            try_files \$uri \$uri/ /index.html;
        }
    }
}
EOF

echo "📝 Nginx config generated"
cat /etc/nginx/nginx.conf | head -20

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
    exit 1
fi

# Start gunicorn primero (en socket unix, no puerto)
echo "🐍 Starting gunicorn on unix socket..."
gunicorn main:app \
    -b unix:/tmp/gunicorn.sock \
    -k uvicorn.workers.UvicornWorker \
    --workers 2 \
    --access-logfile - \
    --error-logfile - \
    &
GUNICORN_PID=$!

sleep 2

if ! kill -0 "$GUNICORN_PID" 2>/dev/null; then
    echo "❌ Gunicorn failed to start"
    exit 1
fi

echo "✅ Gunicorn started on unix socket"

# Start nginx en foreground mode para Docker
echo "🌐 Starting nginx on port $PORT..."
# Usar daemon off para que nginx corra en foreground y podamos capturar logs
nginx -g 'daemon off;' &
NGINX_PID=$!

# Give nginx time to start
sleep 2

# Check if nginx started
if ! kill -0 "$NGINX_PID" 2>/dev/null; then
    echo "❌ Nginx failed to start"
    echo "📋 Nginx error logs:"
    cat /var/log/nginx/error.log 2>/dev/null || echo "  (no logs available)"
    echo "📋 Últimas líneas de syslog:"
    dmesg 2>/dev/null | tail -10 || echo "  (no dmesg available)"
    exit 1
fi

echo "✅ Nginx started on port $PORT (PID: $NGINX_PID)"
echo "🎯 Dashboard available!"

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?

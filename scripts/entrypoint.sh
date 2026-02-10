#!/bin/bash
set -e

echo "🚀 Starting Agent Dashboard..."

# Ensure sessions directory exists
mkdir -p "$OPENCLAW_SESSIONS_DIR"

# Crear directorios necesarios para nginx
mkdir -p /run/nginx /var/log/nginx

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

# Start nginx in foreground with daemon off to capture errors
echo "🌐 Starting nginx..."

# Intentar iniciar nginx y capturar errores
nginx 2>&1 &
NGINX_PID=$!

# Give nginx time to start
sleep 3

# Check if nginx started
if ! kill -0 "$NGINX_PID" 2>/dev/null; then
    echo "❌ Nginx failed to start - trying to get error:"
    # Intentar iniciar nginx manualmente para ver el error
    nginx 2>&1 || true
    echo "---"
    echo "Checking nginx error log:"
    cat /var/log/nginx/error.log 2>/dev/null || echo "No error logs found"
    echo "---"
    echo "Directory permissions:"
    ls -la /run/nginx /var/log/nginx /var/cache/nginx 2>/dev/null || true
    exit 1
fi

echo "✅ Nginx started on port 8001 (PID: $NGINX_PID)"

# Start gunicorn en background (escucha en 8000)
echo "🐍 Starting gunicorn..."
gunicorn main:app \
    -b 0.0.0.0:8000 \
    -k uvicorn.workers.UvicornWorker \
    --workers 2 \
    --access-logfile - \
    --error-logfile - \
    &
GUNICORN_PID=$!

echo "✅ Gunicorn started on port 8000 (PID: $GUNICORN_PID)"
echo "🎯 Dashboard available at port 8001"

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?

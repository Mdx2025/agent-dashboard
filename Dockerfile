# Multi-stage build para Agent Dashboard
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production con Python + Nginx
FROM python:3.11-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache nginx curl openssl bash

# Crear directorios necesarios
RUN mkdir -p /var/www/html /run/nginx /var/log/nginx

WORKDIR /app

# Instalar dependencias Python
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código backend
COPY backend/ ./

# Copiar frontend build a nginx html
COPY --from=frontend-builder /app/dist /var/www/html

# Copiar config nginx
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copiar entrypoint
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Crear usuario nginx si no existe
RUN adduser -D -S -h /var/cache/nginx -s /sbin/nologin nginx 2>/dev/null || true

# Environment
ENV PYTHONUNBUFFERED=1
ENV OPENCLAW_SESSIONS_DIR=/home/clawd/.openclaw/agents/main/sessions

# Exponer puerto (Railway usa este puerto)
EXPOSE 8001

# Healthcheck - nginx escucha en 8001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

# Entrypoint maneja todo
ENTRYPOINT ["/entrypoint.sh"]

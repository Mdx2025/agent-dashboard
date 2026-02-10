# Agent Operations Dashboard

MVP para monitorear sesiones de OpenClaw en tiempo real.

## Características

- 📊 Dashboard con estadísticas generales
- 🤖 Lista de sesiones activas con metadatos
- 📜 Timeline de eventos por sesión
- 💬 Mensajes del chat
- 🔄 Auto-refresh cada 10 segundos
- 📈 Analytics básicos (tokens, eventos, modelos)

## Stack

- **Backend**: FastAPI + Python
- **Frontend**: React + Vite
- **Deploy**: Docker

## Desarrollo Local

### Opción 1: Backend separado

```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### Opción 2: Docker Compose

```bash
docker-compose up --build
```

- Backend: http://localhost:8000
- Frontend Dev: http://localhost:3000

## Producción

```bash
docker build -t agent-dashboard .
docker run -p 8000:8000 \
  -v /home/clawd/.openclaw/agents/main/sessions:/app/sessions:ro \
  agent-dashboard
```

## API Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/sessions` | Lista de sesiones activas |
| `GET /api/sessions/{id}` | Detalles de una sesión |
| `GET /api/sessions/{id}/events` | Eventos con paginación |
| `GET /api/sessions/{id}/timeline` | Timeline simplificado |
| `GET /api/sessions/{id}/messages` | Mensajes del chat |
| `GET /api/sessions/{id}/tool-calls` | Llamadas a herramientas |
| `GET /api/analytics/overview` | Analytics generales |
| `GET /api/recent-activity` | Actividad reciente |

## Configuración

Variables de entorno:
- `OPENCLAW_SESSIONS_DIR`: Path a las sesiones (default: `/home/clawd/.openclaw/agents/main/sessions`)

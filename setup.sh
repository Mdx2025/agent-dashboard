#!/bin/bash
set -e

echo "🚀 Agent Dashboard Setup"
echo "========================"

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --quiet -r requirements.txt
deactivate
echo "✅ Backend ready"

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install --quiet
echo "✅ Frontend ready"

# Build frontend
echo ""
echo "🔨 Building frontend for production..."
npm run build 2>/dev/null || echo "⚠️  Build skipped (dev mode only)"

echo ""
echo "========================"
echo "✅ Setup complete!"
echo ""
echo "To run locally:"
echo "  Backend: cd backend && source venv/bin/activate && python main.py"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Or with Docker:"
echo "  docker-compose up --build"

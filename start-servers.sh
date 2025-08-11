#!/bin/bash

echo "🚀 Starting Vendor Onboarding System..."

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f uvicorn 2>/dev/null
pkill -f "next-server" 2>/dev/null

# Create uploads directory
mkdir -p /Users/apple/Developer/vandor-onboarding/backend/uploads

# Start backend
echo "🔧 Starting backend server..."
cd /Users/apple/Developer/vandor-onboarding/backend
nohup python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend
echo "⏳ Waiting for backend to start..."
sleep 3

# Test backend
if curl -f -s http://127.0.0.1:8000/health > /dev/null; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed"
    echo "Backend logs:"
    tail -10 backend.log
fi

# Start frontend
echo "🎨 Starting frontend server..."
cd /Users/apple/Developer/vandor-onboarding/frontend
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🌐 Services:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📊 Check status: curl http://localhost:8000/health"
echo "🔍 View logs:"
echo "   Backend:  tail -f /Users/apple/Developer/vandor-onboarding/backend/backend.log"
echo "   Frontend: tail -f /Users/apple/Developer/vandor-onboarding/frontend/frontend.log"
echo ""
echo "🛑 Stop services:"
echo "   pkill -f uvicorn && pkill -f next-server"
#!/bin/bash

echo "🚀 Starting Vendor Onboarding System in Development Mode..."
echo ""

# Create uploads directory if it doesn't exist
mkdir -p backend/uploads

# Check if backend is already running
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Backend already running on port 8000"
else
    echo "🔧 Starting backend server..."
    source .venv/bin/activate
    cd backend
    python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
    BACKEND_PID=$!
    cd ..
    echo "✅ Backend started (PID: $BACKEND_PID)"
fi

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
until curl -s http://127.0.0.1:8000/health >/dev/null; do
    sleep 1
done
echo "✅ Backend is ready!"

# Check if frontend is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Frontend already running on port 3000"
else
    echo "🔧 Starting frontend server..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
fi

echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "🛑 To stop the servers:"
echo "   pkill -f uvicorn"
echo "   pkill -f next"
echo ""
echo "Press Ctrl+C to stop this script (servers will continue running in background)"

# Keep script running
wait
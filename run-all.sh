#!/bin/bash

# Kill background processes on exit
cleanup() {
    echo "Stopping all systems..."
    kill $MAIN_BACKEND_PID $MAIN_FRONTEND_PID $S2_BACKEND_PID $S2_FRONTEND_PID $ID_GEN_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM EXIT

echo "--- 🚀 STARTING STO. NIÑO PORTAL MULTI-SYSTEM ---"

# --- INSTALLATION CHECK ---
if [ ! -d "node_modules" ] || [ ! -d "system/node_modules" ] || [ ! -d "system1/node_modules" ] || [ ! -d "system2/backend/node_modules" ] || [ "$1" == "--install" ]; then
    echo "📦 [Setup] Missing dependencies or --install flag detected."
    echo "📦 [Setup] Installing all dependencies for all systems (this may take a minute)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ [Setup] Installation failed! Please run 'npm install' manually."
        exit 1
    fi
    echo "✅ [Setup] All dependencies installed successfully."
fi

# --- MAIN SYSTEM ---
echo "[Main] Starting Backend (Port 3001)..."
cd system/backend
node server.js > ../backend.log 2>&1 &
MAIN_BACKEND_PID=$!
cd ../..

echo "[Main] Starting Frontend (Port 3000)..."
cd system
npm run dev -- --port 3000 --host > frontend.log 2>&1 &
MAIN_FRONTEND_PID=$!
cd ..

# --- SYSTEM 2 (Excel Evolution / SF9) ---
echo "[S2] Starting Backend (Port 5001)..."
cd system2/backend
node server.js > backend.log 2>&1 &
S2_BACKEND_PID=$!
# Add a small delay and check if it's still running
sleep 2
if ! ps -p $S2_BACKEND_PID > /dev/null; then
    echo "❌ [S2] Backend (Port 5001) failed to start. Check system2/backend/backend.log"
fi
cd ../..

echo "[S2] Starting Frontend (Port 3002)..."
cd system2
npm run dev -- --port 3002 --host > frontend.log 2>&1 &
S2_FRONTEND_PID=$!
cd ..

# --- SYSTEM 1 (ID Generator) ---
echo "[IDGen] Starting Backend (Port 5002)..."
cd system1
node server.js > idgen.log 2>&1 &
ID_GEN_PID=$!
cd ..

echo "--- ✅ ALL SYSTEMS RUNNING ---"
echo "Main Portal: http://localhost:3000"
echo "Excel/SF9:   http://localhost:3002"
echo "ID Gen API:  http://localhost:5002 (Internal)"
echo "Press Ctrl+C to stop everything."

wait
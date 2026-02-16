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
install_if_missing() {
    local dir=$1
    if [ ! -d "$dir/node_modules" ] || [ "$2" == "--install" ]; then
        echo "📦 [Setup] Installing dependencies in $dir..."
        (cd "$dir" && npm install)
        if [ $? -ne 0 ]; then
            echo "❌ [Setup] Failed to install dependencies in $dir"
            return 1
        fi
    fi
    return 0
}

FORCE_INSTALL=""
if [ "$1" == "--install" ]; then FORCE_INSTALL="--install"; fi

echo "🔍 [Setup] Checking dependencies..."
install_if_missing "." "$FORCE_INSTALL" || exit 1
install_if_missing "system" "$FORCE_INSTALL" || exit 1
install_if_missing "system1" "$FORCE_INSTALL" || exit 1
install_if_missing "system2" "$FORCE_INSTALL" || exit 1
install_if_missing "system2/backend" "$FORCE_INSTALL" || exit 1
echo "✅ [Setup] Dependency check complete."

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
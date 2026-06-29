#!/bin/bash

# Kill background processes on exit
cleanup() {
    echo "Stopping all systems..."
    kill $MAIN_BACKEND_PID $MAIN_FRONTEND_PID $S2_BACKEND_PID $S2_FRONTEND_PID $ID_GEN_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM EXIT

echo "--- 🚀 STARTING STO. NIÑO PORTAL MULTI-SYSTEM ---"

# --- PORT CLEANUP ---
echo "🧹 [Setup] Clearing previous processes on system ports..."
for port in 3000 3001 3002 5001 5002; do
    pid=$(lsof -t -i :$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process $pid on port $port..."
        kill -9 $pid > /dev/null 2>&1
    fi
done
sleep 2 # Give OS time to release ports


# --- INSTALLATION CHECK ---
install_if_missing() {
    local dir=$1
    local force=$2
    
    echo "🔍 [Setup] Verifying $dir..."
    
    if [ "$force" == "true" ]; then
        echo "🧹 [Setup] Cleaning $dir/node_modules..."
        rm -rf "$dir/node_modules" "$dir/package-lock.json"
    fi

    if [ ! -d "$dir/node_modules" ]; then
        echo "📦 [Setup] Installing dependencies in $dir (this may take a while)..."
        npm install --prefix "$dir" --no-audit --no-fund
        if [ $? -ne 0 ]; then
            echo "❌ [Setup] Failed to install dependencies in $dir"
            return 1
        fi
        echo "✅ [Setup] $dir dependencies installed."
    else
        echo "✨ [Setup] $dir dependencies already present."
    fi
    return 0
}

FORCE_INSTALL="false"
if [ "$1" == "--install" ] || [ "$1" == "--clean" ]; then FORCE_INSTALL="true"; fi

echo "🔍 [Setup] System integrity check..."
# Note: we don't install in root anymore since we removed workspaces
install_if_missing "system" "$FORCE_INSTALL" || exit 1
install_if_missing "system1" "$FORCE_INSTALL" || exit 1
install_if_missing "system2" "$FORCE_INSTALL" || exit 1
install_if_missing "system2/backend" "$FORCE_INSTALL" || exit 1
echo "✅ [Setup] All systems verified."

# --- DATABASE INITIALIZATION CHECK ---
if [ ! -f "system/backend/db.sqlite" ]; then
    echo "🗄️ [Setup] Database not found. Seeding initial database..."
    node system/backend/seed.js
    if [ $? -ne 0 ]; then
        echo "❌ [Setup] Failed to seed database."
        exit 1
    fi
    echo "✅ [Setup] Database initialized and seeded."
fi

# --- MAIN SYSTEM ---
echo "[Main] Starting Backend (Port 3001)..."
cd system/backend
node server.js > ../backend.log 2>&1 &
MAIN_BACKEND_PID=$!
sleep 3
if ! ps -p $MAIN_BACKEND_PID > /dev/null; then
    echo "❌ [Main] Backend (Port 3001) failed to start."
    echo "--- 📋 LAST 10 LINES OF system/backend.log ---"
    tail -n 10 ../backend.log
    echo "-----------------------------------------------"
fi
cd ../..

echo "[Main] Starting Frontend (Port 3000)..."
cd system
npm run dev -- --port 3000 --host 127.0.0.1 > frontend.log 2>&1 &
MAIN_FRONTEND_PID=$!
cd ..

# --- SYSTEM 2 (Excel Evolution / SF9) ---
echo "[S2] Starting Backend (Port 5001)..."
# Force clear port 5001 to prevent EADDRINUSE
if lsof -i :5001 > /dev/null 2>&1; then
    echo "⚠️ [S2] Port 5001 is in use. Clearing process..."
    fuser -k 5001/tcp > /dev/null 2>&1
    sleep 1
fi

cd system2/backend
node server.js > backend.log 2>&1 &
S2_BACKEND_PID=$!
# Add a small delay and check if it's still running
sleep 2
if ! ps -p $S2_BACKEND_PID > /dev/null; then
    echo "❌ [S2] Backend (Port 5001) failed to start."
    echo "--- 📋 LAST 10 LINES OF system2/backend/backend.log ---"
    tail -n 10 backend.log
    echo "------------------------------------------------------"
fi
cd ../..

echo "[S2] Starting Frontend (Port 3002)..."
cd system2
npm run dev -- --port 3002 --host 127.0.0.1 > frontend.log 2>&1 &
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
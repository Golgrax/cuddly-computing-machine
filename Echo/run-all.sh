#!/bin/bash

# Start the backend server in the background
echo "Starting backend server..."
node backend/server.js > backend.out.log 2> backend.err.log &

# Wait for a moment to let the backend start
sleep 2

# Start the frontend development server
echo "Starting frontend development server..."
npm run dev

#!/bin/bash

echo "🚀 Starting NUCLEAR INSTALLATION (Full Clean & Reinstall)..."

echo "🧹 Step 1: Removing all node_modules and locks..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name "package-lock.json" -delete

echo "📦 Step 2: Installing Root dependencies..."
npm install --no-audit --no-fund

echo "📦 Step 3: Installing System (Main) dependencies..."
npm install --prefix system --no-audit --no-fund

echo "📦 Step 4: Installing System 1 (ID Gen) dependencies..."
npm install --prefix system1 --no-audit --no-fund

echo "📦 Step 5: Installing System 2 (Frontend) dependencies..."
npm install --prefix system2 --no-audit --no-fund

echo "📦 Step 6: Installing System 2 (Backend) dependencies..."
npm install --prefix system2/backend --no-audit --no-fund

# Seed database if not present
if [ ! -f "system/backend/db.sqlite" ]; then
    echo "🗄️ Database not found. Seeding initial database..."
    node system/backend/seed.js
fi

echo "✅ ALL DEPENDENCIES INSTALLED SUCCESSFULLY!"
echo "👉 You can now run: ./run-all.sh"

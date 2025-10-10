#!/bin/bash
set -e

APP_DIR="/home/ubuntu/rajarani/rajarani-michigan"
FRONTEND_DIR="$APP_DIR/client"
BACKEND_DIR="$APP_DIR/server"

echo "🚀 Stopping backend PM2 process..."
pm2 stop server || true
pm2 delete server || true

echo "📥 Pulling latest code..."
cd "$APP_DIR"
git pull --rebase

echo "🛠 Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm ci

echo "🏗 Building frontend..."
npm run build

echo "🛠 Installing backend dependencies..."
cd "$BACKEND_DIR"
npm ci

echo "▶️ Starting backend on port 5001 with PM2..."
pm2 start npm --name server -- run start

echo "✅ Deployment complete! Frontend is served on port 80 via Nginx, backend on 5001."
pm2 status

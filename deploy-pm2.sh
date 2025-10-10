#!/bin/bash
set -e

# Directories
APP_DIR="/home/ubuntu/rajarani/rajarani-michigan"
FRONTEND_DIR="$APP_DIR/client"
BACKEND_DIR="$APP_DIR/server"

echo "🚀 Stopping all PM2 processes..."
pm2 stop all || true
pm2 delete all || true

echo "📥 Pulling latest code from Git..."
cd "$APP_DIR"
git pull --rebase

echo "🛠 Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm ci

echo "🏗 Building frontend... (this may take a few minutes)"
npm run build

echo "🛠 Installing backend dependencies..."
cd "$BACKEND_DIR"
npm ci

# Install serve globally if not installed
if ! command -v serve &> /dev/null
then
    echo "📦 Installing 'serve' to serve frontend..."
    npm install -g serve
fi

echo "▶️ Starting backend with PM2..."
pm2 start npm --name server -- run start

echo "▶️ Starting frontend on port 80 with PM2..."
pm2 start serve --name client -- "$FRONTEND_DIR/build" -l 80

echo "✅ Deployment complete!"
pm2 status

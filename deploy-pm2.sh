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

# Optional: ensure backend serves frontend
echo "🔧 Ensuring backend serves frontend..."
if ! grep -q "express.static" server.js; then
  echo "⚠️  Remember to add frontend static serving in server.js:"
  echo "app.use(express.static(path.join(__dirname, '../client/build')));"
  echo "app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));"
fi

echo "▶️ Starting backend with PM2..."
pm2 start npm --name server -- run start

echo "✅ Deployment complete!"
pm2 status

#!/bin/bas:qw
#h
set -e

echo "🚀 Stopping all PM2 processes..."
pm2 stop all || true
pm2 delete all || true

echo "📥 Pulling latest code from Git..."
cd /home/ubuntu/rajarani/rajarani-michigan
git pull

echo "🛠 Installing backend dependencies..."
cd server
npm install
echo "▶️ Starting backend with PM2..."
pm2 start npm --name server -- run start

echo "🛠 Installing frontend dependencies..."
cd ../client
npm install

echo "🏗 Building frontend... (this may take a few minutes)"
npm run build

echo "▶️ Starting frontend with PM2..."
pm2 start npm --name client -- run start

echo "✅ Deployment complete!"

echo "lsof -i :5001 --> Pls kill the process manually if needed"
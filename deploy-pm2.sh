#!/bin/bash
set -e

APP_BACKEND="rajarani-server"
APP_FRONTEND="rajarani-client"

echo "📥 Pulling latest code..."
cd /home/ubuntu/rajarani/rajarani-michigan
git pull origin main

# --- Backend ---
echo "🛠 Installing backend..."
cd server
npm install

echo "🔄 Restarting backend..."
pm2 restart $APP_BACKEND || pm2 start npm --name $APP_BACKEND -- run start

# --- Frontend ---
echo "🛠 Installing frontend..."
cd ../client
npm install

echo "🏗 Building frontend..."
npm run build

echo "🔄 Restarting frontend..."
pm2 restart $APP_FRONTEND || pm2 start npm --name $APP_FRONTEND -- run start

pm2 save

echo "✅ Deployment complete (clean & safe)"
#!/bin/bash

# Go to your project root
cd /home/ubuntu/rajarani/rajarani-michigan || exit

echo "🔴 Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

echo "📥 Pulling latest code from Git..."
git pull origin main

# --- Backend Setup ---
echo "⚙️ Installing backend dependencies..."
cd server || exit
npm install

# --- Frontend Setup ---
echo "⚙️ Installing frontend dependencies and building React app..."
cd ../client || exit
npm install
npm run build

# --- Back to server ---
cd ../server || exit

# Start server (Express serves API + React build)
pm2 start index.js --name server

# Save PM2 processes
pm2 save

echo "✅ Deployment completed! Express is serving both API + React build."
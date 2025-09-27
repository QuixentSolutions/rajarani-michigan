#!/bin/bash

# Go to your project root
cd /home/ubuntu/rajarani/rajarani-michigan || exit

echo "🔴 Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

echo "📥 Pulling latest code from Git..."
git pull origin main

# --- Backend Setup ---
echo "⚙️ Installing backend dependencies and starting server..."
cd server || exit
npm install
pm2 start npm --name server -- run start

# --- Frontend Setup ---
echo "⚙️ Installing frontend dependencies and building React app..."
cd ../client || exit
npm install
npm run build

# Serve frontend build with PM2 (static server on port 3000)
#pm2 serve build 3000 --name client --spa
#pm2 serve build 80 --name client --spa
pm2 start "npm start" --name client -- --port 80

# Save PM2 processes
pm2 save

echo "✅ Deployment completed! Server and Client are running under PM2."
~                                                                                                                                                                                                 
~                                                                          
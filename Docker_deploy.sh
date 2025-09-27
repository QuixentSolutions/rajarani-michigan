#!/bin/bash

# Go to project root
cd /home/ubuntu/rajarani/rajarani-michigan || exit

echo "🔴 Stopping and removing old containers..."
docker-compose down

echo "📥 Pulling latest code from Git..."
git pull origin main

echo "⚙️ Rebuilding and starting containers..."
docker-compose up -d --build

echo "✅ Deployment completed!"
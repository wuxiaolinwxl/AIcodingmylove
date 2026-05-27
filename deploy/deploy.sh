#!/bin/bash
set -e

PROJECT_DIR="/var/www/memory-space"
cd "$PROJECT_DIR"

echo "==> Pulling latest code..."
git pull origin main

echo "==> Installing dependencies..."
pnpm install

echo "==> Building backend..."
cd backend
pnpm run build
cd ..

echo "==> Building frontend..."
cd frontend
pnpm run build
cd ..

echo "==> Reloading PM2..."
pm2 reload ecosystem.config.js --env production

echo "==> Deploy complete!"

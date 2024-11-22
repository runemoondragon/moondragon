#!/bin/bash

# Kill any process using port 3000
sudo kill -9 $(sudo lsof -t -i:3000) 2>/dev/null || true

# Stop any running PM2 processes
pm2 delete runecheck 2>/dev/null || true

# Navigate to project directory
cd /root/moondragon

# Pull latest changes
git pull

# Install dependencies
npm install

# Create .env.production if it doesn't exist
if [ ! -f .env.production ]; then
    cp .env.example .env.production
fi

# Temporarily disable ESLint warnings for deployment
export DISABLE_ESLINT_PLUGIN=true

# Build the project
npm run build

# Ensure proper permissions
sudo chown -R www-data:www-data .next
sudo chmod -R 755 .next

# Ensure data directory exists with proper permissions
mkdir -p data
sudo chown -R www-data:www-data data
sudo chmod -R 777 data

# Create logs directory
mkdir -p logs
chmod 777 logs

# Start with PM2 using ecosystem config
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Restart Nginx
sudo systemctl restart nginx

# Show logs
pm2 logs runecheck --lines 50
#!/bin/bash

# Stop any running PM2 processes
pm2 stop runecheck || true

# Navigate to project directory (update this path)
cd /root/moondragon

# Pull latest changes
git pull

# Install dependencies
npm install

# Build the project
npm run build

# Ensure data directory exists with proper permissions
mkdir -p data
chmod 777 data

# Start with PM2
pm2 start npm --name "runecheck" -- start

# Save PM2 process list
pm2 save
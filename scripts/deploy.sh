#!/bin/bash

# Stop execution if any command fails
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Fix permissions for the current user
echo "🔒 Fixing local permissions..."
sudo chown -R ubuntu:ubuntu .
sudo chmod -R 755 .

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Clean .next directory if it exists
echo "🧹 Cleaning build directory..."
rm -rf .next

# Build the application
echo "🔨 Building application..."

# Generate dashboard pages
echo "📄 Generating dashboard pages..."
node -r @swc-node/register src/scripts/generateDashboards.ts

npm run build

# Create directory if it doesn't exist
echo "📁 Setting up directory..."
sudo mkdir -p /var/www/bitboard

# Copy build files
echo "📋 Copying build files..."
sudo cp -r .next /var/www/bitboard/

# Copy public directory contents
echo "📋 Copying public assets..."
sudo cp -r public/* /var/www/bitboard/public/

# Set permissions for web server
echo "🔒 Setting web server permissions..."
sudo chown -R www-data:www-data /var/www/bitboard
sudo chmod -R 755 /var/www/bitboard

# Ensure public directory exists and is maintained during deployments
echo "📁 Maintaining public directory..."
sudo mkdir -p /var/www/bitboard/public
sudo chown -R www-data:www-data /var/www/bitboard/public
sudo chmod -R 755 /var/www/bitboard/public

# Ensure data directory exists and copy files
echo "📋 Setting up data files..."
sudo mkdir -p /var/www/bitboard/data
sudo cp -r data/*.json /var/www/bitboard/data/
sudo chown -R www-data:www-data /var/www/bitboard/data
sudo chmod -R 664 /var/www/bitboard/data/*.json

# Restart the application with PM2
echo "🔄 Restarting application..."
pm2 delete all || true  # Delete all processes, don't fail if none exist
pm2 start ecosystem.config.js
pm2 save

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment completed!"
#!/bin/bash

# Stop execution if any command fails
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Create directory if it doesn't exist
echo "📁 Setting up directory..."
sudo mkdir -p /var/www/bitboard

# Copy build files
echo "📋 Copying build files..."
sudo cp -r .next /var/www/bitboard/

# Set permissions
echo "🔒 Setting permissions..."
sudo chown -R www-data:www-data /var/www/bitboard
sudo chmod -R 755 /var/www/bitboard

# Restart the application
echo "🔄 Restarting application..."
pm2 restart bitboard

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment completed!"
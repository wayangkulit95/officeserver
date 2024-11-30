#!/bin/bash

# Exit on any error
set -e

# Print each command to stdout
set -x

# Update and upgrade the system packages
echo "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js (using the NodeSource repository)
echo "Installing Node.js and npm..."

# Install Node.js (LTS version, you can update this based on your needs)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Check if Node.js and npm are installed
node -v
npm -v

# Install Git if it's not already installed
echo "Installing Git..."
sudo apt-get install -y git

# Navigate to your app's directory
APP_DIR="/root/myapp"  # Change to your desired application directory
mkdir -p "$APP_DIR"           # Create the app directory if it doesn't exist
cd "$APP_DIR"

# Download your script
echo "Downloading app.js..."
curl -O https://raw.githubusercontent.com/wayangkulit95/officeserver/main/app.js

# Install project dependencies
echo "Installing project dependencies..."
npm install

# Give proper permissions to the uploaded files (if using an 'uploads' folder)
# This ensures the Node.js process has permission to read/write files.
echo "Setting permissions for uploads directory..."
sudo chmod -R 755 ./uploads

# Create a systemd service to run your app as a background process (optional)
# You may need sudo privileges for this part

echo "Creating systemd service for Node.js app..."

cat <<EOL | sudo tee /etc/systemd/system/file-manager.service
[Unit]
Description=File Manager Node.js Application
After=network.target

[Service]
ExecStart=/usr/bin/node /var/www/file-manager/app.js
WorkingDirectory=/var/www/file-manager
Environment=NODE_ENV=production
Restart=always
User=www-data
Group=www-data
ExecReload=/bin/kill -HUP \$MAINPID
TimeoutSec=10
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd to register the new service
sudo systemctl daemon-reload

# Enable and start the service
echo "Enabling and starting the service..."
sudo systemctl enable file-manager
sudo systemctl start file-manager

# Open the firewall (optional, if using UFW)
echo "Opening port 3000 in the firewall..."
sudo ufw allow 3000

# Print a success message
echo "Installation complete. Your app is running on http://your-server-ip:3000"

# Optional: Open browser on the server (if GUI is available)
# xdg-open http://localhost:3000


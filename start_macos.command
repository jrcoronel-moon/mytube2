#!/bin/bash
cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install it from https://nodejs.org"
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Building MyTube2..."
npm run build || { echo "Build failed."; read -p "Press Enter to exit..."; exit 1; }

echo "Starting MyTube2..."
node server.js

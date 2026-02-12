#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Check node
command -v node &> /dev/null || { osascript -e 'display alert "Node.js not found" message "Install it from https://nodejs.org"'; exit 1; }

# Build
npm run build > /tmp/mytube2-build.log 2>&1 || { osascript -e 'display alert "Build failed" message "Check /tmp/mytube2-build.log"'; exit 1; }

# Launch server detached
nohup node server.js > /tmp/mytube2.log 2>&1 &

# Exit immediately so Terminal window closes
exit 0

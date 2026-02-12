@echo off
title MyTube2
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Please install it from https://nodejs.org
    pause
    exit /b 1
)

echo Building MyTube2...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed.
    pause
    exit /b 1
)

echo Starting MyTube2...
node server.js
pause

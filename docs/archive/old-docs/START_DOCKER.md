# Starting Docker - Quick Guide

Docker is installed but the Docker daemon is not running.

## Step 1: Start Docker Desktop

1. **Open Docker Desktop**
   - Search for "Docker Desktop" in Windows Start menu
   - Click on it to launch

2. **Wait for Docker to Start**
   - Look for the Docker whale icon in your system tray (bottom right)
   - Wait until it shows "Docker Desktop is running" (this takes 30-60 seconds)
   - The icon should be solid (not animated)

3. **Verify Docker is Running**
   - Once ready, we'll verify it's working

## Alternative: Start Docker from Command Line

If Docker Desktop is installed but not running, you can try:

```powershell
# Try starting Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

Then wait 30-60 seconds for it to fully start.

## What to Do Next

Once Docker Desktop is running (green/steady icon in system tray), let me know and I'll continue with:
1. Starting the database containers
2. Setting up the database
3. Starting the development servers

---

**Note**: If you don't have Docker Desktop installed, you can download it from:
https://www.docker.com/products/docker-desktop/

Or we can use a local PostgreSQL installation instead.



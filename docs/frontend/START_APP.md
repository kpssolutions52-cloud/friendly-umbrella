# Starting the Application - Step by Step

## Issues Found & Fixed

1. ✅ TypeScript errors in productRoutes.ts - Fixed
2. ⏳ Frontend dependencies missing - Installing now
3. ⚠️ Docker not running - Will work without it for UI testing

## Quick Start Command

Run this single command from the project root:

```bash
npm run dev
```

This starts both backend and frontend servers.

## Manual Start (if needed)

### Terminal 1 - Backend:
```bash
cd packages/backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd packages/frontend
npm run dev
```

## Access the Application

Once servers are running:

1. **Frontend**: http://localhost:3000
2. **Backend Health**: http://localhost:8000/health

## If Frontend Dependencies Are Missing

Run from project root:
```bash
cd packages/frontend
npm install
```

Or install all dependencies:
```bash
npm install
```

## Troubleshooting

### PowerShell Script Error?
Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use?
- Kill processes on ports 3000 or 8000
- Or change ports in .env files

### Can't Connect?
- Wait 30 seconds for servers to compile
- Check terminal for errors
- Try refreshing the browser


# Fixing "ERR_CONNECTION_REFUSED" Error

## The Problem

You're seeing `ERR_CONNECTION_REFUSED` because the servers aren't running yet.

## Solution: Start the Servers

### Option 1: Start Both Servers Together (Recommended)

**Open a new terminal** in the project folder and run:

```bash
npm run dev
```

Wait 30-60 seconds, then:
- Open http://localhost:3000

### Option 2: Start Servers Separately

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
```

Wait until you see: `🚀 Server running on port 8000`

**Terminal 2 - Frontend:**
```bash
cd packages/frontend  
npm run dev
```

Wait until you see: `Ready on http://localhost:3000`

## Verify Servers Are Running

### Check Backend:
Open: http://localhost:8000/health

Should show:
```json
{"status":"ok","timestamp":"..."}
```

### Check Frontend:
Open: http://localhost:3000

Should show the landing page.

## Common Issues

### 1. Port Already in Use
If you see "port already in use":
- Kill the process using that port
- Or change the port in `.env` files

### 2. TypeScript Compilation Errors
- Wait for compilation to finish (30-60 seconds)
- Check terminal for specific errors
- Fix any TypeScript errors shown

### 3. Missing Dependencies
If you see "module not found":
```bash
npm install
```

### 4. Database Connection Errors
- These won't prevent the UI from loading
- You can still test the frontend structure
- Fix database connection later

## What's Happening Now

I'm starting the backend server in the background. 

**Next Steps:**
1. Wait 20-30 seconds
2. Open a NEW terminal
3. Run: `npm run dev:frontend` (or `npm run dev` for both)
4. Wait another 30 seconds
5. Open http://localhost:3000

## Quick Command

Just run this from project root:
```bash
npm run dev
```

Then wait and open http://localhost:3000!


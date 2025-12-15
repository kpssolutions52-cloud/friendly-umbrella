# 🚀 How to Start the Application

## Simple Instructions

### Step 1: Open a Terminal

Open PowerShell or Command Prompt in the project folder:
```
C:\Users\kasun\OneDrive\Desktop\Projects\friendly-umbrella
```

### Step 2: Run This Command

```bash
npm run dev
```

This will:
- Start the backend server on http://localhost:8000
- Start the frontend server on http://localhost:3000
- Show logs from both servers

**Wait 30-60 seconds** for the servers to compile and start.

### Step 3: Open Your Browser

Go to: **http://localhost:3000**

You should see the landing page!

## If You Get Errors

### Missing Dependencies
If you see "module not found" errors:
```bash
npm install
```

### Port Already in Use
If ports 3000 or 8000 are already in use:
- Close other applications using those ports
- Or restart your computer

### TypeScript Errors
The code should compile. If you see TypeScript errors, let me know and I'll fix them.

## What You'll See

1. **Landing Page** (http://localhost:3000)
   - "Construction Pricing Platform" title
   - Login and Register buttons

2. **After Login/Register**
   - Dashboard with your account type
   - Basic UI structure

## Quick Test

To test if servers are running:

- **Backend**: http://localhost:8000/health
  - Should show: `{"status":"ok","timestamp":"..."}`
  
- **Frontend**: http://localhost:3000
  - Should show the landing page

## Need Help?

The servers are starting in the background. Wait about 30 seconds, then:
1. Open http://localhost:3000
2. If it doesn't load, wait a bit more and refresh
3. Check the terminal for any error messages

---

**Just run: `npm run dev` and wait 30 seconds, then open http://localhost:3000!**


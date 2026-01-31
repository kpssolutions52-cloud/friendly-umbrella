# 🚀 Start Servers Now - Step by Step

## The Error You're Seeing

`ERR_CONNECTION_REFUSED` means the servers aren't running. Let's start them!

## ⚡ Quick Start (Copy & Paste These Commands)

### Step 1: Open a New Terminal

Open PowerShell or Command Prompt in your project folder.

### Step 2: Start the Servers

Run this **single command**:

```bash
npm run dev
```

### Step 3: Wait 30-60 Seconds

You'll see output like:
```
🚀 Server running on port 8000
Ready on http://localhost:3000
```

### Step 4: Open Your Browser

Go to: **http://localhost:3000**

## 🔧 If That Doesn't Work - Start Separately

### Terminal 1 - Backend:

```bash
cd packages\backend
npm run dev
```

**Look for this message:**
```
🚀 Server running on port 8000
```

**If you see errors**, share them and I'll help fix!

### Terminal 2 - Frontend:

Open a **NEW terminal** and run:

```bash
cd packages\frontend
npm run dev
```

**Look for this message:**
```
- Local:   http://localhost:3000
```

## ✅ Verify Servers Are Running

### Test Backend:
- Open: http://localhost:8000/health
- Should show: `{"status":"ok","timestamp":"..."}`

### Test Frontend:
- Open: http://localhost:3000
- Should show landing page

## 🐛 Common Issues & Fixes

### Issue 1: "Cannot find module"
**Fix:** Run this first:
```bash
npm install
```

### Issue 2: TypeScript errors
**What to do:**
1. Wait for compilation (30-60 seconds)
2. Check terminal for specific errors
3. Share the errors with me if they persist

### Issue 3: Port already in use
**Fix:**
- Close other programs using ports 3000/8000
- Or kill the process:
```bash
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Issue 4: PowerShell execution policy
**Fix:** Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📋 Checklist

Before starting:
- [ ] You're in the project root folder
- [ ] Dependencies are installed (`npm install` was run)
- [ ] Docker containers are running (for database) - optional for UI testing
- [ ] Ports 3000 and 8000 are free

## 🎯 What Should Happen

1. Run `npm run dev`
2. See compilation messages in terminal
3. Wait 30-60 seconds
4. See "Server running" messages
5. Open http://localhost:3000
6. See the landing page! ✅

## 💡 Pro Tip

Keep the terminal visible to see:
- Compilation progress
- Any errors
- Server status messages

---

**Try this now:**
1. Open a terminal
2. Run: `npm run dev`
3. Wait 30 seconds
4. Open: http://localhost:3000

If you see any errors in the terminal, copy them and share with me!


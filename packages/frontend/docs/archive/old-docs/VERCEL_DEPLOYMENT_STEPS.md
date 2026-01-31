# Vercel Deployment Steps - Step by Step

## ✅ Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up or login with your GitHub account
3. Click **"Add New Project"** or **"Import Project"**
4. Select your repository: `friendly-umbrella` (or your repo name)
5. Click **"Import"**

---

## ✅ Step 2: Configure Project Settings

Vercel will auto-detect Next.js, but verify these settings:

### Framework Preset
- **Next.js** (should be auto-detected)

### Root Directory
- Click **"Edit"** next to Root Directory
- Select: **`packages/frontend`**
- Click **"Continue"**

### Build and Output Settings
- **Build Command**: `cd ../.. && npm install && cd packages/shared && npm run build && cd ../frontend && npm run build`
  - Or use: `npm run build` (Vercel will run from rootDirectory)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

---

## ✅ Step 3: Set Environment Variables

**Before deploying**, click **"Environment Variables"** and add:

### Required Variables:

```
NEXT_PUBLIC_API_URL=https://friendly-umbrella-production.up.railway.app
NEXT_PUBLIC_WS_URL=wss://friendly-umbrella-production.up.railway.app
```

### How to Add:
1. Click **"Add"** button
2. **Key**: `NEXT_PUBLIC_API_URL`
3. **Value**: `https://friendly-umbrella-production.up.railway.app`
4. **Environment**: Select all (Production, Preview, Development)
5. Click **"Save"**
6. Repeat for `NEXT_PUBLIC_WS_URL`

---

## ✅ Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 2-5 minutes)
3. You'll see build logs in real-time
4. Once complete, you'll get a URL like: `https://your-project-name.vercel.app`

---

## ✅ Step 5: Update Backend CORS

After deployment, update your backend to allow requests from Vercel:

1. Go to **Railway Dashboard** → Your Backend Service
2. Click **Variables** tab
3. Find or add `CORS_ORIGIN`
4. Set value to your Vercel URL: `https://your-project-name.vercel.app`
5. Railway will automatically redeploy

---

## ✅ Step 6: Test Deployment

1. **Visit your Vercel URL**: `https://your-project-name.vercel.app`
2. **Test Registration**: Try registering a new supplier/company
3. **Test Login**: Try logging in with your super admin account
4. **Check Browser Console**: Open DevTools → Console, look for any errors

---

## 🔧 Troubleshooting

### Build Fails: "Cannot find module '@platform/shared'"
**Fix**: Make sure Root Directory is set to `packages/frontend` and install command runs from root.

### Build Fails: "TypeScript errors"
**Fix**: These are usually warnings. Check if build actually failed or just has warnings.

### API Connection Errors
**Fix**: 
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend CORS_ORIGIN includes your Vercel URL
- Check backend is running (test `/health` endpoint)

### WebSocket Connection Errors
**Fix**:
- Verify `NEXT_PUBLIC_WS_URL` uses `wss://` (secure WebSocket)
- Check backend WebSocket is enabled

---

## 📝 Quick Reference

**Vercel URL Format**: `https://your-project-name.vercel.app`

**Environment Variables Needed**:
- `NEXT_PUBLIC_API_URL` → Your Railway backend URL
- `NEXT_PUBLIC_WS_URL` → Your Railway backend WebSocket URL (wss://)

**Backend CORS Update**:
- `CORS_ORIGIN` → Your Vercel frontend URL

---

## 🎉 You're Done!

Once deployed, your full-stack application will be live:
- **Frontend**: Vercel (Next.js)
- **Backend**: Railway (Node.js/Express)
- **Database**: Supabase (PostgreSQL)


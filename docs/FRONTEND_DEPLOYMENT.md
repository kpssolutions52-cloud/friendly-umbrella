# Frontend Deployment Guide

## Option 1: Deploy on Railway (Same Platform as Backend)

### Pros:
- ✅ Everything in one place
- ✅ Same billing/account
- ✅ Easy to manage

### Cons:
- ⚠️ Not optimized for Next.js (slower builds)
- ⚠️ Uses more resources than Vercel

### Steps:

1. **Create New Service in Railway**
   - Railway Dashboard → New Project (or add to existing)
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect it's a monorepo

2. **Configure Service**
   - **Root Directory**: Leave empty (or set to `packages/frontend` if Railway supports it)
   - **Build Command**: Will use `nixpacks.toml` automatically
   - **Start Command**: Will use `nixpacks.toml` automatically

3. **Set Environment Variables**
   In Railway Dashboard → Your Frontend Service → Variables:
   ```
   NEXT_PUBLIC_API_URL=https://friendly-umbrella-production.up.railway.app
   NEXT_PUBLIC_WS_URL=wss://friendly-umbrella-production.up.railway.app
   NODE_ENV=production
   PORT=3000
   ```

4. **Update Backend CORS**
   In Railway Dashboard → Your Backend Service → Variables:
   ```
   CORS_ORIGIN=https://your-frontend-url.up.railway.app
   ```
   (Replace with your actual Railway frontend URL)

---

## Option 2: Deploy on Vercel (Recommended for Next.js)

### Pros:
- ✅ Optimized for Next.js (faster builds, better performance)
- ✅ Free tier is generous
- ✅ Automatic HTTPS
- ✅ Edge functions support
- ✅ Better Next.js features

### Cons:
- ⚠️ Different platform from backend

### Steps:

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "Add New Project"
   - Import your repository

2. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `cd ../.. && npm install` (for monorepo)

3. **Set Environment Variables**
   In Vercel Dashboard → Your Project → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://friendly-umbrella-production.up.railway.app
   NEXT_PUBLIC_WS_URL=wss://friendly-umbrella-production.up.railway.app
   ```

4. **Update Backend CORS**
   In Railway Dashboard → Your Backend Service → Variables:
   ```
   CORS_ORIGIN=https://your-project-name.vercel.app
   ```
   (Replace with your actual Vercel URL)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your frontend will be live at `https://your-project-name.vercel.app`

---

## Recommendation

**Use Vercel for frontend** - It's free, optimized for Next.js, and you're already using Railway for backend. Having them on different platforms is fine and actually common.

**Use Railway for frontend** - Only if you want everything in one place, but builds will be slower.

---

## After Deployment

1. **Test the frontend URL**
2. **Update backend CORS_ORIGIN** with your frontend URL
3. **Test login/registration** from the deployed frontend
4. **Check browser console** for any API connection errors


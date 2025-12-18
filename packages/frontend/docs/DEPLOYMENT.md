# Deployment Guide

This guide will help you deploy both the frontend and backend of the Construction Pricing Platform to free hosting services with Supabase support.

## Recommended Hosting Solution

**Single Platform Deployment: [Render.com](https://render.com)**

You can deploy **both frontend and backend** on Render.com using their free tier:
- **Backend (Express)**: Web Service
- **Frontend (Next.js)**: Web Service (runs Next.js server)

This simplifies deployment by using one platform, one dashboard, and one set of credentials.

### Alternative: Split Deployment

If you prefer, you can also use:
- **Frontend**: [Vercel](https://vercel.com) - Optimized for Next.js
- **Backend**: [Render.com](https://render.com) - Node.js support

See the "Alternative: Split Deployment" section below for this approach.

---

## Prerequisites

1. **Supabase Database Setup**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your database connection string from Supabase Dashboard → Settings → Database
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1`
   - Run migrations: `npm run db:migrate` (or use Supabase SQL editor)

2. **GitHub Account**
   - Push your code to a GitHub repository
   - Both Vercel and Render can deploy directly from GitHub

3. **Accounts**
   - [Render Account](https://render.com/signup) (only one needed!)

---

## Option 1: Deploy Both on Render.com (Recommended)

This is the simplest approach - everything in one place!

### Step 1: Deploy Backend to Render.com

### 1.1 Prepare Your Repository

Make sure your code is pushed to GitHub.

### 1.2 Create New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository

### 1.3 Configure Backend Service

**Service Settings:**
- **Name**: `construction-pricing-backend` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (root of repo)
- **Build Command**: 
  ```bash
  npm install && cd packages/backend && npm run db:generate && npm run build
  ```
- **Start Command**: 
  ```bash
  cd packages/backend && npm start
  ```

### 1.4 Set Environment Variables

In Render dashboard, go to **Environment** tab and add:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
JWT_SECRET=[GENERATE_A_RANDOM_SECRET_STRING]
JWT_REFRESH_SECRET=[GENERATE_ANOTHER_RANDOM_SECRET_STRING]
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-url.vercel.app
API_URL=https://your-backend-url.onrender.com
LOG_LEVEL=info
```

**Important Notes:**
- Replace `[YOUR-PASSWORD]` and `[YOUR-PROJECT-REF]` with your Supabase credentials
- Generate strong random strings for JWT secrets (you can use: `openssl rand -base64 32`)
- Set `CORS_ORIGIN` and `API_URL` after deploying frontend (you'll update these later)

### 1.5 Deploy

1. Click **"Create Web Service"**
2. Render will build and deploy your backend
3. Wait for deployment to complete (usually 5-10 minutes)
4. Note your backend URL: `https://your-service-name.onrender.com`

### 1.6 Run Database Migrations

After first deployment, you need to run Prisma migrations:

1. In Render dashboard, go to **Shell** tab
2. Run:
   ```bash
   cd packages/backend
   npm run db:migrate:deploy
   ```

Or use Supabase SQL Editor to run migrations manually.

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select your repository

### 2.2 Configure Frontend Project

**Project Settings:**
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `packages/frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 2.3 Set Environment Variables

In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-backend-url.onrender.com
```

**Important:**
- Replace `your-backend-url.onrender.com` with your actual Render backend URL
- Use `wss://` (secure WebSocket) for production

### 2.4 Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Wait for deployment to complete (usually 2-5 minutes)
4. Note your frontend URL: `https://your-project-name.vercel.app`

---

## Step 3: Update CORS and API URLs

After both services are deployed:

### 3.1 Update Backend CORS

1. Go back to Render dashboard → Your backend service
2. Go to **Environment** tab
3. Update `CORS_ORIGIN` to your Vercel frontend URL:
   ```
   CORS_ORIGIN=https://your-project-name.vercel.app
   ```
4. Update `API_URL` to your Render backend URL:
   ```
   API_URL=https://your-backend-url.onrender.com
   ```
5. Render will automatically redeploy

### 3.2 Verify Frontend Environment Variables

1. Go to Vercel dashboard → Your project
2. Verify environment variables are set correctly
3. If you need to update them, Vercel will trigger a new deployment

---

## Step 4: Test Your Deployment

1. **Test Backend Health Check:**
   ```
   https://your-backend-url.onrender.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test Frontend:**
   - Visit your Vercel URL
   - Try logging in or registering
   - Check browser console for any errors

3. **Test WebSocket Connection:**
   - Open browser DevTools → Network → WS
   - Navigate to a page that uses WebSocket
   - Verify connection is established

---

## Troubleshooting

### Backend Issues

**Problem: Database connection errors**
- Verify `DATABASE_URL` is correct
- Check Supabase connection pooling settings
- Ensure migrations have been run

**Problem: CORS errors**
- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Check for trailing slashes

**Problem: Build fails**
- Check Render build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version (should be 20+)

### Frontend Issues

**Problem: API calls fail**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend is running and accessible

**Problem: WebSocket connection fails**
- Verify `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`)
- Check backend WebSocket configuration
- Verify CORS allows WebSocket connections

### Render Free Tier Limitations

- **Spins down after 15 minutes of inactivity**
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid plan for production

### Vercel Free Tier Limitations

- **100GB bandwidth/month**
- **100 builds/month**
- Usually sufficient for small to medium projects

---

## Alternative Hosting Options

If Render.com doesn't work for you, consider:

1. **Railway.app** - Similar to Render, good free tier
2. **Fly.io** - Good for Docker deployments
3. **Heroku** - Requires credit card but has free tier options
4. **Backend on Railway + Frontend on Vercel** - Another good combination

---

## Production Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] JWT secrets are strong and secure
- [ ] HTTPS enabled (automatic on both platforms)
- [ ] Health check endpoint working
- [ ] WebSocket connections working
- [ ] Test user registration and login
- [ ] Monitor error logs in both platforms
- [ ] Set up custom domain (optional)

---

## Updating Your Deployment

### Backend Updates

1. Push changes to GitHub
2. Render automatically detects and redeploys
3. Monitor deployment logs

### Frontend Updates

1. Push changes to GitHub
2. Vercel automatically detects and redeploys
3. Monitor deployment logs

### Database Migrations

After code changes that include schema changes:

1. Update Prisma schema
2. Generate migration: `npm run db:migrate`
3. Commit and push
4. Run migration on Render (via Shell) or Supabase SQL Editor

---

## Support

- **Render Documentation**: https://render.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs

---

## Cost Summary

**Free Tier:**
- Vercel: Free (with limitations)
- Render: Free (with limitations)
- Supabase: Free tier available

**Total Monthly Cost: $0** (for development/small projects)

For production with higher traffic, consider:
- Render: $7/month (no spin-down)
- Vercel Pro: $20/month (more features)
- Supabase Pro: $25/month (more database resources)


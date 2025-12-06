# Manual Deployment Guide

This guide explains how to disable automatic deployments and set up manual deployment triggers for Railway and Vercel.

## Overview

By default, Railway and Vercel can automatically deploy on every push to your repository. This guide shows you how to disable auto-deploy and only deploy manually when needed.

---

## Disable Auto-Deploy in Railway

### Step 1: Access Railway Service Settings

1. Go to [Railway Dashboard](https://railway.app)
2. Select your backend service
3. Click on **Settings** tab

### Step 2: Disable GitHub Auto-Deploy

1. Scroll down to **"Source"** or **"GitHub"** section
2. Look for **"Auto Deploy"** or **"Automatic Deployments"** toggle
3. **Turn OFF** the auto-deploy option
4. Save changes

### Step 3: Manual Deployment Options

After disabling auto-deploy, you can deploy manually using:

**Option A: Railway Dashboard**
1. Go to your service
2. Click **"Deploy"** or **"Redeploy"** button
3. Select the branch/commit you want to deploy

**Option B: GitHub Actions (Recommended)**
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **"KPS FEBE CI/CD"** workflow
4. Click **"Run workflow"** button
5. Select branch and click **"Run workflow"**

---

## Disable Auto-Deploy in Vercel

### Step 1: Access Vercel Project Settings

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your frontend project
3. Click on **Settings** tab

### Step 2: Disable GitHub Auto-Deploy

1. Go to **"Git"** section in Settings
2. Find **"Production Branch"** settings
3. Look for **"Automatic deployments"** or **"Auto-deploy"** option
4. **Uncheck** or **disable** automatic deployments
5. Save changes

### Step 3: Manual Deployment Options

After disabling auto-deploy, you can deploy manually using:

**Option A: Vercel Dashboard**
1. Go to your project
2. Click **"Deployments"** tab
3. Click **"Redeploy"** button next to any deployment
4. Or click **"Deploy"** → **"Deploy from Git"** to deploy a specific branch/commit

**Option B: GitHub Actions (Recommended)**
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **"KPS FEBE CI/CD"** workflow
4. Click **"Run workflow"** button
5. Select branch and click **"Run workflow"**

---

## Manual Deployment via GitHub Actions

### How to Trigger Manual Deployment

1. **Go to GitHub Repository**
   - Navigate to your repository on GitHub

2. **Open Actions Tab**
   - Click on **"Actions"** tab in the repository

3. **Select Workflow**
   - Click on **"KPS FEBE CI/CD"** workflow from the left sidebar

4. **Run Workflow**
   - Click the **"Run workflow"** dropdown button (top right)
   - Select the branch (usually `main`)
   - Click **"Run workflow"** button

5. **Monitor Deployment**
   - Watch the workflow run in real-time
   - Both backend (Railway) and frontend (Vercel) will deploy
   - Check logs if any step fails

### What Gets Deployed

When you manually trigger the workflow:
- ✅ **Test & Build**: Runs tests and builds both frontend and backend
- ✅ **Deploy Backend**: Deploys to Railway
- ✅ **Deploy Frontend**: Deploys to Vercel

---

## Benefits of Manual Deployment

✅ **Control**: Deploy only when you're ready  
✅ **Testing**: Test changes locally before deploying  
✅ **Stability**: Avoid deploying broken code  
✅ **Cost**: Better control over resource usage  
✅ **Review**: Review changes before going live  

---

## Re-enable Auto-Deploy (If Needed)

If you want to re-enable automatic deployments later:

### Railway
1. Go to Service → Settings
2. Turn ON **"Auto Deploy"** toggle
3. Save changes

### Vercel
1. Go to Project → Settings → Git
2. Enable **"Automatic deployments"**
3. Save changes

### GitHub Actions
1. Edit `.github/workflows/ci-cd.yml`
2. Add back the `push` trigger:
   ```yaml
   on:
     push:
       branches: [main]
     workflow_dispatch:
   ```
3. Commit and push changes

---

## Troubleshooting

### Railway deployment fails
- Check Railway service is active
- Verify `RAILWAY_TOKEN` and `RAILWAY_SERVICE_ID` secrets are set
- Check Railway logs for errors

### Vercel deployment fails
- Verify all Vercel secrets are set (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)
- Check Vercel dashboard for deployment errors
- Ensure project is linked to GitHub repository

### Workflow not appearing
- Make sure workflow file is in `.github/workflows/` directory
- Check workflow file syntax is correct
- Verify you're on the correct branch

---

## Summary

✅ **Railway**: Disable auto-deploy in Service Settings  
✅ **Vercel**: Disable auto-deploy in Project Settings → Git  
✅ **GitHub Actions**: Only `workflow_dispatch` trigger (manual only)  
✅ **Deploy**: Use GitHub Actions "Run workflow" button  

Now you have full control over when deployments happen!


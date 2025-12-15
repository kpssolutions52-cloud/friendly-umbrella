# How to Disable Auto-Deploy in Railway

This guide shows you exactly how to disable automatic deployments in Railway so you can control when deployments happen.

---

## Quick Steps

1. **Go to Railway Dashboard** → Select your service
2. **Click Settings** (gear icon)
3. **Find "Source" section**
4. **Turn OFF "Auto Deploy" toggle**
5. **Done!** Railway will no longer deploy on each commit

---

## Detailed Step-by-Step Instructions

### Step 1: Navigate to Your Service

1. Open [Railway Dashboard](https://railway.app)
2. Log in to your account
3. Click on your **Project** (the container that holds your services)
4. Click on your **Backend Service** (the service you want to configure)

### Step 2: Open Settings

You can access Settings in two ways:

**Option A:**
- Click the **gear icon (⚙️)** in the top right corner of the service page

**Option B:**
- Look for **"Settings"** in the left sidebar menu
- Click on it

### Step 3: Find Source Section

1. In the Settings page, scroll down
2. Look for the **"Source"** section
   - This section shows your GitHub repository connection
   - It displays the repository name and branch

### Step 4: Disable Auto-Deploy

1. In the **"Source"** section, you'll see an option like:
   - ✅ **"Auto Deploy"** (toggle switch)
   - ✅ **"Automatic Deployments"** (checkbox)
   - ✅ **"Deploy on Push"** (toggle)
   - ✅ **"Auto Deploy from GitHub"** (switch)

2. **Turn OFF** or **Uncheck** this option
   - Click the toggle to turn it OFF
   - Or uncheck the checkbox

3. The setting saves automatically (or click **Save** if prompted)

### Step 5: Verify It's Disabled

After disabling, you should see:
- ✅ Toggle is now in the OFF position (grayed out)
- ✅ Checkbox is unchecked
- ✅ Status may show "Manual Deploy Only" or similar message

---

## Visual Guide

```
Railway Dashboard
├── Your Project
    └── Your Service
        ├── Deployments (tab)
        ├── Metrics (tab)
        ├── Logs (tab)
        └── Settings (tab) ← Click here
            └── Source Section
                └── [ ] Auto Deploy ← Turn this OFF
```

---

## What Happens After Disabling

✅ **Before**: Every commit to `main` branch → Automatic deployment  
✅ **After**: Commits to `main` branch → No deployment (manual only)

### How to Deploy Manually

Once auto-deploy is disabled, you can deploy manually using:

**Option 1: Railway Dashboard**
1. Go to your service
2. Click **"Deployments"** tab
3. Click **"Redeploy"** button (next to any previous deployment)
4. Or click **"Deploy"** → Select branch/commit → Click **"Deploy"**

**Option 2: Railway CLI**
```bash
railway up --service YOUR_SERVICE_ID
```

**Option 3: GitHub Actions**
- Use the manual workflow trigger (workflow_dispatch)
- Go to GitHub → Actions → Run workflow

---

## Re-enable Auto-Deploy (If Needed Later)

If you want to re-enable automatic deployments:

1. Go to Service → Settings → Source
2. Turn ON the **"Auto Deploy"** toggle
3. Save changes
4. Railway will now deploy automatically on each commit

---

## Troubleshooting

### Can't Find "Source" Section
- Make sure you're in the **Service Settings**, not Project Settings
- The Source section only appears if GitHub is connected
- If you don't see it, you may need to connect GitHub first

### Toggle is Grayed Out / Disabled
- Check if you have the correct permissions
- You need to be the project owner or have admin access
- Try refreshing the page

### Still Auto-Deploying After Disabling
- Make sure you saved the changes
- Check if there are multiple services (disable for each one)
- Verify you're looking at the correct service
- Try disconnecting and reconnecting GitHub

### No GitHub Integration
If your service doesn't have GitHub connected:
- Auto-deploy won't be an option
- You're already on manual deployment
- Connect GitHub in Settings → Source if you want the option

---

## Summary

✅ **Disable Auto-Deploy**: Settings → Source → Turn OFF "Auto Deploy"  
✅ **Manual Deploy**: Use Railway Dashboard, CLI, or GitHub Actions  
✅ **Re-enable**: Same location, turn toggle back ON  

Now you have full control over when Railway deploys your backend!


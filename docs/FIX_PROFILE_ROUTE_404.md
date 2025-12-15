# Fix: Supplier Profile Route 404 Error

## Problem
The route `GET /api/v1/supplier/profile` returns 404 because:
1. Railway backend hasn't been redeployed with the new routes
2. Database migration for `logoUrl` column may not be run

## Solution Steps

### Step 1: Run Database Migration (Supabase)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Run this SQL:

```sql
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo_url" VARCHAR(500);
```

Or use the migration file:
- Execute `database/09-add-tenant-logo-url.sql` in Supabase SQL Editor

### Step 2: Redeploy Backend on Railway

Since auto-deploy is disabled, manually trigger deployment:

**Option A: Via Railway Dashboard (Recommended)**
1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Click on your **Backend Service**
4. Go to **Deployments** tab
5. Click **Redeploy** on the latest deployment
   - Or click **Deploy** → **Deploy Latest Commit**

**Option B: Via Railway CLI**
```bash
railway up
```

**Option C: Push a dummy commit** (if Railway GitHub integration is enabled)
```bash
git commit --allow-empty -m "Trigger Railway deployment"
git push origin main
```

### Step 3: Verify Deployment

1. Wait for Railway deployment to complete (check Deploy Logs)
2. Verify the build succeeded:
   - Should see: `✅ Build successful: dist/index.js exists`
   - Should see: `Generated Prisma Client`
3. Test the endpoint:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://friendly-umbrella-production.up.railway.app/api/v1/supplier/profile
   ```

### Step 4: Test in Frontend

1. Hard refresh the frontend: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Navigate to Supplier Dashboard → Profile
3. The error should be gone and profile should load

## What Was Fixed

- ✅ Prisma Client regenerated locally (includes `logoUrl` field)
- ✅ Backend routes are properly registered
- ✅ Build process includes Prisma Client generation
- ⏳ **Pending**: Railway deployment (manual trigger needed)
- ⏳ **Pending**: Database migration (run in Supabase)

## Expected Behavior After Fix

1. **Profile Page Loads**: No more 404 error
2. **Profile Data Displays**: Company name, email, phone, address
3. **Logo Upload Works**: Can upload/change/delete logo (after Supabase Storage setup)

## Troubleshooting

### Still getting 404?
- Check Railway deployment logs for errors
- Verify database migration was successful
- Check Railway service is running (not paused)
- Verify environment variables are set (especially `DATABASE_URL`)

### Build fails on Railway?
- Check that `DATABASE_URL` is set (needed for Prisma generate)
- Check Railway logs for specific error messages
- Verify Node.js version matches (should be 20)

### Profile loads but logo upload fails?
- Check Supabase Storage bucket `supplier-logos` exists
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Railway
- See `SUPABASE_STORAGE_SETUP.md` for storage setup


# Railway Environment Variables Setup

This guide explains how to add environment variables to your Railway backend service.

## Required Environment Variables for Supplier Logo Feature

Add these two new environment variables to your Railway backend:

1. **SUPABASE_URL** - Your Supabase project URL
2. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key (keep secret!)

## Step-by-Step Instructions

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → This is your `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → This is your `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Important**: Use the `service_role` key, NOT the `anon` key

### Step 2: Add Variables to Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Click on your **Backend Service** (the service running your Node.js backend)
4. Go to the **Variables** tab
5. Click **+ New Variable** for each variable:

#### Add SUPABASE_URL:
- **Variable Name**: `SUPABASE_URL`
- **Value**: `https://your-project-id.supabase.co`
  - Replace `your-project-id` with your actual Supabase project ID
  - Example: `https://abcdefghijklmnop.supabase.co`

#### Add SUPABASE_SERVICE_ROLE_KEY:
- **Variable Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your full service role key)
  - This is a long JWT token starting with `eyJ...`
  - ⚠️ **Keep this secret!** Never commit it to Git or expose it publicly

### Step 3: Verify Variables

After adding the variables:

1. Check that both variables appear in the **Variables** tab
2. Railway will automatically redeploy your service with the new variables
3. Check the **Deploy Logs** to ensure the service starts successfully
4. Test the logo upload feature:
   - Log in as a supplier
   - Go to Supplier Dashboard → Profile
   - Try uploading a logo

## Existing Environment Variables

Make sure you also have these variables set (from previous setup):

- `DATABASE_URL` - Your Supabase PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `JWT_REFRESH_SECRET` - Secret key for JWT refresh tokens
- `CORS_ORIGIN` - Your frontend URL (e.g., `https://your-frontend.vercel.app`)
- `PORT` - Port number (Railway sets this automatically, but you can override)
- `NODE_ENV` - Set to `production` for production deployments

## Complete Environment Variables List

Here's the complete list of environment variables your Railway backend should have:

```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres?pgbouncer=true

# JWT Authentication
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app

# Supabase Storage (NEW - for supplier logos)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
NODE_ENV=production
PORT=8000
```

## Troubleshooting

### Issue: "Supabase not configured" error
- **Check**: Both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- **Check**: No typos in variable names (case-sensitive)
- **Check**: Service role key is correct (not the anon key)

### Issue: "Failed to upload logo"
- **Check**: Supabase Storage bucket `supplier-logos` exists and is public
- **Check**: Storage policies are configured correctly
- **Check**: Service role key has proper permissions
- **Check**: Railway logs for detailed error messages

### Issue: Variables not taking effect
- **Solution**: Railway automatically redeploys when variables are added/changed
- **Check**: Wait for deployment to complete
- **Check**: Restart the service manually if needed (Service → Settings → Restart)

## Security Best Practices

1. ✅ **Never commit** `SUPABASE_SERVICE_ROLE_KEY` to Git
2. ✅ **Use service role key** only in backend (server-side)
3. ✅ **Keep variables secret** - Railway encrypts them, but be careful with access
4. ✅ **Rotate keys** periodically for security
5. ✅ **Use environment-specific keys** if you have multiple environments

## Quick Reference

- **Railway Variables Tab**: Project → Service → Variables
- **Supabase API Keys**: Supabase Dashboard → Settings → API
- **Storage Bucket**: Supabase Dashboard → Storage → Create bucket `supplier-logos`


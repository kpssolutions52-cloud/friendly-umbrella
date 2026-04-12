# GitHub Secrets Setup Guide

This guide explains how to set up all required GitHub Secrets for CI/CD deployment.

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

---

## Required Secrets

### Database (Supabase)

#### `DATABASE_URL`
- **Description**: Supabase PostgreSQL connection string
- **How to get**: 
  1. Go to Supabase Dashboard → Your Project
  2. Settings → Database
  3. Connection String → Connection Pooling
  4. Copy the connection string
  5. Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Example**: `postgresql://postgres.abcdefghijklmnop:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

---

### Backend Deployment (Choose ONE: Railway, Fly.io, OR Cyclic)

#### Option A: Railway (Recommended - No Credit Card Required)

##### `RAILWAY_TOKEN`
- **Description**: Railway API token
- **How to get**:
  1. Go to [Railway Dashboard](https://railway.app)
  2. Click your profile → **Account Settings**
  3. Go to **Tokens** tab
  4. Click **New Token**
  5. Copy the token

##### `RAILWAY_SERVICE_ID`
- **Description**: Railway service ID for your backend
- **How to get**:
  1. Create a service in Railway (or let it auto-create)
  2. Go to your service → **Settings**
  3. Copy the **Service ID** (found in the URL or settings)

#### Option B: Fly.io (Alternative - Requires Credit Card)

##### `FLY_API_TOKEN`
- **Description**: Fly.io API token
- **How to get**:
  1. Install Fly.io CLI: `curl -L https://fly.io/install.sh | sh`
  2. Run: `flyctl auth token`
  3. Copy the token

**Note**: Fly.io requires credit card for verification, but invoices under $5/month are waived.

#### Option C: Cyclic (Alternative - No Credit Card Required)

##### `CYCLIC_TOKEN`
- **Description**: Cyclic API token
- **How to get**:
  1. Go to [Cyclic Dashboard](https://cyclic.sh)
  2. Click your profile → **Settings** → **API Tokens**
  3. Generate new token
  4. Copy the token

##### `CYCLIC_APP_NAME`
- **Description**: Your Cyclic app name
- **Example**: `construction-pricing-backend`

---

### Frontend Deployment (Vercel)

#### `VERCEL_TOKEN`
- **Description**: Vercel API token
- **How to get**:
  1. Go to [Vercel Dashboard](https://vercel.com)
  2. Click your profile → **Settings** → **Tokens**
  3. Create a new token
  4. Copy the token

#### `VERCEL_ORG_ID`
- **Description**: Vercel organization ID
- **How to get**:
  1. Go to Vercel Dashboard
  2. Click **Settings** → **General**
  3. Copy **Team ID** (this is your org ID)

#### `VERCEL_PROJECT_ID`
- **Description**: Vercel project ID
- **How to get**:
  1. Create a project in Vercel (or import from GitHub)
  2. Go to project **Settings** → **General**
  3. Copy **Project ID**

---

## Environment Variables for Deployment Platforms

After setting up secrets, you also need to configure environment variables directly in your deployment platforms:

### Railway Backend Environment Variables

Go to Railway → Your Service → **Variables** tab, add:

```env
NODE_ENV=production
DATABASE_URL=${{ secrets.DATABASE_URL }}  # Will be set automatically from secrets
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.vercel.app
API_URL=https://your-backend.railway.app
LOG_LEVEL=info
```

**Generate JWT secrets:**
```bash
openssl rand -base64 32
```

### Cyclic Backend Environment Variables

Go to Cyclic Dashboard → Your App → **Environment Variables**, add the same variables as above.

### Vercel Frontend Environment Variables

Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**, add:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
```

---

## Quick Setup Checklist

- [ ] Add `DATABASE_URL` secret (Supabase connection string)
- [ ] Choose backend platform (Railway or Cyclic)
- [ ] Add backend platform secrets (`RAILWAY_TOKEN` + `RAILWAY_SERVICE_ID` OR `CYCLIC_TOKEN` + `CYCLIC_APP_NAME`)
- [ ] Add Vercel secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)
- [ ] Configure environment variables in Railway/Cyclic dashboard
- [ ] Configure environment variables in Vercel dashboard
- [ ] Push to `main` branch to trigger deployment

---

## Testing Secrets

After adding secrets, you can test the deployment by:

1. Making a small change to your code
2. Committing and pushing to `main` branch
3. Check GitHub Actions tab to see deployment progress
4. Verify deployments in Railway/Cyclic and Vercel dashboards

---

## Troubleshooting

**Problem: "Secret not found"**
- Verify secret name matches exactly (case-sensitive)
- Check you're in the correct repository
- Ensure secret is added to repository (not organization) level

**Problem: "Deployment failed"**
- Check GitHub Actions logs
- Verify all secrets are set correctly
- Ensure environment variables are set in deployment platforms
- Check database connection string is correct

**Problem: "Database connection error"**
- Verify `DATABASE_URL` uses connection pooling format
- Check Supabase project is active
- Ensure database migrations have been run


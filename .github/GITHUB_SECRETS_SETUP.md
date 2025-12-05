# GitHub Secrets Setup for CI/CD

This guide explains how to set up the required GitHub Secrets for automatic deployment of your frontend and backend.

## Required Secrets

### Backend (Railway) Secrets

1. **RAILWAY_TOKEN**
   - Get from: Railway Dashboard → Account Settings → Tokens → New Token
   - Create a token with deployment permissions
   - Add to GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret

2. **RAILWAY_SERVICE_ID**
   - Get from: Railway Dashboard → Your Backend Service → Settings → Service ID
   - Copy the Service ID
   - Add to GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret

3. **DATABASE_URL** (optional, for local testing in CI)
   - Your Supabase connection string
   - Only needed if you want to run migrations in CI
   - Add to GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret

### Frontend (Vercel) Secrets

1. **VERCEL_TOKEN**
   - Get from: Vercel Dashboard → Settings → Tokens → Create Token
   - Name it "GitHub Actions" or similar
   - Copy the token
   - Add to GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret

2. **VERCEL_ORG_ID**
   - Get from: Vercel Dashboard → Settings → General → Team ID
   - Copy the Team/Org ID
   - Add to GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret

3. **VERCEL_PROJECT_ID**
   - Get from: Vercel Dashboard → Your Project → Settings → General → Project ID
   - Copy the Project ID
   - Add to GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret

4. **NEXT_PUBLIC_API_URL** (optional)
   - Your backend API URL: `https://friendly-umbrella-production.up.railway.app`
   - Only needed if you want to override the default
   - Add to GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret

## Step-by-Step Setup

### 1. Railway Backend Setup

1. Go to [Railway Dashboard](https://railway.app)
2. Navigate to your backend service
3. Go to **Settings** → **Service ID** → Copy the ID
4. Go to **Account Settings** → **Tokens** → **New Token**
5. Name it "GitHub Actions" and create
6. Copy the token

### 2. Vercel Frontend Setup

1. Go to [Vercel Dashboard](https://vercel.com)
2. Navigate to your project
3. Go to **Settings** → **General** → Copy **Project ID**
4. Go to **Settings** → **General** → Copy **Team ID** (or Org ID)
5. Go to **Settings** → **Tokens** → **Create Token**
6. Name it "GitHub Actions" and create
7. Copy the token

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret above
4. Add all the secrets with their exact names

## Verification

After adding all secrets:

1. Make a commit to the `main` branch
2. Go to **Actions** tab in GitHub
3. You should see:
   - **Backend CI/CD** workflow running (if backend files changed)
   - **Frontend CI/CD** workflow running (if frontend files changed)
4. Both should complete successfully and deploy

## Troubleshooting

### Backend deployment fails
- Check that `RAILWAY_TOKEN` and `RAILWAY_SERVICE_ID` are correct
- Verify Railway service is active
- Check Railway logs for deployment errors

### Frontend deployment fails
- Check that all three Vercel secrets are set correctly
- Verify Vercel project exists and is linked to your GitHub repo
- Check Vercel dashboard for deployment errors

### Workflow not triggering
- Ensure you're pushing to `main` branch
- Check that files changed match the `paths` filter in the workflow
- Verify workflow files are in `.github/workflows/` directory


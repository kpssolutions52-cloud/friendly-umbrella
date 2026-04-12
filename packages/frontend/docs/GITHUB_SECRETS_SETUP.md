# GitHub Secrets Setup for CI/CD

This guide explains how to set up the required GitHub Secrets for automatic deployment of your frontend and backend.

## Required Secrets

### Backend (Railway) Secrets

1. **RAILWAY_TOKEN** (Railway Project Token - REQUIRED)
   - **CRITICAL**: This must be a **PROJECT TOKEN**, not a user token!
   - Get from: Railway Dashboard → Your **Project** (not service) → **Settings** → **Project Tokens** → **New Token**
   - Name it "GitHub Actions" or similar
   - Copy the token immediately (you can't see it again)
   - Add to GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret
   - **Note**: User tokens from Account Settings will NOT work - you MUST use a Project Token

2. **RAILWAY_SERVICE_ID**
   - Get from: Railway Dashboard → Your Backend Service → **Settings** → **Service ID**
   - Copy the Service ID (UUID format, e.g., `abc123-def456-...`)
   - Add to GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret

3. **DATABASE_URL** (optional, for local testing in CI)
   - Your Supabase connection string
   - Only needed if you want to run migrations in CI
   - Add to GitHub: Repository → Settings → Secrets and variables → Actions → New repository secret

### Frontend (Vercel) Secrets

**Note**: Vercel uses built-in GitHub integration, so no GitHub Secrets are needed for deployment.

However, you still need to configure environment variables in Vercel Dashboard:

1. **NEXT_PUBLIC_API_URL**
   - Set in: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Value: `https://friendly-umbrella-production.up.railway.app`
   - Apply to: Production, Preview, Development

**Optional - Only if you want to deploy via GitHub Actions instead:**
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID  
- `VERCEL_PROJECT_ID` - Vercel project ID

But it's recommended to use Vercel's built-in GitHub integration instead.

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


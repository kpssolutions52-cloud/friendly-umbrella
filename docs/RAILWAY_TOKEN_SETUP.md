# Railway Token Setup - CRITICAL

## ⚠️ IMPORTANT: Project Token vs User Token

Railway CLI requires a **PROJECT TOKEN**, NOT a user token. Using the wrong token type will cause "Project Token not found" errors.

---

## ✅ Correct Way: Get Project Token

### Step 1: Navigate to Project Settings

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your **Project** (the container that holds your services)
   - **NOT** the service itself
   - The project is the top-level container
3. Click **Settings** (gear icon or in sidebar)

### Step 2: Create Project Token

1. In Project Settings, scroll to **"Project Tokens"** section
2. Click **"New Token"** or **"Create Token"**
3. Give it a name: `GitHub Actions` or `CI/CD`
4. Click **"Create"** or **"Generate"**
5. **COPY THE TOKEN IMMEDIATELY** - You won't be able to see it again!
6. If you lose it, delete and create a new one

### Step 3: Add to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `RAILWAY_TOKEN`
5. Value: Paste the Project Token you just copied
6. Click **"Add secret"**

---

## ❌ Wrong Way: User Token (Won't Work!)

**DO NOT USE:**
- Railway Dashboard → **Account Settings** → Tokens
- This creates a **User Token** which doesn't work with Railway CLI
- User tokens are for Railway API, not CLI operations

---

## How to Verify You Have the Right Token

### Check Token Type:

1. **Project Token** (✅ Correct):
   - Created in: Project → Settings → Project Tokens
   - Works with: Railway CLI (`railway up`, `railway link`, etc.)
   - Use for: CI/CD deployments

2. **User Token** (❌ Wrong):
   - Created in: Account Settings → Tokens
   - Works with: Railway REST API only
   - Does NOT work with: Railway CLI

---

## Complete Setup Checklist

- [ ] Go to Railway Dashboard
- [ ] Select your **Project** (not service)
- [ ] Go to Project **Settings**
- [ ] Find **"Project Tokens"** section
- [ ] Click **"New Token"**
- [ ] Name it "GitHub Actions"
- [ ] **Copy the token immediately**
- [ ] Go to GitHub → Repository → Settings → Secrets
- [ ] Add secret: `RAILWAY_TOKEN` = (paste Project Token)
- [ ] Verify `RAILWAY_SERVICE_ID` is also set
- [ ] Test deployment

---

## Troubleshooting

### Error: "Project Token not found"
**Cause**: You're using a User Token instead of Project Token  
**Fix**: Create a Project Token from Project Settings (not Account Settings)

### Error: "No service found"
**Cause**: `RAILWAY_SERVICE_ID` is incorrect or missing  
**Fix**: Get Service ID from Service → Settings → Service ID

### Error: "Authentication failed"
**Cause**: Token expired or invalid  
**Fix**: Create a new Project Token and update GitHub secret

### Still Not Working?
1. Verify token is from **Project Settings** → **Project Tokens**
2. Verify token is set in GitHub Secrets as `RAILWAY_TOKEN`
3. Verify `RAILWAY_SERVICE_ID` is correct
4. Try creating a new Project Token
5. Check Railway service is active and accessible

---

## Alternative: Use Railway GitHub Integration

If you continue having issues with tokens, you can:

1. **Enable Railway GitHub Integration**:
   - Go to Railway → Project → Settings → GitHub
   - Connect your GitHub repository
   - Railway will deploy automatically (if auto-deploy is enabled)

2. **Benefits**:
   - No tokens needed
   - Automatic deployments
   - Simpler setup

3. **Disable Auto-Deploy** (if you want manual control):
   - Go to Service → Settings → Source
   - Turn OFF "Auto Deploy"
   - Deploy manually from Railway dashboard

---

## Summary

✅ **Use**: Project Token (Project → Settings → Project Tokens)  
❌ **Don't Use**: User Token (Account Settings → Tokens)  
🔑 **Location**: Railway Dashboard → **Project** → Settings → Project Tokens  
📝 **GitHub Secret**: `RAILWAY_TOKEN` = (Project Token)

This is the root cause of all Railway CLI authentication failures!


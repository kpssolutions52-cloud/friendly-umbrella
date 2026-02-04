# Railway Environment Variable Setup

## Adding USE_ENHANCED_AI to Railway

### Method 1: Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Navigate to [railway.app](https://railway.app)
   - Log in to your account

2. **Select Your Project**
   - Click on your project (friendly-umbrella or your project name)

3. **Select Your Service**
   - Click on the backend service (the one running your Node.js backend)

4. **Go to Variables Tab**
   - Click on the **"Variables"** tab in the service settings
   - Or click on the service → **"Settings"** → **"Variables"**

5. **Add New Variable**
   - Click **"+ New Variable"** or **"Add Variable"**
   - **Variable Name**: `USE_ENHANCED_AI`
   - **Value**: `true`
   - Click **"Add"** or **"Save"**

6. **Redeploy (if needed)**
   - Railway will automatically redeploy when you add environment variables
   - Or manually trigger a redeploy from the **"Deployments"** tab

### Method 2: Railway CLI

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Add the environment variable
railway variables set USE_ENHANCED_AI=true

# Or add it to a specific service
railway variables set USE_ENHANCED_AI=true --service backend
```

### Method 3: railway.json or railway.toml

If you're using Railway configuration files, you can add it there:

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "variables": {
    "USE_ENHANCED_AI": "true"
  }
}
```

**railway.toml:**
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[variables]
USE_ENHANCED_AI = "true"
```

## Verify It's Set

### Check in Dashboard
1. Go to your service → Variables tab
2. Look for `USE_ENHANCED_AI` in the list
3. Verify the value is `true`

### Check via CLI
```bash
railway variables
```

### Check in Logs
After redeploy, check the logs for:
```
[supplierChatRoutes] Processing command with verified organizationId: ... Enhanced AI: true
```

## Important Notes

1. **Redeploy Required**: After adding the variable, Railway will automatically redeploy your service
2. **Case Sensitive**: Variable names are case-sensitive (`USE_ENHANCED_AI` not `use_enhanced_ai`)
3. **Value Type**: The value should be the string `"true"` (not boolean `true`)
4. **Service-Specific**: Make sure you're adding it to the correct service (backend, not frontend)

## Other Required Variables

Make sure these are also set in Railway:
- `OPENAI_API_KEY` - Your OpenAI API key (required for AI features)
- `OPENAI_MODEL` - Model to use (default: `gpt-4o-mini`)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT secret key
- `JWT_REFRESH_SECRET` - JWT refresh secret

## Testing

After setting the variable and redeploying:

1. **Test Simple Query**:
   ```
   "How much is 10 cement?"
   ```

2. **Test Complex Query** (Enhanced AI only):
   ```
   "What's the total for 10 cement, 5 steel, and 3 paint?"
   ```

3. **Check Logs**:
   - Look for "Enhanced AI: true" in the logs
   - Verify the AI is using function calling

## Troubleshooting

### Issue: Variable not taking effect
- **Solution**: Check that you added it to the correct service (backend)
- **Solution**: Verify the variable name is exactly `USE_ENHANCED_AI`
- **Solution**: Trigger a manual redeploy

### Issue: Enhanced AI not working
- **Solution**: Check that `OPENAI_API_KEY` is set
- **Solution**: Verify the model supports function calling (`gpt-4o-mini` or `gpt-4o`)
- **Solution**: Check logs for errors

### Issue: Still using original service
- **Solution**: Verify the variable value is exactly `"true"` (string)
- **Solution**: Check backend logs for "Enhanced AI: false" (means it's not enabled)

## Disable Enhanced AI

To disable and use the original service:
1. Go to Variables tab
2. Change `USE_ENHANCED_AI` value to `false`
3. Or delete the variable (defaults to false)

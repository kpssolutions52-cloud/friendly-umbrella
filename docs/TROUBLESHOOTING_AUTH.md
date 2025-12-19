# Troubleshooting Authentication Issues

## Symptoms
- 401 Unauthorized errors in browser console
- Products not loading on dashboard
- `/api/v1/auth/me` returns 401
- Dashboard shows loading state indefinitely

## Quick Fix

### Clear Browser Storage and Re-login

**Method 1: Browser Console (Fastest)**
1. Open browser console (F12)
2. Run these commands:
```javascript
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
location.reload();
```
3. Log in again

**Method 2: Manual Browser Settings**
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Local Storage** → Your domain URL
4. Delete both `accessToken` and `refreshToken` entries
5. Refresh page and log in again

## Common Causes

### 1. Expired Tokens
- Access tokens expire after a set time
- If refresh token is also expired, you must re-login
- **Solution**: Clear storage and re-login (see above)

### 2. Invalid Tokens from Previous Session
- Tokens from old deployment or development environment
- Database was reset but browser still has old tokens
- **Solution**: Clear storage and re-login

### 3. Database Account Status Issues
- User account status is `inactive` or `pending`
- Tenant status is `inactive` or `pending`
- **Solution**: Run database seed or manually update account status

## Verify Account Status

If re-logging in doesn't work, check account status in database:

```sql
-- Check user status
SELECT id, email, "isActive", status, role 
FROM "User" 
WHERE email = 'company@example.com';

-- Check tenant status  
SELECT id, name, type, status 
FROM "Tenant" 
WHERE type = 'company' 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

Both should have:
- `status = 'active'`
- `isActive = true` (for User)

## Reset Account (If Needed)

Run the seed script to reset test accounts:
```bash
npm run db:seed
```

This will ensure all test accounts are properly configured.

## Test Credentials

After seeding, use these credentials:
- **Company**: `company@example.com` / `password123`
- **Supplier**: `supplier@example.com` / `password123`
- **Super Admin**: `admin@example.com` / `password123`

## Still Not Working?

1. Check browser console for specific error messages
2. Verify API URL is correct in environment variables
3. Check network tab to see full error response from server
4. Ensure backend is running and accessible
5. Check CORS settings if accessing from different domain

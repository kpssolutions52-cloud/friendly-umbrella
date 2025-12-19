# Fix 401 Authentication Error

The 401 error means your authentication token is invalid or expired. Here's how to fix it:

## Quick Fix Steps:

### 1. Clear Browser Storage and Re-login
1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → your site URL
4. Delete these keys:
   - `accessToken`
   - `refreshToken`
5. Refresh the page
6. Log in again with: `company@example.com` / `password123`

### 2. Check Console for Errors
- The console shows: `Failed to load resource: 401 ()` from `/api/v1/auth/login`
- This suggests the token refresh or API call is failing
- After clearing tokens and re-logging in, this should be resolved

### 3. Verify Backend is Running
- Check that backend API is running on the correct port
- Check `NEXT_PUBLIC_API_URL` environment variable matches your backend URL

### 4. If Still Not Working
Try these steps in order:

```javascript
// In browser console, run:
localStorage.clear();
location.reload();
```

Then log in again.

## What Was Fixed:
1. ✅ Added AI Quote button to mobile menu (was missing)
2. ⚠️ Authentication needs to be refreshed - clear tokens and re-login

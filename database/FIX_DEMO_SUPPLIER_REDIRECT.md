# Fix Demo Supplier Account Redirect Issue

## Problem
The demo supplier account (`demo.supplier@constructionguru.com`) is landing on `/chat` (QS page) instead of `/supplier/chat` because the database has `type = 'qs'` instead of `type = 'supplier'`.

## Solution

### Step 1: Run the SQL Query

Execute the following SQL query to fix the demo account type:

```sql
-- Fix demo supplier account type
UPDATE users
SET type = 'supplier'::usertype
WHERE email = 'demo.supplier@constructionguru.com';
```

Or run the complete script:
```bash
# Execute the full script
psql -d your_database -f database/fix-demo-account-types.sql
```

### Step 2: Verify the Fix

Check that the account type is now correct:

```sql
SELECT email, type, organization_id
FROM users
WHERE email = 'demo.supplier@constructionguru.com';
```

Expected result:
- `type` should be `supplier` (not `qs`)

### Step 3: Test

1. Log out if currently logged in
2. Go to `/auth/demo`
3. Select "Supplier" demo account
4. Click "Try Supplier Demo"
5. You should be redirected to `/supplier/chat` (not `/chat`)

## Why This Happens

The login redirect logic checks `user.type` to determine where to redirect:
- If `user.type === 'supplier'` → redirects to `/supplier/chat`
- If `user.type === 'qs'` → redirects to `/chat`

If the database has the wrong type, the redirect logic will send the user to the wrong page.

## Code Changes Already Made

The following code changes have been made to handle redirects properly:

1. **`packages/frontend/src/contexts/AuthContext.tsx`**: Login function now checks user type and redirects suppliers to `/supplier/chat`
2. **`packages/frontend/src/app/chat/page.tsx`**: QS chat page redirects suppliers to `/supplier/chat` if they somehow access it
3. **`packages/frontend/src/app/page.tsx`**: Home page redirects suppliers to `/supplier/chat`

However, these redirects only work if the database has the correct `type` value.

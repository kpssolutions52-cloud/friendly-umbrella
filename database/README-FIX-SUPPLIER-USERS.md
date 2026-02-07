# Fix Missing Supplier Users

If you're getting the error: **"No user found for supplier [NAME]. Please ensure at least one user account exists for this supplier organization."**

## Quick Fix (Run in Order)

### Step 1: Create Organizations for Suppliers
```sql
-- Run this first to ensure all suppliers have organizations
-- Products are linked to organizations, not tenants
\i database/32-create-missing-organizations-for-suppliers.sql
```

### Step 2: Create Users for All Suppliers
```sql
-- Run this to create user accounts for all suppliers without users
\i database/33-fix-missing-supplier-users.sql
```

## What These Scripts Do

### Script 32: Create Missing Organizations
- Creates `organizations` records for all suppliers in the `tenants` table
- Links organizations to suppliers by matching email addresses
- Required because products are linked to organizations, not tenants

### Script 33: Fix Missing Supplier Users
- Finds all supplier organizations without user accounts
- Creates user accounts with:
  - Email: Same as organization email
  - Password: `Demo123!` (for demo/testing)
  - Type: `supplier`
  - Linked to the organization via `organization_id`

## Verification

After running both scripts, you should see:
- All suppliers have corresponding organizations
- All supplier organizations have at least one user account
- Users can log in with email and password `Demo123!`

## Demo Credentials

After running the scripts, you can log in with:
- **Email**: The supplier's email address (from organizations table)
- **Password**: `Demo123!`

## Troubleshooting

If you still get errors after running both scripts:

1. **Check if organizations exist:**
   ```sql
   SELECT COUNT(*) FROM organizations WHERE type::text = 'supplier';
   ```

2. **Check if users exist:**
   ```sql
   SELECT COUNT(*) FROM users u
   JOIN organizations o ON u.organization_id = o.id
   WHERE o.type::text = 'supplier';
   ```

3. **Find suppliers without users:**
   ```sql
   SELECT o.name, o.email
   FROM organizations o
   WHERE o.type::text = 'supplier'
     AND NOT EXISTS (
       SELECT 1 FROM users u WHERE u.organization_id = o.id
     );
   ```

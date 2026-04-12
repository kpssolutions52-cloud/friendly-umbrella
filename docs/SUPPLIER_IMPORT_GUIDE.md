# Singapore Suppliers Import Guide

## Overview

This guide explains how to import 100 Singapore construction suppliers into your database with complete profile details and demo login credentials.

## Files Created

1. **`database/29-import-singapore-suppliers-with-users.sql`** - Main import script
2. **`suppliers_singapore.csv`** - Source data file
3. **`import_suppliers_with_users.py`** - Python script to regenerate SQL if needed

## What Gets Imported

### Tenant Records (Suppliers)
- ✅ Company name
- ✅ Email address
- ✅ Phone number
- ✅ Full address with postal code
- ✅ Status: `active` (ready for demo)
- ✅ Metadata JSON with:
  - Registration number (UEN)
  - BCA workhead and grade
  - Description
  - City, state, country (Singapore)
  - Source information

### User Accounts
- ✅ Email: Same as tenant email
- ✅ Password: `Demo123!` (same for all suppliers - easy for demos)
- ✅ Role: `supplier_admin`
- ✅ Status: `active`
- ✅ Name: Generated from company name

## Quick Start

### For PostgreSQL/Supabase

```bash
# Run the import script
psql -d your_database -f database/29-import-singapore-suppliers-with-users.sql

# Or for Supabase, use the SQL Editor in dashboard
# Copy and paste the contents of database/29-import-singapore-suppliers-with-users.sql
```

### Prerequisites

The script requires the `pgcrypto` extension for password hashing:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

This is included at the top of the import script.

## Demo Login Credentials

**All suppliers use the same password for easy demo access:**

- **Password**: `Demo123!`
- **Email**: Use the supplier's email from the CSV
- **Role**: `supplier_admin` (full access)

### Sample Login Credentials

After import, you can query for sample credentials:

```sql
SELECT 
    t.name as company_name,
    u.email as login_email,
    'Demo123!' as password,
    u.first_name || ' ' || u.last_name as contact_name
FROM tenants t
JOIN users u ON t.id = u.tenant_id
WHERE t.type = 'supplier' AND t.status = 'active'
LIMIT 10;
```

## Data Quality

### ✅ Complete Data
- All 100 suppliers have:
  - Phone numbers
  - Addresses
  - Postal codes
  - BCA registration details

### ⚠️ Notes
- **Email addresses**: Auto-generated from company names (format: `contact@companyname.com.sg`)
- **Contact person names**: Generated from company names (may need manual updates)
- **UEN numbers**: Some may be empty (not always available in BCA data)

## Verification

After import, verify the data:

```sql
-- Count imported suppliers
SELECT 
    COUNT(*) as total_suppliers,
    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as with_address,
    COUNT(CASE WHEN postal_code IS NOT NULL THEN 1 END) as with_postal_code
FROM tenants
WHERE type = 'supplier' AND status = 'active';

-- Check user accounts
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE t.type = 'supplier';
```

## Updating Suppliers

The script uses `ON CONFLICT` clauses, so you can safely re-run it:
- Existing tenants will be updated (preserving existing data where new data is NULL)
- Existing users will have passwords reset to `Demo123!`

## Next Steps

1. **Test Login**: Try logging in with any supplier email and password `Demo123!`
2. **Update Contact Info**: Manually update contact person names and emails if needed
3. **Add Products**: Suppliers can now add their products to the catalog
4. **Verify Profiles**: Review supplier profiles in the admin panel

## Troubleshooting

### Error: Extension pgcrypto does not exist
```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Error: Duplicate key violation
- The script handles duplicates with `ON CONFLICT` clauses
- If you still get errors, check for existing data and clean up if needed

### Password not working
- Ensure `pgcrypto` extension is enabled
- Verify password hash was generated correctly
- Check user status is 'active'

## Security Note

⚠️ **For Production**: Change all passwords from `Demo123!` to unique, secure passwords before going live.

## Regenerating the SQL

If you need to regenerate the SQL file (e.g., after updating the CSV):

```bash
python3 import_suppliers_with_users.py suppliers_singapore.csv
```

This will create/update `database/29-import-singapore-suppliers-with-users.sql`.

## Support

For issues:
1. Check the SQL script for syntax errors
2. Verify database schema matches expected structure
3. Ensure all required tables and enums exist
4. Review the import logs for specific error messages

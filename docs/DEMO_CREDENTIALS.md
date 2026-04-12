# Demo Login Credentials

This document provides demo login credentials for testing the platform.

## 🔐 Demo Supplier Accounts (Select from List)

**All suppliers with products are available for demo. Choose any supplier from the list:**

### How to Get List of Suppliers with Products

Run this SQL query to see all suppliers that have products:

```sql
-- Run: database/30-find-supplier-with-most-products.sql
-- Or: database/31-update-demo-supplier-credentials.sql
```

The query will return a ranked list showing:
- **Rank**: Position by product count
- **Supplier Name**: Company name
- **Login Email**: Email to use for login
- **Password**: `Demo123!` (same for all)
- **Total Products**: Number of products
- **Active Products**: Number of active products
- **Recommendation**: Rating based on product count
  - ⭐⭐⭐ Excellent (50+ products)
  - ⭐⭐ Good (20-49 products)
  - ⭐ Fair (10-19 products)
  - 📦 Has Products (1-9 products)

### Option 2: Singapore Suppliers (100 Available)

All Singapore suppliers imported from BCA have the same demo password:

- **Password**: `Demo123!`
- **Email**: Use any supplier email from the import (check `suppliers_singapore.csv`)

**Sample Singapore Suppliers:**
- Email: `contact@1chuanpteltd.com.sg` / Password: `Demo123!`
- Email: `contact@1plusprivatelimited.com.sg` / Password: `Demo123!`
- Email: `contact@1prpteltd.com.sg` / Password: `Demo123!`

### Option 3: Default Demo Supplier (From Seed)

If no products exist yet, use the default seeded supplier:

- **Email**: `supplier@example.com`
- **Password**: `password123`
- **Note**: This supplier has 2 sample products (Cement and Steel Rebar)

## 🏢 Demo Company Account

- **Email**: `company@example.com`
- **Password**: `password123`

## 👤 Demo Super Admin Account

- **Email**: `admin@system.com`
- **Password**: `admin123`

## 📊 Getting List of Suppliers with Products

To get a complete list of all suppliers that have products (sorted by product count):

```sql
-- Run the SQL script
\i database/30-find-supplier-with-most-products.sql

-- Or use this query directly:
SELECT 
    ROW_NUMBER() OVER (ORDER BY COUNT(p.id) DESC) as rank,
    t.name as supplier_name,
    u.email as login_email,
    'Demo123!' as password,
    COUNT(p.id) as total_products,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_products
FROM tenants t
JOIN users u ON t.id = u.tenant_id
LEFT JOIN organizations o ON t.email = o.email AND o.type = 'supplier'
LEFT JOIN products p ON o.id = p.supplier_id
WHERE t.type = 'supplier' 
  AND t.status = 'active'
  AND u.role = 'supplier_admin'
GROUP BY t.id, t.name, t.email, u.email
HAVING COUNT(p.id) > 0
ORDER BY total_products DESC, active_products DESC;
```

**Result**: You'll get a ranked list of all suppliers with products, allowing you to choose the best one for your demo needs.

## 🚀 Quick Start with Demo Account

1. **Go to Login Page**: `/auth/login`
2. **Enter Credentials**: Use any of the demo credentials above
3. **Click Login**: You'll be redirected to the appropriate dashboard
4. **Start Testing**: 
   - Suppliers: Add/view products, set prices
   - Companies: Search products, view prices, create projects

## 📝 Notes

- All demo passwords are set to `Demo123!` for Singapore suppliers
- Default seed accounts use `password123`
- Demo accounts are active and ready to use
- Products may need to be added manually for new suppliers

## 🔄 Updating Demo Credentials

To update demo credentials for a specific supplier:

1. Find the supplier with most products (use SQL query above)
2. Update this file with the supplier's email
3. Ensure password is `Demo123!` (or update if needed)

## 📞 Support

For issues with demo accounts, check:
- Supplier status is `active`
- User status is `active`
- Products exist for the supplier (if testing product features)

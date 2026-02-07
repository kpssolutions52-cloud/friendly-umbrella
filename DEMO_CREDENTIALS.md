# Demo Login Credentials

This document provides demo login credentials for testing the platform.

## 🔐 Demo Supplier Account (Recommended for Product Testing)

**Use this account to test supplier features with maximum product data:**

### Option 1: Supplier with Most Products (Auto-Detected)

Run this SQL query to find the supplier with the most products:

```sql
SELECT 
    t.name as supplier_name,
    t.email as login_email,
    'Demo123!' as password,
    COUNT(p.id) as product_count,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_products
FROM tenants t
JOIN users u ON t.id = u.tenant_id
LEFT JOIN products p ON t.id = p.supplier_id
WHERE t.type = 'supplier' 
  AND t.status = 'active'
  AND u.role = 'supplier_admin'
GROUP BY t.id, t.name, t.email
ORDER BY product_count DESC, active_products DESC
LIMIT 1;
```

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

## 📊 Finding Supplier with Maximum Products

To find which supplier has the most products for demo purposes:

```sql
-- Find supplier with most products
SELECT 
    t.id,
    t.name,
    t.email,
    u.email as login_email,
    COUNT(p.id) as total_products,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_products,
    t.phone,
    t.address,
    t.postal_code
FROM tenants t
JOIN users u ON t.id = u.tenant_id
LEFT JOIN products p ON t.id = p.supplier_id
WHERE t.type = 'supplier' 
  AND t.status = 'active'
  AND u.role = 'supplier_admin'
GROUP BY t.id, t.name, t.email, u.email, t.phone, t.address, t.postal_code
ORDER BY total_products DESC, active_products DESC
LIMIT 5;
```

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

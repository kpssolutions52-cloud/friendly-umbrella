# API Testing Guide with Postman

## ✅ Database Seeded

The database has been seeded with dummy data:
- **Supplier**: `supplier@example.com` / `password123`
- **Company**: `company@example.com` / `password123`
- Sample products and prices

## 📥 Import Postman Collection

1. Open Postman
2. Click **Import** button
3. Select `Construction_Pricing_API.postman_collection.json`
4. Also import `Postman_Environment.postman_environment.json`
5. Select the environment: **Construction Pricing Platform**

## 🔑 Setup Authentication

### Step 1: Login as Supplier
1. Run **"Login - Supplier"** request
2. Copy the `accessToken` from response
3. It's automatically saved to environment variables

### Step 2: Login as Company (in separate tab/environment)
1. Run **"Login - Company"** request
2. Use this token for company-specific endpoints

## 📋 Testing Flow

### Authentication Flow
1. **Health Check** - Verify server is running
2. **Login - Supplier** - Get supplier token
3. **Get Current User** - Verify authentication works

### Supplier Flow (Product Management)
1. **List Products** - See all your products
2. **Get Product Stats** - View statistics
3. **Create Product** - Add new product (saves productId automatically)
4. **Get Product by ID** - View product details
5. **Update Product** - Modify product
6. **Update Default Price** - Set price visible to all companies
7. **Create Private Price** - Set special price for specific company
8. **List Private Prices** - See all private prices for a product
9. **Get Price History** - View audit log

### Company Flow (Browsing)
1. **Login - Company** - Get company token
2. **List All Suppliers** - Browse available suppliers
3. **Get Supplier Details** - View supplier info
4. **Browse Supplier Products** - See products from a supplier
5. **Get Product Price** - Get best available price (private or default)
6. **Search Products** - Search across all suppliers
7. **Get Product Categories** - List all categories

## 🔍 Key Endpoints

### Base URL
```
http://localhost:8000
```

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Products (Supplier Only)
- `GET /api/v1/products` - List products
- `GET /api/v1/products/stats` - Statistics
- `GET /api/v1/products/:id` - Get product
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Prices (Supplier Only)
- `PUT /api/v1/products/:id/default-price` - Update default price
- `POST /api/v1/products/:id/private-prices` - Create private price
- `GET /api/v1/products/:id/private-prices` - List private prices
- `PUT /api/v1/private-prices/:id` - Update private price
- `DELETE /api/v1/private-prices/:id` - Delete private price
- `GET /api/v1/products/:id/price-history` - Price history

### Browsing (Company Only)
- `GET /api/v1/suppliers` - List suppliers
- `GET /api/v1/suppliers/:id` - Supplier details
- `GET /api/v1/suppliers/:id/products` - Browse catalog
- `GET /api/v1/products/:id/price` - Get price
- `GET /api/v1/products/search` - Search products
- `GET /api/v1/products/categories` - List categories

## 📝 Test Credentials

**Supplier:**
- Email: `supplier@example.com`
- Password: `password123`

**Company:**
- Email: `company@example.com`
- Password: `password123`

## 🧪 Quick Test Sequence

1. **Health Check** → Should return `{"status":"ok"}`
2. **Login - Supplier** → Get token
3. **List Products** → Should see 2 products (from seed)
4. **Create Product** → Add new product
5. **Update Default Price** → Change price
6. **Login - Company** → Get company token
7. **List Suppliers** → See suppliers
8. **Browse Supplier Products** → See products with prices
9. **Get Product Price** → See best available price

## 💡 Tips

- Tokens are automatically saved after login
- Product IDs are saved after creation
- Use environment variables for dynamic values
- Check response status codes (200, 201, 400, 401, 404)
- Private prices are only visible to the assigned company

## 🐛 Common Issues

**401 Unauthorized:**
- Token expired or missing
- Run login again to get new token

**403 Forbidden:**
- Wrong user type (e.g., company trying supplier endpoint)
- Use correct account type

**404 Not Found:**
- Invalid ID
- Resource doesn't exist or belongs to different tenant

**400 Bad Request:**
- Validation error
- Check request body format
- See error message for details


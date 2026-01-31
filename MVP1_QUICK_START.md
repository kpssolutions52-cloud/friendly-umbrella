# MVP 1 Quick Start Guide

## 🚀 Getting Started

### For QS Professionals

1. **Register** at `/auth/register-simple`
   - Step 1: Select "QS Professional"
   - Step 2: Join existing company or create new
   - Enter your details and create account

2. **Start Chatting** at `/chat`
   - Ask questions like:
     - "What's the price of cement?"
     - "Show me prices for cement, steel, and sand"
     - "How much does 100 bags of cement cost?"

3. **Get Instant Answers**
   - AI responds with real-time supplier prices
   - Best prices are highlighted with ⭐
   - All prices are up-to-date

### For Suppliers

1. **Register** at `/auth/register-simple`
   - Step 1: Select "Supplier"
   - Step 2: Join existing supplier organization or create new
   - Enter your details and create account

2. **Manage Products** at `/supplier/products`
   - Add products (name, price, unit)
   - Update prices
   - View all your products

3. **Use AI Chat** at `/supplier/chat`
   - Update prices naturally:
     - "Update cement price to $48"
     - "Set steel price to $500 per ton"
   - Add products:
     - "Add new product: paint at $25 per gallon"
   - View products:
     - "Show my products"

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/organizations?type=company|supplier` - Get organizations

### QS Chat
- `POST /api/v1/chat` - Send question to AI (requires QS user)

### Supplier Chat
- `POST /api/v1/supplier/chat` - Send command to AI (requires supplier user)

### Products (Supplier)
- `GET /api/v1/products?supplier=true` - Get supplier's products
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

## 🧪 Testing Flow

### Test QS Flow
1. Register as QS Professional
2. Go to `/chat`
3. Ask: "What's the price of cement?"
4. Verify you see supplier prices with best price highlighted

### Test Supplier Flow
1. Register as Supplier
2. Go to `/supplier/products`
3. Add a product: "Cement" at $48 per bag
4. Go to `/supplier/chat`
5. Say: "Update cement price to $50"
6. Verify price updated in products list

## 🎯 Success Criteria

- ✅ QS can register and get instant price answers
- ✅ Supplier can register and update prices via chat
- ✅ Supplier can manage products via UI
- ✅ Best prices are highlighted in QS responses
- ✅ All pages are mobile responsive
- ✅ Error handling works correctly

## 📝 Notes

- Registration uses simplified 2-step flow
- All features work with new Organization/User model
- WebSocket real-time updates are optional (can be added in MVP 2)

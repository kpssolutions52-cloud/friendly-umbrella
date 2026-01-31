# Quick Access to Dashboard UI

## 🚀 Fastest Way to Access the Dashboard

### Step 1: Start the Servers

Run this command in your terminal:

```bash
npm run dev
```

**OR** run separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

### Step 2: Open Your Browser

Go to: **http://localhost:3000**

### Step 3: Login or Register

**Option A: Register New Account**
1. Click **"Register"**
2. Select **"Supplier"** or **"Company"**
3. Fill the form and submit
4. You'll be redirected to your dashboard!

**Option B: Use Test Accounts** (if database is seeded)

1. Click **"Login"**
2. Use these credentials:

   **Supplier:**
   - Email: `supplier@example.com`
   - Password: `password123`

   **Company:**
   - Email: `company@example.com`  
   - Password: `password123`

## 📍 Dashboard URLs

After logging in:

- **Supplier Dashboard**: http://localhost:3000/supplier/dashboard
- **Company Dashboard**: http://localhost:3000/company/dashboard

## ⚠️ If Database Setup Needed

If you see database errors, complete setup first:

```bash
# 1. Wait for Docker containers
docker ps  # Should show both containers as "healthy"

# 2. Run migrations
npm run db:migrate

# 3. Seed database (optional - creates test accounts)
cd packages/backend
npm run db:seed
cd ../..

# 4. Start servers
npm run dev
```

## ✅ What You'll See

**Landing Page** (http://localhost:3000):
- Welcome message
- Login and Register buttons

**After Login/Register:**
- Dashboard with your company name
- Stats cards (Supplier) or search bar (Company)
- Logout button

## 🎯 Current Features

✅ Authentication (Login/Register)  
✅ Protected routes  
✅ Dashboard layouts  
✅ User session management  

🚧 Coming Next:
- Product management
- Price management
- Search and browsing
- Real-time updates

## 💡 Pro Tip

The UI will work even if the database isn't fully set up - you can still see the login/register pages and basic dashboard structure!

---

**Start now**: Just run `npm run dev` and visit http://localhost:3000



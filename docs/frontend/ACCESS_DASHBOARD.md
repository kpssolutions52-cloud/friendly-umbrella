# How to Access the Dashboard UI

## Quick Steps

### 1. Start the Development Servers

The dashboard UI runs on the frontend, which connects to the backend API. You need both running:

**Option A: Run both together (Recommended)**
```bash
npm run dev
```

This will start:
- Backend API on: http://localhost:8000
- Frontend UI on: http://localhost:3000

**Option B: Run separately (in two terminals)**

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

### 2. Complete Database Setup (If Not Done Yet)

Before accessing the dashboard, make sure the database is set up:

```bash
# Run migrations (if not done)
npm run db:migrate

# Seed with sample data
cd packages/backend
npm run db:seed
cd ../..
```

### 3. Access the Dashboard

#### Option A: Register a New Account
1. Open browser: **http://localhost:3000**
2. Click **"Register"** button
3. Choose account type:
   - **Supplier** → Will access Supplier Dashboard
   - **Company** → Will access Company Dashboard
4. Fill in the form and register
5. You'll be automatically redirected to your dashboard

#### Option B: Login with Seeded Data
1. Open browser: **http://localhost:3000**
2. Click **"Login"** button
3. Use one of these test accounts:

   **Supplier Account:**
   - Email: `supplier@example.com`
   - Password: `password123`
   - Dashboard: http://localhost:3000/supplier/dashboard

   **Company Account:**
   - Email: `company@example.com`
   - Password: `password123`
   - Dashboard: http://localhost:3000/company/dashboard

### 4. Dashboard URLs

Once logged in, you can access:

- **Supplier Dashboard**: http://localhost:3000/supplier/dashboard
- **Company Dashboard**: http://localhost:3000/company/dashboard

**Note**: You'll be automatically redirected based on your account type. If you try to access the wrong dashboard, you'll be redirected to the correct one.

## Troubleshooting

### "Cannot connect to backend" or API errors
- Make sure backend is running on port 8000
- Check: http://localhost:8000/health
- Should return: `{"status":"ok","timestamp":"..."}`

### "Page not found" or redirect loops
- Make sure you're logged in
- Try logging out and logging back in
- Check browser console for errors

### Database connection errors
- Verify Docker containers are running: `docker ps`
- Check database is migrated: `npm run db:migrate`

## Current Implementation Status

✅ **Working:**
- Authentication (Login/Register)
- Protected Routes
- Dashboard landing pages
- Basic UI structure

🚧 **Coming Next:**
- Product management UI (Supplier)
- Price management UI (Supplier)
- Product browsing UI (Company)
- Search functionality
- Real-time price updates

## Quick Start Command

Run this single command to start everything:

```bash
npm run dev
```

Then open: **http://localhost:3000**



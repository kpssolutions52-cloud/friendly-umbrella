# 🎯 How to Access the Dashboard - Quick Guide

## ✅ Servers Are Starting!

The development servers are starting in the background. Here's how to access the dashboard:

## 📍 Dashboard Access

### **Open Your Browser Now**

Go to: **http://localhost:3000**

*(If you see "This site can't be reached", wait 10-20 more seconds and refresh)*

## 🔐 Login or Register

### **Option 1: Register New Account**

1. Click **"Register"** button
2. Select account type:
   - **Supplier** → For suppliers managing products/prices
   - **Company** → For companies viewing prices
3. Fill in:
   - Company/Supplier Name
   - Email
   - Password (min 8 characters)
   - First/Last Name (optional)
4. Click **"Create account"**
5. **You'll automatically be redirected to your dashboard!**

### **Option 2: Login with Test Accounts**

*(If database is seeded - may not work until migrations complete)*

1. Click **"Login"** button
2. Use credentials:

   **Supplier Account:**
   ```
   Email: supplier@example.com
   Password: password123
   ```

   **Company Account:**
   ```
   Email: company@example.com
   Password: password123
   ```

## 📊 Dashboard URLs

After logging in, you'll see:

- **Supplier Dashboard**: http://localhost:3000/supplier/dashboard
  - Product management
  - Price management
  - Statistics

- **Company Dashboard**: http://localhost:3000/company/dashboard
  - Browse suppliers
  - View products
  - Search prices

## ⏱️ How Long to Wait?

- **Backend**: Usually 10-20 seconds
- **Frontend**: Usually 15-30 seconds

**Total wait time**: ~30 seconds from when servers start

## 🔍 Check Server Status

### Backend Health Check:
Open: http://localhost:8000/health

Should show:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Frontend:
Open: http://localhost:3000

Should show:
- Landing page with login/register buttons

## 🎨 What You'll See

**Landing Page:**
- Title: "Construction Pricing Platform"
- Subtitle about real-time pricing
- Two buttons: "Login" and "Register"

**After Login/Register:**
- Dashboard with your company name
- Navigation/header with logout
- Stats cards or search (depending on account type)
- Welcome message

## 🐛 Troubleshooting

### Page won't load?
- Wait 30 seconds and refresh
- Check terminal for errors
- Make sure servers started successfully

### "Cannot connect" error?
- Backend might still be starting
- Check: http://localhost:8000/health
- Look at terminal output

### Login/Register not working?
- Database might need setup (migrations)
- UI pages will still work for testing
- You can explore the interface structure

## 🚀 Quick Start

1. **Wait 20-30 seconds** (servers are starting)
2. **Open**: http://localhost:3000
3. **Click**: "Register" or "Login"
4. **Explore**: Your dashboard!

---

**Ready? Open http://localhost:3000 now!** 🎉

The servers are running in the background. Even if you see a connection error, wait a moment and try again - they're still booting up!



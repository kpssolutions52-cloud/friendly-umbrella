# Testing Checklist

## ✅ Completed Setup
- [x] Dependencies installed
- [x] Backend .env file created with correct DATABASE_URL
- [x] Frontend .env.local created
- [x] Database configuration ready

## 🔄 Next Steps

### 1. Start Docker (Required)
```bash
# Start Docker Desktop first, then:
docker-compose up -d

# Verify containers are running:
docker ps
```

### 2. Setup Database
```bash
npm run db:generate
npm run db:migrate
cd packages/backend && npm run db:seed && cd ../..
```

### 3. Start Servers
```bash
npm run dev
```

This will start:
- Backend on http://localhost:8000
- Frontend on http://localhost:3000

## 🧪 Testing Steps

### Test 1: Backend Health
- [ ] Visit http://localhost:8000/health
- [ ] Should see: `{"status":"ok","timestamp":"..."}`

### Test 2: Frontend Landing Page
- [ ] Visit http://localhost:3000
- [ ] Should see landing page with Login/Register buttons

### Test 3: Registration
- [ ] Go to http://localhost:3000/auth/register
- [ ] Select "Supplier"
- [ ] Fill form and register
- [ ] Should redirect to supplier dashboard

### Test 4: Login (Seeded Data)
- [ ] Logout or use incognito
- [ ] Go to http://localhost:3000/auth/login
- [ ] Login with: `supplier@example.com` / `password123`
- [ ] Should see supplier dashboard

### Test 5: Company Login
- [ ] Logout
- [ ] Login with: `company@example.com` / `password123`
- [ ] Should see company dashboard

### Test 6: Protected Routes
- [ ] Try accessing http://localhost:3000/supplier/dashboard without login
- [ ] Should redirect to login page

## 📝 Notes

- If Docker is not installed, you can use local PostgreSQL instead
- Update DATABASE_URL in `packages/backend/.env` to point to your local DB
- Redis is optional for MVP - can skip for now

## 🐛 Common Issues

**Docker not running?**
- Install Docker Desktop or use local PostgreSQL

**Port 8000 in use?**
- Change PORT in `packages/backend/.env`

**Port 3000 in use?**
- Next.js will automatically use next available port

**Database connection failed?**
- Check Docker containers: `docker ps`
- Verify DATABASE_URL in .env file

## 🎯 Ready to Test!

Run these commands in order:
```bash
# 1. Start Docker
docker-compose up -d

# 2. Setup database
npm run db:generate
npm run db:migrate
cd packages/backend && npm run db:seed && cd ../..

# 3. Start everything
npm run dev
```

Then visit:
- Frontend: http://localhost:3000
- Backend Health: http://localhost:8000/health



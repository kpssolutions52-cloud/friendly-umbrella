# Testing Setup Guide

Follow these steps to test the application:

## Step 1: Install Dependencies

```bash
npm install
```

This will install all dependencies for root, backend, frontend, and shared packages.

## Step 2: Start Databases (Docker)

```bash
docker-compose up -d
```

Wait 10-15 seconds for databases to start.

## Step 3: Configure Environment

### Backend Environment

Copy the example file to create `.env`:
- **Windows**: `copy packages\backend\env.example packages\backend\.env`
- **Mac/Linux**: `cp packages/backend/env.example packages/backend/.env`

Edit `packages/backend/.env` - the DATABASE_URL should be:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/construction_pricing?schema=public
```

### Frontend Environment

Create `packages/frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Step 4: Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
cd packages/backend
npm run db:seed
cd ../..
```

## Step 5: Start Development Servers

In one terminal:
```bash
npm run dev
```

Or separately:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## Step 6: Test the Application

1. **Backend Health Check**: Visit http://localhost:8000/health
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend**: Visit http://localhost:3000
   - Should show the landing page

3. **Register a Supplier**:
   - Go to http://localhost:3000/auth/register
   - Select "Supplier"
   - Fill in the form and register

4. **Register a Company**:
   - Logout (or use incognito)
   - Register as "Company"

5. **Login with Seeded Data**:
   - Supplier: `supplier@example.com` / `password123`
   - Company: `company@example.com` / `password123`

## Troubleshooting

### Port Already in Use
- Backend (8000): Change PORT in `packages/backend/.env`
- Frontend (3000): Already configured to use 3000

### Database Connection Error
```bash
# Check if Docker containers are running
docker ps

# Check database logs
docker-compose logs postgres
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules packages/*/node_modules
npm install
```

### Prisma Errors
```bash
# Regenerate Prisma client
npm run db:generate
```

## Testing Checklist

- [ ] Dependencies installed
- [ ] Docker containers running
- [ ] Environment files configured
- [ ] Database migrated
- [ ] Database seeded
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can access health endpoint
- [ ] Can see landing page
- [ ] Can register new account
- [ ] Can login
- [ ] Dashboard loads correctly



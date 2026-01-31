# Quick Testing Guide

## Current Status
✅ Dependencies installed
✅ Environment files created
⚠️ Docker needs to be started

## Step 1: Start Docker (Required for Database)

**Option A: Start Docker Desktop**
- Open Docker Desktop application
- Wait until it's running (green icon in system tray)

**Option B: Check if Docker is installed**
```bash
docker --version
```

## Step 2: Start Databases

Once Docker is running, start the containers:

```bash
docker-compose up -d
```

Wait 10-15 seconds, then verify:
```bash
docker ps
```

You should see:
- `construction-pricing-db` (PostgreSQL)
- `construction-pricing-redis` (Redis)

## Step 3: Update Database URL

The `.env` file should have this DATABASE_URL:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/construction_pricing?schema=public
```

Verify in `packages/backend/.env`

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

**Option A: Run both together**
```bash
npm run dev
```

**Option B: Run separately (in two terminals)**

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

## Step 6: Test

1. **Backend Health**: http://localhost:8000/health
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend**: http://localhost:3000
   - Landing page should load

3. **Login with seeded data**:
   - Supplier: `supplier@example.com` / `password123`
   - Company: `company@example.com` / `password123`

4. **Or register new accounts**:
   - Go to http://localhost:3000/auth/register
   - Create supplier or company account

## Troubleshooting

### Docker not starting?
- Make sure Docker Desktop is installed and running
- Check: `docker ps` should work

### Database connection error?
- Verify Docker containers are running: `docker ps`
- Check DATABASE_URL in `packages/backend/.env`
- Try: `docker-compose restart`

### Port already in use?
- Backend (8000): Kill process using port 8000
- Frontend (3000): Next.js will auto-use next available port

### Module errors?
```bash
# Clean install
rm -rf node_modules packages/*/node_modules
npm install
```

## Next Steps After Testing

Once everything is running:
1. ✅ Test authentication (login/register)
2. ✅ Test supplier dashboard
3. ✅ Test company dashboard
4. ⏭️ Test product creation (supplier)
5. ⏭️ Test price management
6. ⏭️ Test product browsing (company)



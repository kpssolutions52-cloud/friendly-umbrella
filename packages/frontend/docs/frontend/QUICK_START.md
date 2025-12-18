# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Start Databases (Docker)

```bash
docker-compose up -d
```

## 3. Configure Environment

**Backend:**
```bash
# Windows
copy packages\backend\env.example packages\backend\.env

# Mac/Linux
cp packages/backend/env.example packages/backend/.env
```

**Frontend:**
Create `packages/frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Add sample data
cd packages/backend
npm run db:seed
cd ../..
```

## 5. Start Development

```bash
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/health

## Test Credentials (after seeding)

- **Supplier**: `supplier@example.com` / `password123`
- **Company**: `company@example.com` / `password123`

## Next Steps

- Read [SETUP.md](./SETUP.md) for detailed setup
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Start building features!

## Troubleshooting

**Port already in use?**
- Change ports in `.env` files

**Database connection error?**
- Ensure Docker containers are running: `docker ps`
- Check DATABASE_URL in `.env`

**Module not found?**
- Reinstall: `rm -rf node_modules packages/*/node_modules && npm install`



# Setup Guide

This guide will help you set up the Construction Pricing Platform locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ and **npm** 10+
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (optional for MVP, use Docker)

## Quick Start

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Wait a few seconds for databases to start, then continue
```

#### Option B: Local PostgreSQL

Make sure PostgreSQL is running and create a database:

```sql
CREATE DATABASE construction_pricing;
```

### 3. Environment Configuration

#### Backend Environment

Create `packages/backend/.env`:

```bash
# Copy the example file (Windows)
copy packages\backend\env.example packages\backend\.env

# Or on Mac/Linux:
cp packages/backend/env.example packages/backend/.env
```

Edit `packages/backend/.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=8000
API_URL=http://localhost:8000

# Frontend
WEB_URL=http://localhost:3000

# Database (use the connection string from Docker or your local setup)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/construction_pricing?schema=public

# JWT (generate strong random secrets in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

#### Frontend Environment

Create `packages/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 4. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with sample data
cd packages/backend
npm run db:seed
cd ../..
```

### 5. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start individually:
npm run dev:backend   # Backend API on http://localhost:8000
npm run dev:frontend  # Frontend on http://localhost:3000
```

## Verify Installation

1. **Backend Health Check**: Visit http://localhost:8000/health
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend**: Visit http://localhost:3000
   - Should see the landing page

3. **Database**: If you seeded, you can login with:
   - Supplier: `supplier@example.com` / `password123`
   - Company: `company@example.com` / `password123`

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running: `docker ps` or check your local PostgreSQL service
- Verify DATABASE_URL in `.env` matches your setup
- Check if the database exists: `psql -U postgres -l`

### Port Already in Use

- Backend default: 8000 - change in `packages/backend/.env`
- Frontend default: 3000 - change in `packages/frontend/package.json`

### Prisma Issues

```bash
# Reset Prisma client
rm -rf packages/backend/node_modules/.prisma
npm run db:generate

# Reset database (WARNING: deletes all data)
cd packages/backend
npx prisma migrate reset
```

### Module Resolution Issues

```bash
# Reinstall all dependencies
rm -rf node_modules packages/*/node_modules
npm install
```

## Development Workflow

1. **Make code changes** in `packages/backend/src` or `packages/frontend/src`
2. **Watch mode** will automatically restart servers
3. **Check logs** in terminal for errors
4. **Test API endpoints** using tools like Postman or Insomnia

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Read [README.md](./README.md) for project overview
- Start building features following the roadmap in ARCHITECTURE.md

## Useful Commands

```bash
# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio (database GUI)

# Development
npm run dev            # Start all services
npm run build          # Build all packages
npm run test           # Run tests
npm run lint           # Lint code

# Docker
docker-compose up -d   # Start databases
docker-compose down    # Stop databases
docker-compose logs    # View database logs
```

## Production Setup

For production deployment, see the Deployment section in [ARCHITECTURE.md](./ARCHITECTURE.md#9-deployment-plan).

Key differences:
- Set `NODE_ENV=production`
- Use strong, randomly generated JWT secrets
- Configure proper CORS origins
- Set up monitoring and logging
- Configure database backups
- Use environment-specific configurations


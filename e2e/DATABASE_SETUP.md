# Database Setup for E2E Tests

## Problem
If you're seeing this error:
```
Can't reach database server at `localhost:5432`
```

This means the backend needs a valid `DATABASE_URL` environment variable.

## Solution

You need to set the `DATABASE_URL` environment variable before running E2E tests.

### Option 1: Use a Remote Database (Recommended)

Set `DATABASE_URL` to your remote database connection string:

**Windows PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

**Windows Command Prompt:**
```cmd
set DATABASE_URL=postgresql://user:password@host:port/database?schema=public
```

**Unix/Mac/Linux:**
```bash
export DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

### Option 2: Use Local PostgreSQL

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Start PostgreSQL service**
   - Windows: Start the PostgreSQL service from Services
   - Mac: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

3. **Create a database:**
   ```sql
   CREATE DATABASE construction_pricing_test;
   ```

4. **Set DATABASE_URL:**
   ```bash
   DATABASE_URL=postgresql://postgres:password@localhost:5432/construction_pricing_test?schema=public
   ```

### Option 3: Use .env File

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
JWT_SECRET=test-jwt-secret-key-for-e2e-tests-minimum-32-characters-long
JWT_REFRESH_SECRET=test-jwt-refresh-secret-key-for-e2e-tests-minimum-32-characters-long
```

The `.env` file will be automatically loaded by the backend.

## Verify Setup

After setting `DATABASE_URL`, verify it's working:

```bash
# Test database connection
npm run test:e2e -- --grep "should login successfully"
```

## Common Database Providers

### Railway
```bash
DATABASE_URL=${{ RAILWAY_DATABASE_URL }}
```

### Supabase
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### Neon
```bash
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

## Notes

- The global setup will automatically seed test users if the database is accessible
- Test users will be created/updated automatically:
  - `admin@system.com` (password: `admin123`) - Super Admin
  - `supplier@example.com` (password: `password123`) - Supplier Admin
  - `company@example.com` (password: `password123`) - Company Admin
  - `test@example.com` (password: `password123`) - Customer







# Seed Demo Accounts

This script creates demo QS and Supplier accounts for testing the platform without registration.

## Demo Account Credentials

### QS Professional
- **Email:** `demo.qs@constructionguru.com`
- **Password:** `DemoQS123!`
- **Access:** QS Chat Interface (`/chat`)

### Supplier
- **Email:** `demo.supplier@constructionguru.com`
- **Password:** `DemoSupplier123!`
- **Access:** Supplier Dashboard (`/supplier/products`)

## How to Run

### Option 1: Using Node.js Script (Recommended)

1. Navigate to the project root:
   ```bash
   cd /path/to/friendly-umbrella
   ```

2. Make sure you have the required dependencies:
   ```bash
   cd packages/backend
   npm install
   ```

3. Set your `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="your-database-url"
   ```

4. Run the seed script:
   ```bash
   node database/seed-demo-accounts.js
   ```

### Option 2: Using Prisma Studio

1. Open Prisma Studio:
   ```bash
   cd packages/backend
   npx prisma studio
   ```

2. Manually create the organizations and users with the credentials above.

### Option 3: Using SQL (Manual)

1. Generate password hashes using Node.js:
   ```javascript
   const bcrypt = require('bcryptjs');
   const hash = await bcrypt.hash('DemoQS123!', 10);
   console.log(hash);
   ```

2. Update `database/seed-demo-accounts.sql` with the actual hashes.

3. Run the SQL script against your database.

## Accessing Demo Accounts

After seeding, users can:

1. Go to `/auth/demo` to see the demo login page
2. Select either QS Professional or Supplier
3. Click "Try Demo" to auto-login with pre-filled credentials
4. Or manually login at `/auth/login` with the demo credentials

## Notes

- Demo accounts are created with fixed UUIDs for consistency
- Passwords are hashed using bcrypt with 10 rounds
- Organizations are created with type `company` (for QS) and `supplier` (for Supplier)
- Users are created with type `qs` and `supplier` respectively

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"
- Make sure you've run `npx prisma generate` in `packages/backend`

### Error: "DATABASE_URL not set"
- Set the `DATABASE_URL` environment variable before running the script

### Error: "Email already exists"
- The script uses `upsert`, so it will update existing accounts if they exist
- This is safe to run multiple times

### Demo login fails
- Verify the accounts exist in the database
- Check that passwords are correctly hashed
- Ensure the backend API is running and accessible

#!/bin/bash
set -e

echo "🚀 Starting backend server..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

echo "✅ DATABASE_URL is set"

# Run database migrations
echo "📦 Running database migrations..."
cd "$(dirname "$0")"
npm run db:migrate:deploy || {
  echo "❌ ERROR: Database migrations failed!"
  echo "This might be because:"
  echo "  1. DATABASE_URL is incorrect"
  echo "  2. Database is not accessible"
  echo "  3. Prisma schema is out of sync"
  exit 1
}

echo "✅ Database migrations completed successfully"

# Start the server
echo "🌐 Starting Node.js server..."
node dist/index.js


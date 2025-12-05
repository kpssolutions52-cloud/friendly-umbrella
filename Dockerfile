# Multi-stage build for backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy all package files first
COPY package*.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Copy TypeScript config files
COPY tsconfig.json ./
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/shared/tsconfig.json ./packages/shared/

# Install all dependencies (needed for building)
RUN npm ci

# Copy Prisma schema
COPY packages/backend/prisma/schema.prisma ./packages/backend/prisma/schema.prisma

# Generate Prisma Client
WORKDIR /app/packages/backend
RUN npm run db:generate

# Copy all source code
WORKDIR /app
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

# Build shared package first (dependency)
WORKDIR /app/packages/shared
RUN npm run build

# Build backend - force rebuild
WORKDIR /app/packages/backend
RUN rm -rf dist && npm run build

# Verify build output exists and show contents
RUN echo "=== Checking dist folder ===" && \
    ls -la dist/ && \
    echo "=== Checking for index.js ===" && \
    test -f dist/index.js && echo "✅ dist/index.js exists" || (echo "❌ dist/index.js NOT FOUND" && exit 1) && \
    echo "=== Build verification complete ==="

# Production backend image
FROM node:20-alpine AS backend

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=backend-builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=backend-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=backend-builder /app/packages/backend/prisma ./packages/backend/prisma

# Verify files were copied to final image
RUN echo "=== Verifying files in final image ===" && \
    ls -la packages/backend/ && \
    ls -la packages/backend/dist/ && \
    test -f packages/backend/dist/index.js && echo "✅ dist/index.js found in final image" || (echo "❌ dist/index.js NOT FOUND in final image" && exit 1) && \
    echo "=== Final image verification complete ==="

WORKDIR /app/packages/backend

# Railway sets PORT automatically
ENV PORT=8000
EXPOSE $PORT

# Use exec form to run node directly
CMD ["node", "dist/index.js"]

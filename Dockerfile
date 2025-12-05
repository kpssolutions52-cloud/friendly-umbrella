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

# Build backend
WORKDIR /app/packages/backend
RUN npm run build

# Verify build output exists
RUN ls -la dist/ || (echo "Build failed - dist folder not found" && exit 1)
RUN test -f dist/index.js || (echo "dist/index.js not found" && exit 1)

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

# Verify files were copied
RUN ls -la packages/backend/dist/ || (echo "dist folder not copied" && exit 1)
RUN test -f packages/backend/dist/index.js || (echo "dist/index.js not found in final image" && exit 1)

WORKDIR /app/packages/backend

# Railway sets PORT automatically
ENV PORT=8000
EXPOSE $PORT

# Use exec form to run node directly
CMD ["node", "dist/index.js"]

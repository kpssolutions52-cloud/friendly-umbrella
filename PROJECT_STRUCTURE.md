# Project Structure

This document describes the structure of the Construction Pricing Platform monorepo.

## Root Level

```
construction-pricing-platform/
├── packages/              # Workspace packages
├── .github/              # GitHub Actions workflows
├── docker-compose.yml    # Local development databases
├── Dockerfile           # Production container
├── ARCHITECTURE.md      # Complete architecture documentation
├── SETUP.md            # Setup and installation guide
├── README.md           # Project overview
├── package.json        # Root workspace configuration
└── tsconfig.json       # Root TypeScript config
```

## Packages

### `packages/backend`

Express.js API server with WebSocket support.

```
packages/backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seed script
├── src/
│   ├── index.ts               # Application entry point
│   ├── middleware/
│   │   ├── auth.ts            # Authentication middleware
│   │   ├── errorHandler.ts    # Error handling
│   │   └── notFoundHandler.ts # 404 handler
│   ├── routes/
│   │   ├── index.ts           # Route setup
│   │   └── authRoutes.ts      # Authentication routes
│   ├── services/
│   │   └── authService.ts     # Authentication business logic
│   ├── utils/
│   │   ├── jwt.ts             # JWT utilities
│   │   ├── password.ts        # Password hashing
│   │   ├── prisma.ts          # Prisma client
│   │   └── logger.ts          # Winston logger
│   └── websocket/
│       ├── index.ts           # WebSocket setup
│       ├── auth.ts            # WebSocket authentication
│       └── handlers/
│           └── priceUpdates.ts # Price update handlers
├── logs/                      # Application logs
├── package.json
├── tsconfig.json
└── env.example                # Environment variables template
```

**Key Files:**
- `src/index.ts` - Starts Express server and WebSocket
- `prisma/schema.prisma` - Complete database schema with all tables
- `src/services/authService.ts` - Authentication logic

### `packages/frontend`

Next.js 14 web application with App Router.

```
packages/frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components (to be added)
│   └── lib/                   # Utilities (to be added)
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

**Key Files:**
- `src/app/layout.tsx` - Root layout component
- `src/app/page.tsx` - Landing page
- `tailwind.config.ts` - Tailwind CSS configuration

### `packages/shared`

Shared TypeScript types and utilities.

```
packages/shared/
├── src/
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── schemas/
│   │   └── index.ts           # Zod validation schemas
│   └── index.ts               # Public exports
├── package.json
└── tsconfig.json
```

**Key Files:**
- `src/types/index.ts` - All shared types (User, Product, Price, etc.)
- `src/schemas/index.ts` - Zod schemas for validation

## Configuration Files

### Root Level

- `.gitignore` - Git ignore patterns
- `.prettierrc` - Prettier formatting config
- `.prettierignore` - Files to ignore for Prettier
- `docker-compose.yml` - PostgreSQL and Redis containers
- `Dockerfile` - Production Docker image
- `.dockerignore` - Docker build ignore patterns

### Package Level

Each package has:
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - ESLint rules (backend)

## Database Schema

See `packages/backend/prisma/schema.prisma` for complete schema.

**Key Models:**
- `Tenant` - Suppliers and companies
- `User` - All users across tenants
- `Product` - Supplier product catalog
- `DefaultPrice` - Prices visible to all companies
- `PrivatePrice` - Company-specific prices
- `PriceAuditLog` - Audit trail
- `PriceView` - Analytics tracking

## API Routes

Currently implemented:
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

To be implemented (see ARCHITECTURE.md):
- Product management routes
- Price management routes
- Supplier browsing routes
- Search and filter routes

## WebSocket Events

See `packages/backend/src/websocket/` for WebSocket implementation.

**Events:**
- `price:updated` - Broadcast when prices change
- `price:created` - New price added
- `product:created` - New product added

## Development Workflow

1. **Backend Changes**: Edit files in `packages/backend/src/`
2. **Frontend Changes**: Edit files in `packages/frontend/src/`
3. **Shared Types**: Update `packages/shared/src/` when adding new types
4. **Database Changes**: Modify `prisma/schema.prisma`, then run migrations

## Build Output

- Backend: `packages/backend/dist/`
- Frontend: `packages/frontend/.next/`
- Shared: `packages/shared/dist/`

These directories are gitignored.

## Environment Variables

Backend: `packages/backend/.env` (copy from `env.example`)
Frontend: `packages/frontend/.env.local`

See `SETUP.md` for configuration details.

## Testing

- Backend: Jest tests in `packages/backend/src/__tests__/` (to be added)
- Frontend: Tests in `packages/frontend/__tests__/` (to be added)

## Documentation

- `ARCHITECTURE.md` - Complete system architecture
- `SETUP.md` - Installation and setup guide
- `README.md` - Project overview
- `PROJECT_STRUCTURE.md` - This file


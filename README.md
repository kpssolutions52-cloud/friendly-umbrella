# AI QS Assistant (ConstructGPT/QSGPT)

An AI-powered assistant for Quantity Surveyors that provides instant answers about construction pricing, powered by real-time supplier data.

**Think of it as "ChatGPT for Quantity Surveyors" - but with actual, up-to-date supplier prices.**

## 🚀 Features

### Core Features (MVP)
- ✅ **AI Chat Interface** - ChatGPT-like interface for QS professionals
- ✅ **Real-Time Supplier Data** - All AI answers include actual supplier prices
- ✅ **Smart Calculations** - Automatic cost calculations with quantities
- ✅ **Simple Registration** - 2 user types (QS, Supplier), instant access
- ✅ **Product Management** - Suppliers add products easily (name, price, unit)
- ✅ **Caching Layer** - Fast responses with Redis caching
- ✅ **Responsive Design** - Works on all devices

### Coming Soon (Phase 2+)
- 📊 Vector database for knowledge base
- 📝 Quote generation from chat
- 🔍 Advanced product search
- 📱 Mobile applications
- 🔗 Supplier ERP integration

## 🏗️ Architecture

This is a monorepo containing:

- **`packages/backend`** - Node.js/Express API server with WebSocket support
- **`packages/frontend`** - Next.js 14 web application
- **`packages/shared`** - Shared TypeScript types and utilities

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete architecture documentation.

## 🎮 Demo Accounts

Quick access to test the platform:

**Demo Supplier (with products):**
- Email: Check [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) for supplier with most products
- Password: `Demo123!`

**Demo Company:**
- Email: `company@example.com`
- Password: `password123`

**Super Admin:**
- Email: `admin@system.com`
- Password: `admin123`

See [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) for complete demo account information.

## 📋 Prerequisites

- Node.js 20+ and npm 10+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for local development)

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy environment files and configure:

```bash
# Backend
cp packages/backend/.env.example packages/backend/.env

# Frontend
cp packages/frontend/.env.example packages/frontend/.env
```

Edit `.env` files with your configuration:
- Database connection strings
- JWT secrets
- Redis connection
- API URLs

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run dev:backend   # Backend API on http://localhost:8000
npm run dev:frontend  # Frontend on http://localhost:3000
```

## 📁 Project Structure

```
construction-pricing-platform/
├── packages/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── routes/   # API routes
│   │   │   ├── services/ # Business logic
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── prisma/       # Database schema & migrations
│   │   └── tests/
│   ├── frontend/         # Next.js web app
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities
│   └── shared/           # Shared types & utilities
├── ARCHITECTURE.md       # Complete architecture documentation
└── README.md            # This file
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in specific package
npm test --workspace=@platform/backend
npm test --workspace=@platform/frontend
```

## 📝 Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## 🔐 Security

- Row-Level Security (RLS) for multi-tenant data isolation
- JWT authentication with refresh tokens
- Input validation and sanitization
- Rate limiting
- HTTPS/WSS for all connections

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete architecture and planning document
- [User Registration & Role Management](./docs/user-guide/user-registration-and-roles.md) - Complete guide for registration and user management
- [Technical: User Registration](./docs/technical/user-registration-role-management.md) - Technical implementation details
- [User Guides](./docs/user-guide/) - Step-by-step guides for all user types
- [Technical Documentation](./docs/technical/) - Developer documentation and API reference

## 🛣️ Roadmap

See [ARCHITECTURE.md](./ARCHITECTURE.md#14-development-roadmap) for detailed roadmap.

### Phase 1 (MVP) - Weeks 1-8
- Foundation setup
- Core supplier features
- Core company features
- Real-time updates
- Testing and launch prep

### Phase 2 - Weeks 9-16
- Mobile applications
- CSV import/export
- Analytics dashboard
- Advanced features

### Phase 3 - Weeks 17+
- ERP integrations
- Advanced analytics
- Marketplace features

## 🤝 Contributing

This project is in active development. Contribution guidelines will be added soon.

## 📄 License

MIT License - see LICENSE file for details

## 👥 User Roles

### Tenant-Level Roles

- **Supplier Admin** - Full access to products and pricing, manage users
- **Supplier Staff** - View/edit products (configurable permissions)
- **Company Admin** - View all prices, manage team, export, manage users
- **Company Staff** - View prices only

### System-Level Roles

- **Super Admin** - System-wide administration, approve tenants, manage all organizations

### Registration and Approval

The platform features a comprehensive registration and approval system:

- **New Company/Supplier Registration** - Creates new organization, pending Super Admin approval
- **New User Registration** - Adds users to existing organizations, pending Tenant Admin approval
- **Role Management** - Admins can assign permissions (view/create/admin) to users
- **Status Management** - Users can be pending, active, rejected, or inactive

See [User Registration and Role Management Guide](./docs/user-guide/user-registration-and-roles.md) for complete details.

## 🔗 API Endpoints

See [ARCHITECTURE.md](./ARCHITECTURE.md#5-api-design) for complete API documentation.

Key endpoints:
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/products` - List products (supplier)
- `GET /api/v1/products/search` - Search products (company)
- `POST /api/v1/products/:id/private-prices` - Set private price
- WebSocket events for real-time updates

## 🐛 Troubleshooting

### Database connection issues
- Check PostgreSQL is running
- Verify connection string in `.env`
- Ensure database exists

### Port already in use
- Backend default: 8000
- Frontend default: 3000
- Change ports in `.env` files if needed

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**Status**: 🚧 In Development - MVP Phase









# Deployment trigger
# Trigger deployment Fri Dec  5 18:33:08 +0530 2025
# Force Railway refresh

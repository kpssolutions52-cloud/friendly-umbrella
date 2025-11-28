# Construction Supplier Pricing Platform - Complete Architecture & Planning Document

---

## 1. MVP Feature List

### Must-Have (Phase 1)
- ✅ Multi-tenant user registration and authentication (Suppliers + Companies)
- ✅ Supplier dashboard to manage products and prices
- ✅ Company dashboard to view prices
- ✅ Product catalog management (CRUD)
- ✅ Default price management per product
- ✅ Private/negotiated price assignment (company-specific)
- ✅ Real-time price update notifications (WebSocket)
- ✅ Role-based access control (strict data isolation)
- ✅ Web application (responsive)
- ✅ Price visibility rules (default vs private)
- ✅ Basic search and filter for products
- ✅ Audit log for price changes

### Nice-to-Have (Phase 2+)
- 📱 Mobile applications (iOS/Android)
- 📱 Offline mode for mobile (cached price lists)
- 📄 CSV import/export for bulk product management
- 📊 Price history/trends visualization
- 🔗 Supplier ERP integration (API/webhooks)
- 📊 Advanced analytics dashboard
- 🔄 Bulk price update operations
- 📧 Email/SMS notifications for price changes
- 📁 Product categories and subcategories
- 💰 Price comparison tools
- 📝 Quote request workflow
- 🛒 Order management
- 💳 Payment integration
- 💱 Multi-currency support
- 🖼️ Product images and specifications

---

## 2. User Roles & User Stories

### User Roles

1. **Supplier Admin**
   - Manage company profile
   - Add/edit/delete products
   - Set default prices
   - Set private prices for specific companies
   - View analytics
   - Manage team members

2. **Supplier Staff**
   - View products and prices
   - Update prices (with permission)
   - Limited analytics access

3. **Company Admin (Estimator/QS)**
   - View all default prices
   - View company-specific private prices
   - Manage company profile
   - Invite team members
   - Export price lists

4. **Company Staff (Viewer)**
   - View prices (default + private)
   - Search and filter products
   - No admin privileges

### User Stories

#### Supplier User Stories

**US-S1**: As a supplier admin, I want to add products to my catalog so companies can see what I offer.
- Acceptance: Can add product name, SKU, description, unit, default price
- Priority: Must-have

**US-S2**: As a supplier admin, I want to set a default price for a product so all companies see it.
- Acceptance: Default price visible to all companies immediately
- Priority: Must-have

**US-S3**: As a supplier admin, I want to set a private price for a specific company so I can offer negotiated rates.
- Acceptance: Private price visible only to that company, not others
- Priority: Must-have

**US-S4**: As a supplier admin, I want to update prices in bulk via CSV so I can manage large catalogs efficiently.
- Acceptance: CSV upload updates multiple products at once
- Priority: Nice-to-have

**US-S5**: As a supplier admin, I want to see who viewed my prices and when for analytics.
- Acceptance: Dashboard shows view statistics
- Priority: Nice-to-have

#### Company User Stories

**US-C1**: As a company admin, I want to see default prices from all suppliers so I can compare options.
- Acceptance: Can browse suppliers and view their default prices
- Priority: Must-have

**US-C2**: As a company admin, I want to see my private prices clearly marked so I know my special rates.
- Acceptance: UI clearly distinguishes default vs private prices
- Priority: Must-have

**US-C3**: As a company staff, I want real-time price updates so I always have current pricing.
- Acceptance: Price changes appear immediately without page refresh
- Priority: Must-have

**US-C4**: As a company staff, I want to search and filter products so I can find what I need quickly.
- Acceptance: Search by name, SKU, category with filters
- Priority: Must-have

**US-C5**: As a company admin, I want to export price lists to CSV so I can use them in my estimates.
- Acceptance: CSV export with current prices
- Priority: Must-have

**US-C6**: As a company staff, I want offline access to cached prices on mobile so I can work without internet.
- Acceptance: Mobile app works offline with last synced prices
- Priority: Nice-to-have

---

## 3. System Architecture & Data Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├──────────────────┬──────────────────┬───────────────────────────┤
│   Web App        │   Mobile App     │   Supplier ERP (Future)   │
│   (React/Next.js)│   (React Native) │   (Webhook/API)           │
└────────┬─────────┴────────┬─────────┴───────────┬───────────────┘
         │                  │                     │
         │ HTTPS/WSS        │ HTTPS/WSS           │ HTTPS
         │                  │                     │
┌────────▼──────────────────▼─────────────────────▼───────────────┐
│                    API Gateway / Load Balancer                  │
│                    (NGINX / AWS ALB)                            │
└────────┬──────────────────┬─────────────────────┬───────────────┘
         │                  │                     │
┌────────▼──────────────────▼─────────────────────▼───────────────┐
│                      Application Layer                          │
├──────────────┬──────────────┬───────────────────────────────────┤
│  REST API    │  WebSocket   │  Background Jobs                  │
│  (Node.js/   │  Server      │  (Queue Workers)                  │
│   Express/   │  (Socket.io) │                                   │
│   Fastify)   │              │                                   │
└──────┬───────┴──────┬───────┴───────────────────┬───────────────┘
       │              │                           │
       │              │                           │
┌──────▼──────────────▼───────────────────────────▼───────────────┐
│                      Business Logic Layer                       │
├──────────────┬──────────────┬───────────────────────────────────┤
│  Auth Service│  Price       │  Notification                     │
│              │  Service     │  Service                          │
│  Tenant      │  Audit       │  Export Service                   │
│  Service     │  Service     │                                   │
└──────┬───────┴──────┬───────┴───────────────────┬───────────────┘
       │              │                           │
┌──────▼──────────────▼───────────────────────────▼───────────────┐
│                      Data Layer                                  │
├──────────────┬──────────────┬───────────────────────────────────┤
│  PostgreSQL  │  Redis       │  S3 / Object Storage              │
│  (Primary DB)│  (Cache/     │  (File uploads)                   │
│              │   Sessions)  │                                   │
└──────────────┴──────────────┴───────────────────────────────────┘
```

### Data Flow Diagrams

#### Price Update Flow

```
Supplier updates price
         │
         ▼
[Web/Mobile App] POST /api/v1/products/:id/prices
         │
         ▼
[API Gateway] → Auth Check → Tenant Validation
         │
         ▼
[Price Service] Validate input
         │
         ▼
[PostgreSQL] Transaction:
   1. Update price table
   2. Insert audit log
   3. Commit
         │
         ▼
[Redis] Invalidate cache for affected companies
         │
         ▼
[WebSocket Server] Broadcast to:
   - Supplier's own dashboard (confirmation)
   - Affected companies (if default price)
   - Specific company (if private price)
         │
         ▼
[Client Apps] Real-time UI update
```

#### Price View Flow (Company)

```
Company requests product prices
         │
         ▼
[Web/Mobile App] GET /api/v1/products/:id/prices
         │
         ▼
[API Gateway] → Auth Check → Extract Tenant ID
         │
         ▼
[Price Service] Query with RLS:
   1. Get default price (visible to all)
   2. Get private price (if exists for this company)
   3. Return best available price
         │
         ▼
[PostgreSQL] RLS enforces:
   - Default prices: visible to all
   - Private prices: only to assigned company
         │
         ▼
[Response] Price + visibility flag (default/private)
         │
         ▼
[Client] Display with appropriate UI indicator
```

---

## 4. Database Schema

### Core Tables

See `packages/backend/prisma/schema.prisma` for the complete schema definition.

Key tables:
- `tenants` - Multi-tenant companies (suppliers and companies)
- `users` - All users across tenants
- `products` - Supplier product catalog
- `default_prices` - Default prices visible to all companies
- `private_prices` - Company-specific negotiated prices
- `price_audit_log` - Audit trail for all price changes
- `price_views` - Analytics tracking (optional for MVP)

### Relationships

```
tenants (supplier)
    │
    ├── users
    │
    └── products
            │
            ├── default_prices (visible to all companies)
            │
            ├── private_prices
            │       │
            │       └── tenants (company) [many-to-many via private_prices]
            │
            ├── price_audit_log
            │
            └── price_views
```

---

## 5. API Design

### Authentication Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Product Endpoints (Supplier)

```
GET    /api/v1/products                    # List my products
POST   /api/v1/products                    # Create product
GET    /api/v1/products/:id                # Get product details
PUT    /api/v1/products/:id                # Update product
DELETE /api/v1/products/:id                # Delete product
POST   /api/v1/products/import             # CSV bulk import
GET    /api/v1/products/export             # CSV export
```

### Price Management Endpoints (Supplier)

```
PUT    /api/v1/products/:id/default-price    # Update default price
POST   /api/v1/products/:id/private-prices   # Set private price for company
PUT    /api/v1/private-prices/:id            # Update private price
DELETE /api/v1/private-prices/:id            # Remove private price
GET    /api/v1/products/:id/private-prices   # List all private prices for product
```

### Price Viewing Endpoints (Company)

```
GET    /api/v1/suppliers                    # List all suppliers
GET    /api/v1/suppliers/:id/products       # Browse supplier catalog
GET    /api/v1/products/:id/price           # Get price for specific product
GET    /api/v1/products/search              # Search products across suppliers
POST   /api/v1/price-list/export            # Export price list to CSV
```

See `packages/backend/src/routes/` for implementation details.

---

## 6. Technology Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT + Refresh Tokens
- **WebSocket**: Socket.io

### Database & Caching
- **Primary DB**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Search**: PostgreSQL Full-Text Search

### Frontend Web
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query (TanStack Query)
- **WebSocket Client**: Socket.io-client
- **Forms**: React Hook Form + Zod

### Mobile (Future)
- **Framework**: React Native
- **Navigation**: React Navigation
- **State**: React Query + Zustand
- **Offline**: React Query Persist + AsyncStorage

### Infrastructure
- **Hosting**: AWS / DigitalOcean / Railway
- **Container**: Docker
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + Datadog/New Relic

---

## 7. UI/UX Plan

### Key Screens

#### Supplier Dashboard
- Login/Register
- Dashboard Home (overview, recent updates, quick actions)
- Product List (table with search/filter)
- Add/Edit Product Form
- Set Private Price (company selection, price input)
- Price History/Audit Timeline

#### Company Dashboard
- Login/Register
- Dashboard Home (search, filters, recent updates, suppliers)
- Browse Suppliers (grid/list)
- Product Catalog (by supplier)
- Product Detail (price with default/private indicator)
- Search Results (across all suppliers)

See `packages/frontend/app/` for UI implementation.

---

## 8. Authentication & Authorization Design

### Authentication Strategy

**JWT-Based Authentication**
- Access Token (short-lived, 15 min)
- Refresh Token (long-lived, 7 days, httpOnly cookie)
- Token payload includes: userId, tenantId, role, tenantType

### Authorization Model

**Role-Based Access Control (RBAC)**

| Role | Permissions |
|------|------------|
| `supplier_admin` | Full access to own products, prices, team management |
| `supplier_staff` | View/edit products and prices (configurable) |
| `company_admin` | View all prices, manage team, export data |
| `company_staff` | View prices only (default + assigned private) |

### Private Price Visibility Rules

1. Default prices are visible to ALL authenticated companies
2. Private prices are visible ONLY to the assigned company
3. Suppliers can see all their prices (default + private)
4. Suppliers cannot see other suppliers' prices
5. Companies cannot see other companies' private prices

---

## 9. Deployment Plan

### MVP Deployment (Phase 1)
- Web Server (Next.js) + API Server (Node.js)
- Load Balancer (NGINX)
- PostgreSQL (Managed)
- Redis Cache
- S3/Spaces (File Storage)

### CI/CD Pipeline
- GitHub Actions workflow
- Automated testing
- Docker builds
- Staging and production deployments

### Monitoring
- Sentry for error tracking
- APM for performance monitoring
- Database query analysis
- Custom dashboards

---

## 10. Security Requirements

### Data Protection
- TLS 1.3 for all connections
- Database encryption at rest
- Secrets management (AWS Secrets Manager)

### Access Control
- Row-Level Security (RLS) in PostgreSQL
- API-level authorization checks
- Rate limiting (100 req/min per IP)

### Audit Logging
- All price changes logged
- User authentication events
- Failed authorization attempts
- 7-year retention

---

## 11. Non-Functional Requirements

### Performance
- API Response Time (p95): < 200ms
- Page Load Time: < 2s
- WebSocket Latency: < 100ms
- Database Query Time (p95): < 50ms
- Cache Hit Rate: > 80%

### Scalability
- Horizontal scaling for API servers
- Database read replicas
- Redis cluster for cache

### Availability
- Uptime Target: 99.9%
- Health checks and auto-restart
- Database failover

### Offline Mode (Mobile - Future)
- Cached price lists
- Last sync timestamp
- Manual refresh when online

---

## 12. Testing Strategy

### Unit Testing
- Framework: Jest
- Coverage: Business logic, utilities, API handlers

### Integration Testing
- Framework: Supertest
- Coverage: API endpoints, database operations, WebSocket

### End-to-End Testing
- Framework: Playwright
- Coverage: Critical user flows

### Performance Testing
- Tools: k6 or Artillery
- Scenarios: Load, stress, spike testing

---

## 13. Competitor Research

### Direct Competitors
1. Procore - Construction PM platform
2. PlanGrid / Autodesk Construction Cloud - Document management
3. MaterialOrder / Buildertrend - Order management

### Indirect Competitors
4. WhatsApp/Phone Calls - Current manual method
5. Email Quotations - Common practice
6. Supplier Websites/Portals - Basic catalogs

### Market Gaps
- No dedicated real-time pricing communication platform
- No multi-supplier aggregation with private pricing
- No offline mobile access to price lists

### Competitive Advantages
1. Real-time updates (WebSocket)
2. Private pricing visibility controls
3. Multi-supplier aggregation
4. Offline mobile support
5. Audit trail and analytics

---

## 14. Development Roadmap

### Phase 1: MVP (Weeks 1-8)
- Week 1-2: Foundation (setup, database, auth)
- Week 3-4: Core Features - Supplier
- Week 5-6: Core Features - Company
- Week 7: Real-time & Polish
- Week 8: Testing & Launch Prep

### Phase 2: Enhancement (Weeks 9-16)
- Week 9-10: Mobile App
- Week 11-12: Advanced Features
- Week 13-14: Integration & Optimization
- Week 15-16: Testing & Launch

### Phase 3: Scale & Expand (Weeks 17+)
- ERP integration
- Advanced analytics
- Quote request workflow
- Order management

---

## 15. 2-Week Execution Checklist

### Week 1: Project Kickoff & Foundation
- ✅ Project setup
- ✅ Database design & setup
- ✅ Backend foundation
- ✅ Core API development

### Week 2: Frontend & Real-time
- ✅ Frontend foundation
- ✅ Supplier dashboard
- ✅ Company dashboard
- ✅ Real-time & integration

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Author**: Product Architecture Team


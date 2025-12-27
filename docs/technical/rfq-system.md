# RFQ System - Technical Documentation 🆕

Complete technical documentation for the RFQ (Request for Quote) system implementation.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Service Layer](#service-layer)
7. [Notification System](#notification-system)
8. [RFQ Routing Logic](#rfq-routing-logic)
9. [Flow Diagrams](#flow-diagrams)
10. [Error Handling](#error-handling)

---

## System Overview

The RFQ system enables companies to create quote requests, suppliers to respond with bids, and companies to manage the entire quote lifecycle including acceptance, rejection, and counter-negotiations.

### Key Components

- **RFQ Creation**: Companies create RFQs (open or targeted)
- **Bid Submission**: Suppliers respond to RFQs with quotes
- **Bid Management**: Companies accept, reject, or counter-negotiate bids
- **Counter-Negotiation**: Both companies and suppliers can submit counter-offers
- **Real-Time Notifications**: WebSocket-based notifications for all actions
- **Bulk Upload**: CSV-based bulk RFQ creation

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│  (Next.js)      │
│                 │
│  - RFQ Forms    │
│  - Bid Management│
│  - Notifications│
└────────┬────────┘
         │
         │ HTTP/REST API
         │ WebSocket
         │
┌────────▼────────┐
│   Backend       │
│  (Express.js)   │
│                 │
│  - Quote Routes │
│  - Quote Service│
│  - WebSocket    │
└────────┬────────┘
         │
         │ Prisma ORM
         │
┌────────▼────────┐
│   Database      │
│  (PostgreSQL)   │
│                 │
│  - QuoteRequests│
│  - QuoteResponses│
│  - Notifications│
└─────────────────┘
```

### Component Structure

```
packages/backend/src/
├── routes/
│   └── quoteRoutes.ts          # RFQ API endpoints
├── services/
│   └── quoteService.ts         # RFQ business logic
├── websocket/
│   └── handlers/
│       └── quoteUpdates.ts     # WebSocket notifications
└── utils/
    └── csvParser.ts            # CSV parsing for bulk upload

packages/frontend/src/
├── app/
│   ├── rfq/[id]/page.tsx       # RFQ details page
│   └── company/quotes/page.tsx # Company quotes dashboard
├── components/
│   ├── QuoteManagement.tsx     # Company RFQ management
│   ├── RFQSection.tsx          # Public RFQ listing
│   ├── NotificationCenter.tsx  # In-app notifications
│   └── QuoteResponseModal.tsx  # Bid submission modal
└── contexts/
    └── WebSocketContext.tsx    # WebSocket connection management
```

---

## Database Schema

### Core Tables

#### QuoteRequest

Stores RFQ information.

```prisma
model QuoteRequest {
  id            String   @id @default(uuid())
  companyId     String
  supplierId    String?  // null = open RFQ, UUID = targeted RFQ
  productId     String?  // null for general RFQs
  status        QuoteStatus @default(PENDING)
  
  // RFQ Details
  message       String   // Contains: "RFQ: [title]\n\n[description]\n\nCategory: [category]"
  quantity      Float?
  unit          String?
  requestedPrice Float?
  currency      String?
  expiresAt     DateTime?
  
  // Metadata
  requestedBy   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  company       Tenant   @relation("CompanyQuoteRequests", fields: [companyId], references: [id])
  supplier      Tenant?  @relation("SupplierQuoteRequests", fields: [supplierId], references: [id])
  product       Product? @relation(fields: [productId], references: [id])
  requestedByUser User   @relation("RequestedQuotes", fields: [requestedBy], references: [id])
  responses     QuoteResponse[]
}
```

#### QuoteResponse

Stores supplier bids and counter-offers.

```prisma
model QuoteResponse {
  id            String   @id @default(uuid())
  quoteRequestId String
  supplierId    String   // Supplier who submitted the bid
  respondedBy   String   // User who submitted (company or supplier)
  
  // Quote Details
  price         Float
  currency      String?
  quantity      Float?
  unit          String?
  validUntil    DateTime?
  message       String?  // Contains comments, acceptance/rejection reasons
  terms         String?
  
  // Status
  isAccepted    Boolean  @default(false)
  isRejected    Boolean  @default(false)
  
  // Metadata
  respondedAt   DateTime @default(now())
  
  // Relations
  quoteRequest  QuoteRequest @relation(fields: [quoteRequestId], references: [id], onDelete: Cascade)
  supplier      Tenant   @relation("SupplierQuoteResponses", fields: [supplierId], references: [id])
  respondedByUser User   @relation("QuoteResponses", fields: [respondedBy], references: [id])
}
```

#### QuoteStatus Enum

```prisma
enum QuoteStatus {
  PENDING      // RFQ created, awaiting responses
  RESPONDED    // At least one response received
  ACCEPTED     // Company accepted a bid
  REJECTED     // Company rejected all bids
  CANCELLED    // RFQ cancelled
}
```

### Data Flow

```
Company Creates RFQ
    │
    ├─→ QuoteRequest record created
    │   - status: PENDING
    │   - supplierId: null (open) or UUID (targeted)
    │   - message: "RFQ: [title]\n\n[description]\n\nCategory: [category]"
    │
    └─→ WebSocket notification sent
        - Open RFQ: Relevant suppliers notified
        - Targeted RFQ: Specific supplier notified

Supplier Submits Bid
    │
    ├─→ QuoteResponse record created
    │   - price, currency, quantity, etc.
    │   - isAccepted: false
    │   - isRejected: false
    │
    ├─→ QuoteRequest.status updated to RESPONDED
    │
    └─→ WebSocket notification sent to company

Company Accepts Bid
    │
    ├─→ QuoteResponse.isAccepted = true
    │   - message updated with acceptance comment (if provided)
    │
    ├─→ Other QuoteResponses.isRejected = true
    │
    ├─→ QuoteRequest.status = ACCEPTED
    │
    └─→ WebSocket notification sent to supplier

Company Rejects Bid
    │
    ├─→ New QuoteResponse created (from company user)
    │   - Contains rejection message/comment
    │
    ├─→ Original QuoteResponse deleted
    │
    └─→ WebSocket notification sent to supplier
```

---

## API Endpoints

### RFQ Management (Company)

#### Create General RFQ

**POST** `/api/v1/quotes/rfq`

Create a new RFQ (open or targeted).

**Authentication**: Required (Company only)

**Request Body:**
```json
{
  "title": "Need 500 bags of Portland Cement",
  "description": "We require high-quality Portland cement Type I for our residential construction project.",
  "category": "Construction Materials",
  "quantity": 500,
  "unit": "bags",
  "requestedPrice": 25000,
  "currency": "USD",
  "expiresAt": "2024-12-31T23:59:59Z",
  "supplierId": "uuid-optional" // null or omit for open RFQ
}
```

**Response:** `201 Created`
```json
{
  "rfq": {
    "id": "uuid",
    "companyId": "uuid",
    "supplierId": null,
    "status": "PENDING",
    "message": "RFQ: Need 500 bags of Portland Cement\n\nWe require high-quality Portland cement...\n\nCategory: Construction Materials",
    "quantity": 500,
    "unit": "bags",
    "requestedPrice": 25000,
    "currency": "USD",
    "expiresAt": "2024-12-31T23:59:59Z",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Get Company RFQs

**GET** `/api/v1/quotes`

Get all RFQs for the authenticated company.

**Query Parameters:**
- `status`: Filter by status (PENDING, RESPONDED, ACCEPTED, REJECTED, CANCELLED)
- `supplierId`: Filter by supplier
- `productId`: Filter by product

**Response:** `200 OK`
```json
{
  "quoteRequests": [
    {
      "id": "uuid",
      "status": "RESPONDED",
      "message": "...",
      "quantity": 500,
      "responses": [
        {
          "id": "uuid",
          "price": 24500,
          "currency": "USD",
          "isAccepted": false
        }
      ],
      "company": { "id": "uuid", "name": "ABC Construction" },
      "supplier": null,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Accept Bid

**POST** `/api/v1/quotes/:id/accept`

Accept a supplier's bid.

**Authentication**: Required (Company only)

**Request Body:**
```json
{
  "quoteResponseId": "uuid",
  "comment": "Accepted. Please proceed with delivery." // Optional
}
```

**Response:** `200 OK`
```json
{
  "quoteResponse": {
    "id": "uuid",
    "isAccepted": true,
    "message": "Accepted. Please proceed with delivery.",
    "price": 24500,
    "currency": "USD"
  }
}
```

#### Reject Bid

**POST** `/api/v1/quotes/:id/reject-response`

Reject a supplier's bid.

**Authentication**: Required (Company only)

**Request Body:**
```json
{
  "quoteResponseId": "uuid",
  "comment": "Price exceeds budget. Unable to proceed." // Optional
}
```

**Response:** `200 OK`

#### Counter-Negotiate Specific Bid

**POST** `/api/v1/quotes/:id/counter`

Submit a counter-offer for a specific bid.

**Authentication**: Required (Company only)

**Request Body:**
```json
{
  "quoteResponseId": "uuid",
  "price": 23500,
  "currency": "USD",
  "quantity": 500,
  "unit": "bags",
  "terms": "Payment terms: 30 days",
  "message": "We can accept this price if you can deliver by end of month."
}
```

**Response:** `201 Created`
```json
{
  "quoteResponse": {
    "id": "uuid",
    "price": 23500,
    "currency": "USD",
    "message": "We can accept this price if you can deliver by end of month."
  }
}
```

#### Counter-Negotiate Entire RFQ

**POST** `/api/v1/quotes/:id/counter-rfq`

Submit a counter-offer for the entire RFQ (not tied to a specific bid).

**Authentication**: Required (Company only)

**Request Body:**
```json
{
  "price": 24000,
  "currency": "USD",
  "quantity": 500,
  "unit": "bags",
  "terms": "Payment terms: Net 30",
  "message": "We've adjusted our requirements. Please review the updated RFQ."
}
```

**Response:** `201 Created`

### RFQ Browsing (Supplier)

#### Get Public RFQs

**GET** `/api/v1/quotes/rfq/public`

Get RFQs relevant to the authenticated supplier (targeted or category-matched open RFQs).

**Query Parameters:**
- `status`: Filter by status
- `category`: Filter by category
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "rfqs": [
    {
      "id": "uuid",
      "status": "PENDING",
      "message": "...",
      "category": "Construction Materials",
      "quantity": 500,
      "unit": "bags",
      "requestedPrice": 25000,
      "currency": "USD",
      "expiresAt": "2024-12-31T23:59:59Z",
      "company": { "id": "uuid", "name": "ABC Construction" },
      "responses": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### Submit Bid

**POST** `/api/v1/quotes/:id/respond`

Submit a bid/response to an RFQ.

**Authentication**: Required (Supplier only)

**Request Body:**
```json
{
  "price": 24500,
  "currency": "USD",
  "quantity": 500,
  "unit": "bags",
  "validUntil": "2024-02-15T23:59:59Z",
  "message": "We can supply this quantity. Delivery within 2 weeks.",
  "terms": "Payment: Net 30 days. Minimum order: 100 bags."
}
```

**Response:** `201 Created`
```json
{
  "quoteResponse": {
    "id": "uuid",
    "price": 24500,
    "currency": "USD",
    "quantity": 500,
    "unit": "bags",
    "validUntil": "2024-02-15T23:59:59Z",
    "message": "We can supply this quantity. Delivery within 2 weeks.",
    "terms": "Payment: Net 30 days. Minimum order: 100 bags.",
    "isAccepted": false,
    "respondedAt": "2024-01-15T11:00:00Z"
  }
}
```

### Bulk Upload

#### Upload RFQs via CSV

**POST** `/api/v1/quotes/rfq/upload-csv`

Upload multiple RFQs via CSV file.

**Authentication**: Required (Company only)

**Request:**
- Content-Type: `multipart/form-data`
- Body: `csvFile` (CSV file, max 5MB)

**Response:** `201 Created`
```json
{
  "success": true,
  "summary": {
    "total": 10,
    "created": 8,
    "failed": 1,
    "invalid": 1
  },
  "created": [
    { "id": "uuid", "title": "RFQ Title 1" },
    { "id": "uuid", "title": "RFQ Title 2" }
  ],
  "failed": [
    {
      "row": 5,
      "title": "RFQ Title",
      "error": "Error message"
    }
  ],
  "invalid": [
    {
      "row": 3,
      "data": { "title": "...", "quantity": "invalid" },
      "errors": ["Quantity must be a valid number"]
    }
  ]
}
```

---

## WebSocket Events

### Connection

Suppliers and companies connect to WebSocket server and join tenant-specific rooms:

- Suppliers: `tenant:{supplierId}`
- Companies: `tenant:{companyId}`
- All Suppliers: `suppliers` (for open RFQ broadcasts)

### Events

#### For Suppliers

**`rfq:created`**
```json
{
  "event": "rfq:created",
  "data": {
    "rfqId": "uuid",
    "title": "Need 500 bags of Portland Cement",
    "category": "Construction Materials",
    "company": {
      "id": "uuid",
      "name": "ABC Construction"
    },
    "link": "/rfq/uuid"
  }
}
```

**`quote:accepted`**
```json
{
  "event": "quote:accepted",
  "data": {
    "rfqId": "uuid",
    "responseId": "uuid",
    "message": "Accepted. Please proceed with delivery.",
    "link": "/rfq/uuid"
  }
}
```

**`quote:rejected`**
```json
{
  "event": "quote:rejected",
  "data": {
    "rfqId": "uuid",
    "responseId": "uuid",
    "message": "Price exceeds budget.",
    "link": "/rfq/uuid"
  }
}
```

**`quote:countered`**
```json
{
  "event": "quote:countered",
  "data": {
    "rfqId": "uuid",
    "responseId": "uuid",
    "price": 23500,
    "currency": "USD",
    "message": "We can accept this price if...",
    "link": "/rfq/uuid"
  }
}
```

#### For Companies

**`quote:responded`**
```json
{
  "event": "quote:responded",
  "data": {
    "rfqId": "uuid",
    "responseId": "uuid",
    "supplier": {
      "id": "uuid",
      "name": "XYZ Suppliers"
    },
    "price": 24500,
    "currency": "USD",
    "link": "/rfq/uuid"
  }
}
```

**`quote:countered`**
```json
{
  "event": "quote:countered",
  "data": {
    "rfqId": "uuid",
    "responseId": "uuid",
    "price": 24000,
    "currency": "USD",
    "message": "Supplier counter-offer...",
    "link": "/rfq/uuid"
  }
}
```

---

## Service Layer

### QuoteService

Main service for RFQ business logic.

#### Key Methods

**`createGeneralRFQ(companyId, userId, input)`**
- Creates a new RFQ
- Stores in database
- Determines relevant suppliers
- Broadcasts notifications via WebSocket
- Returns created RFQ

**`getSupplierRFQs(supplierId, filters)`**
- Gets RFQs relevant to supplier
- Filters: targeted RFQs + category-matched open RFQs
- Returns paginated results

**`respondToQuoteRequest(rfqId, supplierId, userId, input)`**
- Creates QuoteResponse record
- Updates RFQ status to RESPONDED
- Notifies company via WebSocket

**`acceptQuoteResponse(responseId, companyId, comment?)`**
- Marks response as accepted
- Rejects other responses
- Updates RFQ status to ACCEPTED
- Adds comment to message field if provided
- Notifies supplier via WebSocket

**`rejectQuoteResponse(responseId, companyId, comment?)`**
- Creates new QuoteResponse with rejection message
- Deletes original response
- Notifies supplier via WebSocket

**`counterNegotiateQuote(rfqId, responseId, companyId, userId, input)`**
- Creates new QuoteResponse (counter-offer from company)
- Notifies supplier via WebSocket

**`counterNegotiateRFQ(rfqId, companyId, userId, input)`**
- Creates new QuoteResponse for entire RFQ
- Notifies all relevant suppliers via WebSocket

---

## Notification System

### RFQ Routing Logic

#### Finding Relevant Suppliers

When an open RFQ is created:

1. **Category Matching**
   ```
   IF RFQ has category:
     - Find suppliers with products in that category
     - Match by product_categories table
   ELSE:
     - Return empty array (no automatic notifications)
   ```

2. **Supplier Filtering**
   - Only active suppliers (`isActive: true`)
   - Suppliers or service_providers
   - Exclude suppliers with no matching products

#### Notification Broadcasting

**Open RFQ:**
```
For each relevant supplier:
  - Emit to WebSocket room: tenant:{supplierId}
  - Event: rfq:created
  - Include RFQ details and link
```

**Targeted RFQ:**
```
- Emit to WebSocket room: tenant:{supplierId}
- Event: rfq:created
- Include RFQ details and link
```

**Bid Actions:**
```
Company Accepts Bid:
  - Emit to: tenant:{supplierId}
  - Event: quote:accepted
  
Company Rejects Bid:
  - Emit to: tenant:{supplierId}
  - Event: quote:rejected
  
Company Counters Bid:
  - Emit to: tenant:{supplierId}
  - Event: quote:countered
```

---

## Flow Diagrams

### RFQ Creation Flow

```
Company Submits RFQ
    │
    ├─→ Validate Input
    │   - Title (3-200 chars)
    │   - Optional fields
    │
    ├─→ Create QuoteRequest Record
    │   - Set status: PENDING
    │   - Store RFQ details in message field
    │   - Link to company and optional supplier
    │
    ├─→ Determine Notification Targets
    │   ├─→ IF supplierId provided:
    │   │     - Target: [supplierId]
    │   │   ELSE (open RFQ):
    │   │     - IF category provided:
    │   │         - Find suppliers with matching category products
    │   │       ELSE:
    │   │         - No automatic notifications
    │   │
    │   └─→ Filter: Only active suppliers
    │
    └─→ Broadcast Notifications
        - For each target supplier:
          - Emit to WebSocket: tenant:{supplierId}
          - Event: rfq:created
          - Include RFQ details and link
```

### Bid Acceptance Flow

```
Company Accepts Bid
    │
    ├─→ Load QuoteResponse
    │   - Verify belongs to company's RFQ
    │   - Verify status is pending
    │
    ├─→ Update QuoteResponse
    │   - Set isAccepted: true
    │   - Append comment to message (if provided)
    │
    ├─→ Reject Other Responses
    │   - For each other response:
    │     - Create new QuoteResponse with rejection
    │     - Delete original response
    │
    ├─→ Update QuoteRequest
    │   - Set status: ACCEPTED
    │
    └─→ Notify Supplier
        - Emit to WebSocket: tenant:{supplierId}
        - Event: quote:accepted
        - Include acceptance details and link
```

### Counter-Negotiation Flow

```
Company Counter-Negotiates Bid
    │
    ├─→ Validate Counter-Offer Input
    │   - Price, currency, quantity, terms
    │
    ├─→ Create New QuoteResponse
    │   - supplierId: Original supplier
    │   - respondedBy: Company user
    │   - price: Counter-offer price
    │   - message: Counter-offer message
    │   - Mark as company-initiated counter
    │
    └─→ Notify Supplier
        - Emit to WebSocket: tenant:{supplierId}
        - Event: quote:countered
        - Include counter-offer details and link
```

---

## Error Handling

### Common Errors

**400 Bad Request**
- Invalid input validation
- Missing required fields
- Invalid data types

**401 Unauthorized**
- Missing or invalid authentication token

**403 Forbidden**
- Wrong tenant type (e.g., supplier trying to create RFQ)
- Accessing another company's RFQ

**404 Not Found**
- RFQ ID doesn't exist
- QuoteResponse ID doesn't exist

**409 Conflict**
- Bid already accepted/rejected
- RFQ status doesn't allow action

### Error Response Format

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

---

## Security Considerations

1. **Authentication**: All endpoints require authentication
2. **Authorization**: Tenant type checks (company vs supplier)
3. **Data Isolation**: Companies can only access their own RFQs
4. **Input Validation**: All inputs validated and sanitized
5. **Rate Limiting**: Consider implementing for bulk operations
6. **CSV Upload Limits**: 5MB file size limit, validation on each row

---

**Last Updated**: 2024-12-31  
**Version**: 1.0

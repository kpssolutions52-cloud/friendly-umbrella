# Quote Workflow Management - Complete Architecture

## 🎯 Complete Quote-to-Order-to-Delivery Workflow

**End-to-end workflow management for QS professionals** - from quote request to delivery and certificate management.

---

## 📋 Standard QS Quotation Flow

### Industry Standard Process

1. **Quote Request** - QS requests quotes from multiple suppliers
2. **Supplier Response** - Suppliers submit quotes
3. **Quote Comparison** - QS compares quotes
4. **Negotiation** - QS negotiates with suppliers
5. **Approval** - QS approves best quote
6. **Order Placement** - QS places order with supplier
7. **Order Confirmation** - Supplier confirms order
8. **Production/Preparation** - Supplier prepares materials
9. **Delivery Tracking** - Track delivery status
10. **Delivery** - Materials delivered to site
11. **Quality Check** - QS inspects materials
12. **Certificate Submission** - Supplier submits certificates
13. **Certificate Review** - QS reviews certificates
14. **Payment Processing** - Process payment
15. **Project Completion** - Close out project

---

## 🏗️ QS AI Agent Workflow System

### Complete Workflow Stages

```
┌─────────────────────────────────────────────────────────────┐
│              Quote Workflow Lifecycle                       │
└─────────────────────────────────────────────────────────────┘

1. Quote Request
   ├── QS: "Request quotes for Office Building project"
   ├── AI Agent: Identifies materials needed
   ├── AI Agent: Sends requests to multiple suppliers
   └── Suppliers: Receive notification

2. Quote Submission
   ├── Suppliers: Submit quotes via portal
   ├── AI Agent: Collects all quotes
   └── QS: Views all quotes in one place

3. Quote Comparison
   ├── AI Agent: Compares prices automatically
   ├── AI Agent: Highlights best options
   └── QS: Reviews recommendations

4. Negotiation
   ├── QS: "Can Supplier A match Supplier B's price?"
   ├── AI Agent: Sends negotiation request
   └── Supplier: Responds with new quote

5. Approval
   ├── QS: "Approve quote from Supplier A"
   ├── AI Agent: Marks quote as approved
   └── Supplier: Receives approval notification

6. Order Placement
   ├── QS: "Place order for approved quote"
   ├── AI Agent: Creates purchase order
   └── Supplier: Receives order

7. Order Confirmation
   ├── Supplier: Confirms order
   ├── AI Agent: Updates order status
   └── QS: Sees confirmed order

8. Production/Preparation
   ├── Supplier: Updates status "In Production"
   ├── AI Agent: Tracks progress
   └── QS: Monitors timeline

9. Delivery Tracking
   ├── Supplier: Updates "Ready for Delivery"
   ├── Supplier: Provides delivery date
   └── QS: Tracks delivery schedule

10. Delivery
    ├── Supplier: Marks "Delivered"
    ├── QS: Confirms receipt
    └── AI Agent: Updates project status

11. Quality Check
    ├── QS: Inspects materials
    ├── QS: "Materials received, quality OK"
    └── AI Agent: Records inspection

12. Certificate Management
    ├── QS: "Request certificates for this order"
    ├── AI Agent: Sends request to supplier
    ├── Supplier: Uploads certificates
    └── QS: Reviews certificates

13. Payment Processing
    ├── QS: "Approve payment for this order"
    ├── AI Agent: Generates payment request
    └── Finance: Processes payment

14. Project Completion
    ├── QS: "Mark order as complete"
    ├── AI Agent: Closes order
    └── Project: Updated status
```

---

## 🗄️ Database Schema for Workflow

### Enhanced Schema

```prisma
// Quote Request (QS requests quotes from suppliers)
model QuoteRequest {
  id          String   @id @default(uuid())
  projectId   String   @map("project_id")
  createdById String   @map("created_by_id")
  title       String
  description String?
  status      QuoteRequestStatus @default(pending)
  deadline    DateTime?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  project   Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator   User           @relation("QuoteRequestCreator", fields: [createdById], references: [id], onDelete: Cascade)
  items     QuoteRequestItem[]
  responses QuoteResponse[]
}

enum QuoteRequestStatus {
  pending      // Waiting for supplier responses
  in_progress  // Some suppliers responded
  completed    // All suppliers responded
  cancelled    // Cancelled by QS
}

// Quote Request Items (Materials needed)
model QuoteRequestItem {
  id             String   @id @default(uuid())
  quoteRequestId String   @map("quote_request_id")
  name           String
  description    String?
  quantity       Decimal  @db.Decimal(10, 2)
  unit           String
  specifications String?  // Technical specs
  createdAt      DateTime @default(now()) @map("created_at")

  quoteRequest QuoteRequest @relation(fields: [quoteRequestId], references: [id], onDelete: Cascade)
}

// Quote Response (Supplier submits quote)
model QuoteResponse {
  id             String   @id @default(uuid())
  quoteRequestId String   @map("quote_request_id")
  supplierId     String   @map("supplier_id")
  totalAmount    Decimal  @db.Decimal(12, 2)
  validUntil     DateTime? @map("valid_until")
  notes          String?
  status         QuoteResponseStatus @default(submitted)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  quoteRequest QuoteRequest @relation(fields: [quoteRequestId], references: [id], onDelete: Cascade)
  supplier     Organization @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  items        QuoteResponseItem[]
  negotiations Negotiation[]
  order        Order?
}

enum QuoteResponseStatus {
  submitted      // Initial submission
  under_review   // QS reviewing
  approved       // QS approved
  rejected       // QS rejected
  negotiating    // In negotiation
  expired        // Quote expired
}

// Quote Response Items (Supplier's pricing)
model QuoteResponseItem {
  id              String   @id @default(uuid())
  quoteResponseId String   @map("quote_response_id")
  quoteRequestItemId String? @map("quote_request_item_id")
  productId       String?  @map("product_id")
  name            String
  quantity        Decimal  @db.Decimal(10, 2)
  unit            String
  price           Decimal  @db.Decimal(12, 2)
  total           Decimal  @db.Decimal(12, 2)
  notes           String?
  createdAt       DateTime @default(now()) @map("created_at")

  quoteResponse QuoteResponse @relation(fields: [quoteResponseId], references: [id], onDelete: Cascade)
  product       Product?      @relation(fields: [productId], references: [id], onDelete: SetNull)
}

// Negotiation (QS negotiates with supplier)
model Negotiation {
  id              String   @id @default(uuid())
  quoteResponseId String   @map("quote_response_id")
  initiatedBy     String   @map("initiated_by") // qs | supplier
  message         String
  proposedAmount  Decimal? @db.Decimal(12, 2)
  status          NegotiationStatus @default(open)
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  quoteResponse QuoteResponse @relation(fields: [quoteResponseId], references: [id], onDelete: Cascade)
}

enum NegotiationStatus {
  open
  accepted
  rejected
  counter_offered
}

// Order (After quote approval)
model Order {
  id              String   @id @default(uuid())
  quoteResponseId String   @unique @map("quote_response_id")
  projectId       String   @map("project_id")
  supplierId      String   @map("supplier_id")
  orderNumber     String   @unique
  totalAmount     Decimal  @db.Decimal(12, 2)
  status          OrderStatus @default(pending)
  orderDate       DateTime @default(now()) @map("order_date")
  expectedDeliveryDate DateTime? @map("expected_delivery_date")
  actualDeliveryDate DateTime? @map("actual_delivery_date")
  deliveryAddress String? @map("delivery_address")
  notes           String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  quoteResponse QuoteResponse @relation(fields: [quoteResponseId], references: [id], onDelete: Cascade)
  project       Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  supplier      Organization  @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  items         OrderItem[]
  deliveries    Delivery[]
  certificates  Certificate[]
  payments      Payment[]
}

enum OrderStatus {
  pending           // Order placed, waiting confirmation
  confirmed         // Supplier confirmed
  in_production     // Materials being prepared
  ready_for_delivery // Ready to ship
  in_transit        // On the way
  delivered         // Delivered to site
  quality_check     // QS inspecting
  quality_approved  // Quality approved
  quality_rejected  // Quality issues
  completed         // Order complete
  cancelled         // Order cancelled
}

// Order Items
model OrderItem {
  id              String   @id @default(uuid())
  orderId         String   @map("order_id")
  productId       String?  @map("product_id")
  name            String
  quantity        Decimal  @db.Decimal(10, 2)
  unit            String
  price           Decimal  @db.Decimal(12, 2)
  total           Decimal  @db.Decimal(12, 2)
  createdAt       DateTime @default(now()) @map("created_at")

  order   Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
}

// Delivery Tracking
model Delivery {
  id          String   @id @default(uuid())
  orderId     String   @map("order_id")
  status      DeliveryStatus @default(scheduled)
  trackingNumber String? @map("tracking_number")
  carrier     String?
  estimatedDate DateTime? @map("estimated_date")
  actualDate  DateTime? @map("actual_date")
  deliveryNotes String? @map("delivery_notes")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

enum DeliveryStatus {
  scheduled
  in_transit
  out_for_delivery
  delivered
  delayed
  failed
}

// Quality Inspection
model QualityInspection {
  id          String   @id @default(uuid())
  orderId     String   @unique @map("order_id")
  inspectedBy String   @map("inspected_by")
  status      QualityStatus @default(pending)
  notes       String?
  inspectionDate DateTime? @map("inspection_date")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

enum QualityStatus {
  pending
  passed
  failed
  conditional
}

// Certificates
model Certificate {
  id          String   @id @default(uuid())
  orderId     String   @map("order_id")
  type        CertificateType
  title       String
  fileUrl     String?  @map("file_url")
  issuedBy    String?  @map("issued_by")
  issueDate   DateTime? @map("issue_date")
  expiryDate  DateTime? @map("expiry_date")
  status      CertificateStatus @default(requested)
  uploadedBy  String?  @map("uploaded_by") // supplier | qs
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

enum CertificateType {
  material_certificate
  test_certificate
  quality_certificate
  compliance_certificate
  warranty_certificate
}

enum CertificateStatus {
  requested      // QS requested certificate
  submitted      // Supplier submitted
  under_review   // QS reviewing
  approved       // QS approved
  rejected       // QS rejected (needs resubmission)
}

// Payment
model Payment {
  id          String   @id @default(uuid())
  orderId     String   @map("order_id")
  amount      Decimal  @db.Decimal(12, 2)
  status      PaymentStatus @default(pending)
  paymentDate DateTime? @map("payment_date")
  paymentMethod String? @map("payment_method")
  reference   String?
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

enum PaymentStatus {
  pending
  approved
  processed
  completed
  failed
  cancelled
}
```

---

## 🔄 Complete Workflow Implementation

### Stage 1: Quote Request

**QS Action:**
```
QS: "Request quotes for Office Building project"
```

**AI Agent Process:**
```typescript
1. Identifies project materials
2. Creates QuoteRequest
3. Identifies relevant suppliers
4. Sends notifications to suppliers
5. Creates QuoteRequestItems for each material
```

**Database:**
```sql
INSERT INTO quote_requests (project_id, created_by_id, title, status)
INSERT INTO quote_request_items (quote_request_id, name, quantity, unit)
```

### Stage 2: Supplier Response

**Supplier Action:**
```
Supplier: Submits quote via portal
```

**AI Agent Process:**
```typescript
1. Supplier fills quote form
2. System creates QuoteResponse
3. System creates QuoteResponseItems
4. QS receives notification
5. AI Agent updates quote request status
```

**Database:**
```sql
INSERT INTO quote_responses (quote_request_id, supplier_id, total_amount, status)
INSERT INTO quote_response_items (quote_response_id, name, quantity, price, total)
```

### Stage 3: Quote Comparison

**QS Action:**
```
QS: "Show me all quotes for Office Building"
```

**AI Agent Process:**
```typescript
1. Retrieves all quote responses
2. Compares prices automatically
3. Highlights best options
4. Shows recommendations
```

**Response:**
```json
{
  "quotes": [
    {
      "supplier": "ABC Supplies",
      "total": 15000,
      "items": [...],
      "recommendation": "Best overall price"
    },
    {
      "supplier": "XYZ Materials",
      "total": 15200,
      "items": [...],
      "recommendation": "Fastest delivery"
    }
  ],
  "bestOption": "ABC Supplies",
  "savings": 200
}
```

### Stage 4: Negotiation

**QS Action:**
```
QS: "Can ABC Supplies match XYZ's price for cement?"
```

**AI Agent Process:**
```typescript
1. Creates Negotiation record
2. Sends message to supplier
3. Supplier responds with counter-offer
4. QS reviews and accepts/rejects
```

**Database:**
```sql
INSERT INTO negotiations (quote_response_id, initiated_by, message, proposed_amount)
```

### Stage 5: Approval

**QS Action:**
```
QS: "Approve quote from ABC Supplies"
```

**AI Agent Process:**
```typescript
1. Updates QuoteResponse status to 'approved'
2. Notifies supplier
3. Marks other quotes as 'rejected'
4. Prepares for order placement
```

### Stage 6: Order Placement

**QS Action:**
```
QS: "Place order for approved quote"
```

**AI Agent Process:**
```typescript
1. Creates Order from approved quote
2. Generates order number
3. Sends order to supplier
4. Updates order status to 'pending'
```

**Database:**
```sql
INSERT INTO orders (quote_response_id, project_id, supplier_id, order_number, total_amount, status)
INSERT INTO order_items (order_id, name, quantity, price, total)
```

### Stage 7: Order Confirmation

**Supplier Action:**
```
Supplier: Confirms order via portal
```

**AI Agent Process:**
```typescript
1. Supplier confirms order
2. Updates order status to 'confirmed'
3. Sets expected delivery date
4. Notifies QS
```

### Stage 8: Production/Preparation

**Supplier Action:**
```
Supplier: Updates order status "In Production"
```

**AI Agent Process:**
```typescript
1. Updates order status
2. Tracks timeline
3. Notifies QS of progress
```

### Stage 9: Delivery Tracking

**Supplier Action:**
```
Supplier: "Order ready for delivery, ETA: Jan 20"
```

**AI Agent Process:**
```typescript
1. Creates Delivery record
2. Updates order status to 'ready_for_delivery'
3. Tracks delivery timeline
4. Notifies QS
```

**Database:**
```sql
INSERT INTO deliveries (order_id, status, estimated_date, tracking_number)
```

### Stage 10: Delivery

**Supplier Action:**
```
Supplier: "Order delivered to site"
```

**AI Agent Process:**
```typescript
1. Updates delivery status to 'delivered'
2. Updates order status to 'delivered'
3. Records actual delivery date
4. Notifies QS
```

### Stage 11: Quality Check

**QS Action:**
```
QS: "Materials received, quality check passed"
```

**AI Agent Process:**
```typescript
1. Creates QualityInspection record
2. Updates order status to 'quality_approved'
3. Records inspection notes
4. Proceeds to certificate request
```

**Database:**
```sql
INSERT INTO quality_inspections (order_id, inspected_by, status, notes)
```

### Stage 12: Certificate Management

**QS Action:**
```
QS: "Request material certificates for this order"
```

**AI Agent Process:**
```typescript
1. Creates Certificate records (requested)
2. Sends request to supplier
3. Supplier uploads certificates
4. QS reviews and approves
```

**Database:**
```sql
INSERT INTO certificates (order_id, type, status, title)
-- Supplier uploads:
UPDATE certificates SET file_url = ..., status = 'submitted'
-- QS approves:
UPDATE certificates SET status = 'approved'
```

### Stage 13: Payment Processing

**QS Action:**
```
QS: "Approve payment for this order"
```

**AI Agent Process:**
```typescript
1. Creates Payment record
2. Generates payment request
3. Finance processes payment
4. Updates payment status
```

**Database:**
```sql
INSERT INTO payments (order_id, amount, status)
UPDATE payments SET status = 'processed', payment_date = ...
```

### Stage 14: Project Completion

**QS Action:**
```
QS: "Mark order as complete"
```

**AI Agent Process:**
```typescript
1. Updates order status to 'completed'
2. Closes order
3. Updates project status
4. Archives order data
```

---

## 💬 AI Agent Natural Language Commands

### Quote Request
```
QS: "Request quotes for Office Building project"
QS: "Get quotes from all suppliers for 100 bags cement"
QS: "Send quote request for warehouse project materials"
```

### Quote Management
```
QS: "Show me all quotes for Office Building"
QS: "Compare quotes for this project"
QS: "Which supplier has the best price?"
```

### Negotiation
```
QS: "Can ABC Supplies match XYZ's price?"
QS: "Negotiate better price with Supplier A"
QS: "Ask Supplier B to reduce price by 5%"
```

### Approval
```
QS: "Approve quote from ABC Supplies"
QS: "Accept the best quote"
QS: "Reject quote from XYZ Materials"
```

### Order Management
```
QS: "Place order for approved quote"
QS: "Show me order status"
QS: "When will my order be delivered?"
```

### Delivery Tracking
```
QS: "Track delivery for order #12345"
QS: "What's the delivery status?"
QS: "Update delivery date"
```

### Quality & Certificates
```
QS: "Materials received, quality check passed"
QS: "Request certificates for this order"
QS: "Show me certificates for Office Building"
```

### Payment
```
QS: "Approve payment for order #12345"
QS: "Show payment status"
QS: "Mark payment as processed"
```

---

## 🎯 Workflow Status Tracking

### Quote Request Status Flow
```
pending → in_progress → completed
                    ↓
                cancelled
```

### Quote Response Status Flow
```
submitted → under_review → approved
                        ↓
                    rejected
                        ↓
                  negotiating → approved
```

### Order Status Flow
```
pending → confirmed → in_production → ready_for_delivery 
    → in_transit → delivered → quality_check 
    → quality_approved → completed
```

### Certificate Status Flow
```
requested → submitted → under_review → approved
                                    ↓
                                rejected → submitted
```

---

## 📊 Workflow Dashboard

### QS Dashboard View

```
Project: Office Building
├── Quote Requests
│   ├── Request #1 (Jan 15) - 3 suppliers responded
│   └── Request #2 (Jan 20) - Pending
│
├── Active Orders
│   ├── Order #12345 - In Production (ETA: Jan 25)
│   ├── Order #12346 - In Transit (ETA: Jan 22)
│   └── Order #12347 - Delivered (Quality Check Pending)
│
├── Pending Actions
│   ├── Review certificates (2 orders)
│   ├── Approve payment (1 order)
│   └── Quality inspection (1 order)
│
└── Completed Orders
    └── Order #12340 - Completed (All certificates received)
```

---

## 🔔 Notifications & Alerts

### QS Notifications
- New quote responses received
- Order status updates
- Delivery notifications
- Certificate submissions
- Payment reminders

### Supplier Notifications
- New quote requests
- Quote approvals/rejections
- Order confirmations
- Certificate requests
- Payment received

---

## ✅ Complete Workflow Summary

**The QS AI Agent manages:**
1. ✅ Quote requests to multiple suppliers
2. ✅ Quote collection and comparison
3. ✅ Negotiation with suppliers
4. ✅ Quote approval/rejection
5. ✅ Order placement
6. ✅ Order confirmation
7. ✅ Production tracking
8. ✅ Delivery tracking
9. ✅ Quality inspection
10. ✅ Certificate management
11. ✅ Payment processing
12. ✅ Project completion

**All through natural language conversation!**

# RFQ Notification and Routing System

## Overview

This document explains how RFQs (Request for Quote) are routed to suppliers and how suppliers get notified about new RFQs.

## RFQ Submission Flow

### 1. Company Submits RFQ

When a company submits an RFQ, they can choose:
- **Targeted RFQ**: Select a specific supplier
- **Open RFQ**: Leave supplier selection empty (open to all suppliers)

### 2. RFQ Routing Logic

The system determines which suppliers should see the RFQ:

#### Targeted RFQs
- **Direct Assignment**: RFQ is assigned to the selected supplier
- **Notification**: Only the selected supplier receives notification

#### Open RFQs
- **Category-Based Matching**: 
  - System finds suppliers who have products in the RFQ's category
  - If category matches supplier's product categories, they are notified
- **Fallback**: If no category match or no category specified, all active suppliers are notified

### 3. Supplier Notification Methods

#### Real-Time WebSocket Notifications
- Suppliers receive instant notifications when:
  - A new RFQ is created (targeted to them or open)
  - RFQ status changes (accepted, rejected, etc.)
  - Company responds to their quote

#### Notification Events
- `rfq:created` - New RFQ available
- `quote:updated` - RFQ status changed
- `quote:responded` - Supplier submitted a response

## Database Structure

### RFQ Storage
- **General RFQs** are stored in `quote_requests` table
- Message field format: `RFQ: [Title]\n\n[Description]\n\nCategory: [Category]`
- Uses placeholder product for general RFQs (not product-specific)

### Supplier Matching
- System queries suppliers based on:
  - Product categories they offer
  - Active status
  - Tenant type (supplier or service_provider)

## API Endpoints

### For Companies
- `POST /api/v1/quotes/rfq` - Submit new RFQ
- `GET /api/v1/quotes` - View their RFQs and status
- `POST /api/v1/quotes/:id/accept` - Accept a quote response
- `POST /api/v1/quotes/:id/reject` - Reject a quote response

### For Suppliers
- `GET /api/v1/quotes/rfq/public` - View relevant RFQs (automatically filtered)
  - Shows RFQs targeted to them
  - Shows open RFQs (all suppliers can see)
- `POST /api/v1/quotes/:id/respond` - Submit quote response

## WebSocket Rooms

### Supplier Rooms
- `tenant:{supplierId}` - Supplier-specific room for targeted notifications
- `suppliers` - All suppliers room for open RFQ broadcasts

### Company Rooms
- `tenant:{companyId}` - Company-specific room for RFQ updates

## RFQ Visibility Rules

### Suppliers See:
1. **RFQs Targeted to Them**
   - RFQs where `supplier_id` matches their tenant ID
   - Direct notifications via WebSocket

2. **Open RFQs**
   - RFQs with placeholder supplier (open to all)
   - Category-matched RFQs (if supplier has products in that category)
   - All open RFQs if no category filter

### Companies See:
- All RFQs they submitted
- Status of each RFQ (pending, responded, accepted, rejected)
- All responses from suppliers

## Notification Flow Diagram

```
Company Submits RFQ
        │
        ├─→ Targeted to Specific Supplier?
        │   │
        │   ├─→ YES: Notify only that supplier
        │   │   └─→ WebSocket: tenant:{supplierId}
        │   │
        │   └─→ NO: Open RFQ
        │       │
        │       ├─→ Find suppliers with matching category
        │       │   └─→ WebSocket: suppliers room (broadcast)
        │       │
        │       └─→ If no category: Notify all suppliers
        │           └─→ WebSocket: suppliers room (broadcast)
        │
        └─→ Store RFQ in database
            └─→ Status: pending
```

## Future Enhancements

### Planned Features:
1. **Location-Based Matching**
   - Match RFQs to suppliers based on geographic proximity
   - Use company and supplier addresses

2. **Notification Preferences**
   - Allow suppliers to set preferences:
     - Categories they want to receive RFQs for
     - Minimum budget threshold
     - Location radius

3. **Email Notifications**
   - Send email alerts for new RFQs
   - Daily/weekly RFQ digest

4. **Smart Matching Algorithm**
   - ML-based matching using:
     - Historical quote acceptance rates
     - Supplier performance metrics
     - Product similarity

5. **RFQ Expiry Notifications**
   - Remind suppliers of expiring RFQs
   - Notify companies when RFQ expires

## Implementation Details

### WebSocket Handler
- File: `packages/backend/src/websocket/handlers/quoteUpdates.ts`
- Functions:
  - `broadcastRFQCreated()` - Notify suppliers of new RFQ
  - `findRelevantSuppliersForRFQ()` - Find matching suppliers
  - `broadcastQuoteUpdate()` - Notify status changes

### Service Methods
- File: `packages/backend/src/services/quoteService.ts`
- Methods:
  - `createGeneralRFQ()` - Create RFQ and notify suppliers
  - `getSupplierRFQs()` - Get RFQs relevant to a supplier
  - `getPublicRFQs()` - Get all public RFQs

## Testing

### Test Scenarios:
1. **Targeted RFQ**: Verify only selected supplier receives notification
2. **Open RFQ with Category**: Verify suppliers with matching products are notified
3. **Open RFQ without Category**: Verify all suppliers are notified
4. **Supplier Dashboard**: Verify suppliers see relevant RFQs
5. **WebSocket Connection**: Verify real-time notifications work




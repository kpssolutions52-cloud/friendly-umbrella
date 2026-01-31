# Dual AI Interface - QS & Supplier Natural Language

## 🎯 Complete AI-First System

**Both QS professionals and Suppliers interact with the system using natural language** - like ChatGPT, but for construction pricing and management.

---

## 💬 Dual AI Interface Architecture

### For QS Professionals

**AI Chat Interface:**
- Ask questions about prices
- Request quotes
- Manage projects
- Track orders
- Request certificates
- All via natural language

**UI Interface:**
- Project management dashboard
- Quote comparison views
- Order tracking
- Certificate management

### For Suppliers

**AI Chat Interface:**
- Update prices naturally
- Set company-specific prices
- Check inventory
- View quote requests
- Manage orders
- All via natural language

**UI Interface:**
- Product/inventory management
- Quote response forms
- Order management
- Certificate upload

---

## 🎨 Supplier AI Chat Interface

### Natural Language Price Updates

**Supplier can say:**
```
Supplier: "Update price of cement to $50 per bag"
Supplier: "Set cement price for Company A to $45 per bag"
Supplier: "Change steel price to $200 for all companies"
Supplier: "Update sand price for Company B to $2 per kg, valid until end of month"
```

**AI Agent Process:**
1. Understands the request
2. Identifies product (cement)
3. Identifies target (all companies or specific company)
4. Updates price in database
5. Invalidates cache
6. Confirms update

**Response:**
```
AI Agent: "✅ Updated cement price to $50/bag for all companies.
          Company A will see $45/bag (their special price).
          Changes are live now!"
```

---

## 🔄 Complete Interaction Examples

### Supplier Natural Language Commands

#### Price Management
```
Supplier: "What's my current price for cement?"
AI Agent: "Your current cement price is $50/bag for all companies.
          Company A has special price: $45/bag"

Supplier: "Update cement price to $48 for everyone"
AI Agent: "✅ Updated cement base price to $48/bag.
          All companies will see this price.
          Company A still has their special price: $45/bag"

Supplier: "Set special price for Company B: cement $46 per bag"
AI Agent: "✅ Set special price for Company B:
          Cement: $46/bag (valid until no expiration)
          Company B will see this price immediately"

Supplier: "Remove special price for Company A for cement"
AI Agent: "✅ Removed special price for Company A.
          They will now see base price: $48/bag"
```

#### Inventory Management
```
Supplier: "Show me my inventory"
AI Agent: "📦 Your Inventory:
          - Cement: 500 bags in stock
          - Steel: 200 units in stock
          - Sand: 1000 kg in stock"

Supplier: "What products do I have?"
AI Agent: "You have 15 products:
          1. Cement - $48/bag
          2. Steel - $200/unit
          3. Sand - $2/kg
          ..."

Supplier: "Add new product: bricks, $1 per piece"
AI Agent: "✅ Added new product:
          Name: Bricks
          Price: $1/piece
          Available to all QS professionals immediately"
```

#### Quote Management
```
Supplier: "Show me pending quote requests"
AI Agent: "📋 You have 3 pending quote requests:
          1. Office Building project - Due: Jan 25
          2. Warehouse project - Due: Jan 30
          3. Residential project - Due: Feb 1"

Supplier: "Submit quote for Office Building: cement $45, steel $195"
AI Agent: "✅ Quote submitted for Office Building:
          Total: $14,500
          QS will be notified immediately"
```

#### Order Management
```
Supplier: "Show me active orders"
AI Agent: "📦 Active Orders:
          1. Order #12345 - In Production (ETA: Jan 25)
          2. Order #12346 - Ready for Delivery
          3. Order #12347 - Confirmed"

Supplier: "Update order #12345 status to ready for delivery"
AI Agent: "✅ Updated order #12345 to 'Ready for Delivery'
          QS has been notified"
```

#### Certificate Management
```
Supplier: "Show me certificate requests"
AI Agent: "📄 Certificate Requests:
          1. Order #12345 - Material Certificate (requested)
          2. Order #12346 - Test Certificate (requested)"

Supplier: "Upload certificate for order #12345"
AI Agent: "Please provide the certificate file and details..."
```

---

## 🎯 QS AI Chat Interface (Enhanced)

### Project & Quote Management
```
QS: "Request quotes for Office Building from all suppliers"
QS: "Compare quotes for this project"
QS: "Approve quote from ABC Supplies"
QS: "Place order for approved quote"
```

### Price Queries
```
QS: "What's the price of cement?"
AI Agent: "Current cement prices:
          - ABC Supplies: $48/bag (base price)
          - XYZ Materials: $50/bag
          - Your company special: $45/bag from ABC Supplies ⭐"

QS: "Show me best prices for all materials I need"
AI Agent: "Best prices for your project:
          - Cement: $45/bag (ABC Supplies - your special price)
          - Steel: $195/unit (XYZ Materials)
          - Sand: $2/kg (ABC Supplies)"
```

### Order Tracking
```
QS: "What's the status of my orders?"
QS: "Track delivery for order #12345"
QS: "When will my order be delivered?"
```

---

## 🏗️ System Architecture

### Dual Interface System

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐              ┌──────────────────┐  │
│  │  QS Interface    │              │ Supplier Interface│  │
│  │                  │              │                  │  │
│  │  ┌────────────┐  │              │  ┌────────────┐  │  │
│  │  │ AI Chat    │  │              │  │ AI Chat    │  │  │
│  │  │ (Natural   │  │              │  │ (Natural   │  │  │
│  │  │ Language)  │  │              │  │ Language)  │  │  │
│  │  └────────────┘  │              │  └────────────┘  │  │
│  │                  │              │                  │  │
│  │  ┌────────────┐  │              │  ┌────────────┐  │  │
│  │  │ Dashboard  │  │              │  │ Inventory  │  │  │
│  │  │ (Projects) │  │              │  │ Management │  │  │
│  │  └────────────┘  │              │  └────────────┘  │  │
│  └──────────────────┘              └──────────────────┘  │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Core                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  User Type Detection                                    │ │
│  │  - QS: Project management, quotes, orders             │ │
│  │  - Supplier: Price updates, inventory, orders         │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Intent Recognition                                     │ │
│  │  - QS: price_query, quote_request, order_track        │ │
│  │  - Supplier: price_update, inventory_check, order_mgmt│ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Action Execution                                       │ │
│  │  - QS: Query data, create requests, track orders       │ │
│  │  - Supplier: Update prices, check inventory, manage   │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  - Products, Prices, Orders, Certificates                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Supplier AI Chat Examples

### Example 1: Update Base Price

```
Supplier: "Update cement price to $48 per bag"

AI Agent Processing:
1. Intent: price_update
2. Product: cement
3. Target: all companies (base price)
4. Price: $48
5. Unit: bag

Action:
- Updates Product.price = $48
- Invalidates cache
- Creates PriceHistory record

Response:
"✅ Updated cement base price to $48/bag.
 All companies will see this price.
 Previous price: $50/bag"
```

### Example 2: Set Company-Specific Price

```
Supplier: "Set cement price for Company A to $45 per bag"

AI Agent Processing:
1. Intent: company_price_update
2. Product: cement
3. Target: Company A
4. Price: $45
5. Unit: bag

Action:
- Creates/updates CompanyPrice record
- productId: cement-id
- companyId: company-a-id
- price: $45

Response:
"✅ Set special price for Company A:
 Cement: $45/bag
 Company A will see this price immediately.
 Other companies see base price: $48/bag"
```

### Example 3: Bulk Price Update

```
Supplier: "Update all my product prices: cement $48, steel $200, sand $2"

AI Agent Processing:
1. Intent: bulk_price_update
2. Products: [cement, steel, sand]
3. Prices: [$48, $200, $2]

Action:
- Updates multiple Product records
- Invalidates all caches
- Creates PriceHistory for each

Response:
"✅ Updated prices:
 - Cement: $48/bag
 - Steel: $200/unit
 - Sand: $2/kg
 All changes are live now!"
```

### Example 4: Check Inventory

```
Supplier: "What products do I have and what are their prices?"

AI Agent Processing:
1. Intent: inventory_query
2. Gets all products for supplier
3. Gets current prices
4. Gets company-specific prices

Response:
"📦 Your Products & Prices:

1. Cement
   - Base Price: $48/bag
   - Company A: $45/bag (special)
   - Company B: $46/bag (special)

2. Steel
   - Base Price: $200/unit
   - No special prices

3. Sand
   - Base Price: $2/kg
   - Company A: $1.80/kg (special)"
```

---

## 🔄 Complete Price Update Flow

### Supplier Updates Price via AI Chat

```
Supplier: "Update cement price for Company A to $45"
    │
    ▼
AI Agent: Understands request
    │
    ▼
AI Agent: Identifies:
    - Product: cement
    - Company: Company A
    - Price: $45
    │
    ▼
AI Agent: Updates CompanyPrice
    │
    ▼
Database: CompanyPrice record created/updated
    │
    ▼
Cache: Invalidated for cement + Company A
    │
    ▼
AI Agent: Confirms update
    │
    ▼
Supplier: Sees confirmation
    │
    ▼
Next QS Query: "What's the price of cement?"
    │
    ▼
AI Agent: Returns $45/bag (Company A's special price)
```

---

## 🎯 Dual Interface Benefits

### For Suppliers

**AI Chat:**
- ✅ Natural language price updates
- ✅ Quick inventory checks
- ✅ Order status queries
- ✅ Certificate management

**UI Dashboard:**
- ✅ Bulk product management
- ✅ Detailed inventory views
- ✅ Quote response forms
- ✅ Order management tables
- ✅ Certificate upload interface

### For QS Professionals

**AI Chat:**
- ✅ Natural language queries
- ✅ Quote requests
- ✅ Order tracking
- ✅ Project management

**UI Dashboard:**
- ✅ Project views
- ✅ Quote comparison tables
- ✅ Order tracking dashboard
- ✅ Certificate management

---

## 💬 Natural Language Patterns

### Supplier Price Update Patterns

**Base Price Updates:**
```
"Update [product] price to [amount]"
"Change [product] to [amount] per [unit]"
"Set [product] price to [amount]"
```

**Company-Specific Prices:**
```
"Set [product] price for [company] to [amount]"
"Update [product] for [company] to [amount]"
"Give [company] special price: [product] [amount]"
```

**Bulk Updates:**
```
"Update all prices: [product1] [price1], [product2] [price2]"
"Change prices: [list]"
```

### QS Query Patterns

**Price Queries:**
```
"What's the price of [product]?"
"How much does [product] cost?"
"Show me prices for [products]"
```

**Quote Management:**
```
"Request quotes for [project]"
"Compare quotes"
"Approve quote from [supplier]"
```

**Order Tracking:**
```
"Track order #[number]"
"What's the delivery status?"
"Show me active orders"
```

---

## 🏗️ Implementation Architecture

### AI Agent with User Type Detection

```typescript
// AI Service detects user type and routes accordingly
export async function processUserQuery(
  userId: string,
  query: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true }
  });
  
  if (user.type === 'qs') {
    return await processQSQuery(userId, query);
  } else if (user.type === 'supplier') {
    return await processSupplierQuery(userId, query);
  }
}

// Supplier-specific processing
async function processSupplierQuery(
  userId: string,
  query: string
) {
  const intent = await detectIntent(query);
  
  switch (intent) {
    case 'price_update':
      return await handlePriceUpdate(userId, query);
    case 'inventory_query':
      return await handleInventoryQuery(userId, query);
    case 'order_management':
      return await handleOrderManagement(userId, query);
    // ...
  }
}
```

### Price Update Handler

```typescript
async function handlePriceUpdate(
  supplierId: string,
  query: string
) {
  // Extract: product, company (optional), price
  const { product, company, price, unit } = await extractPriceUpdate(query);
  
  if (company) {
    // Company-specific price
    await prisma.companyPrice.upsert({
      where: {
        productId_companyId: {
          productId: product.id,
          companyId: company.id
        }
      },
      update: { price },
      create: {
        productId: product.id,
        companyId: company.id,
        price
      }
    });
    
    return `✅ Set special price for ${company.name}: ${product.name} $${price}/${unit}`;
  } else {
    // Base price update
    await prisma.product.update({
      where: { id: product.id },
      data: { price }
    });
    
    return `✅ Updated ${product.name} base price to $${price}/${unit}`;
  }
}
```

---

## 📊 Complete System Flow

### Supplier Price Update → QS Sees New Price

```
1. Supplier: "Update cement for Company A to $45"
   │
   ▼
2. AI Agent: Processes request
   │
   ▼
3. Database: CompanyPrice updated
   │
   ▼
4. Cache: Invalidated
   │
   ▼
5. Supplier: Sees confirmation
   │
   ▼
6. QS (Company A): "What's the price of cement?"
   │
   ▼
7. AI Agent: Queries database
   │
   ▼
8. AI Agent: Finds CompanyPrice ($45)
   │
   ▼
9. QS: Sees $45/bag (special price)
```

---

## ✅ Complete Feature Set

### Supplier AI Chat Capabilities

1. ✅ **Price Management**
   - Update base prices
   - Set company-specific prices
   - Bulk price updates
   - Price history queries

2. ✅ **Inventory Management**
   - Check inventory
   - List products
   - View stock levels

3. ✅ **Quote Management**
   - View quote requests
   - Submit quotes
   - Negotiate quotes

4. ✅ **Order Management**
   - View orders
   - Update order status
   - Track deliveries

5. ✅ **Certificate Management**
   - View certificate requests
   - Upload certificates
   - Check certificate status

### QS AI Chat Capabilities

1. ✅ **Price Queries**
   - Get current prices
   - Compare suppliers
   - See special prices

2. ✅ **Quote Management**
   - Request quotes
   - Compare quotes
   - Approve/reject quotes

3. ✅ **Project Management**
   - Create projects
   - Manage projects
   - Track project costs

4. ✅ **Order Tracking**
   - Track deliveries
   - Check order status
   - Monitor timelines

5. ✅ **Certificate Management**
   - Request certificates
   - Review certificates
   - Approve certificates

---

## 🎯 Summary

**Both QS and Suppliers:**
- ✅ Use natural language AI chat (like ChatGPT)
- ✅ Have UI dashboards for detailed management
- ✅ All actions available via natural language
- ✅ Real-time updates and notifications
- ✅ Complete workflow management

**The system is truly AI-first for both user types!**

# Product Requirements Feature - Design Document

## Overview
A feature for company users to create a list of required products with quantities, and get intelligent supplier matching with best prices.

## User Flow

```
1. Company User navigates to "Product Requirements" page
2. User adds products to requirement list (by name or SKU + quantity)
3. User clicks "Find Best Suppliers"
4. System searches all suppliers and matches products
5. Results displayed showing:
   - Best supplier for each product (highlighted)
   - All available suppliers for each product (sorted by price)
   - Total cost per product
   - Summary statistics
```

## Page Layout

### Main Page: `/company/requirements`

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Product Requirements"                             │
│  [Back to Dashboard]                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Add Product to Requirements                        │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  Product Name/SKU: [________________]              │    │
│  │  Quantity:        [____] [Unit: ___]              │    │
│  │  [Add Product]                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Your Requirements List                            │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ ✓ Cement (SKU: CEM-001)                      │ │    │
│  │  │   Quantity: 100 bags                          │ │    │
│  │  │   [Remove]                                   │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ ✓ Steel Bars (SKU: STL-500)                   │ │    │
│  │  │   Quantity: 50 units                          │ │    │
│  │  │   [Remove]                                     │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  │  [Clear All]  [Find Best Suppliers]                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Results Summary                                     │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  Total Products: 2                                 │    │
│  │  Matched: 2 ✓                                      │    │
│  │  Unmatched: 0                                      │    │
│  │  Estimated Total: $15,000                           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Best Suppliers for Each Product                   │    │
│  ├────────────────────────────────────────────────────┤    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ 🏆 BEST MATCH                                │ │    │
│  │  │ Cement (CEM-001)                             │ │    │
│  │  │ Quantity: 100 bags                           │ │    │
│  │  ├──────────────────────────────────────────────┤ │    │
│  │  │ [Supplier Logo] ABC Construction Supplies    │ │    │
│  │  │ Price: $50.00/bag                            │ │    │
│  │  │ Total: $5,000.00                              │ │    │
│  │  │ Price Type: Private Price ✓                  │ │    │
│  │  │ [View Details] [Contact Supplier]            │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ Other Options (2)                             │ │    │
│  │  ├──────────────────────────────────────────────┤ │    │
│  │  │ [Supplier Logo] XYZ Materials                 │ │    │
│  │  │ Price: $52.00/bag | Total: $5,200.00         │ │    │
│  │  │ [View Details]                               │ │    │
│  │  ├──────────────────────────────────────────────┤ │    │
│  │  │ [Supplier Logo] BuildMart                     │ │    │
│  │  │ Price: $55.00/bag | Total: $5,500.00         │ │    │
│  │  │ [View Details]                               │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ 🏆 BEST MATCH                                │ │    │
│  │  │ Steel Bars (STL-500)                          │ │    │
│  │  │ Quantity: 50 units                           │ │    │
│  │  ├──────────────────────────────────────────────┤ │    │
│  │  │ [Supplier Logo] Metal Works Inc              │ │    │
│  │  │ Price: $200.00/unit                          │ │    │
│  │  │ Total: $10,000.00                             │ │    │
│  │  │ Price Type: Default Price                     │ │    │
│  │  │ [View Details] [Contact Supplier]             │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  │  [Export Results] [Save as Quote]                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Add Product Form
- **Input Fields:**
  - Product Name/SKU (autocomplete/searchable)
  - Quantity (number input with validation)
  - Unit (auto-detected or manual)
- **Actions:**
  - Add Product button
  - Clear button

### 2. Requirements List
- **Display:**
  - Product name and SKU
  - Quantity with unit
  - Remove button per item
- **Actions:**
  - Clear All button
  - Find Best Suppliers button (disabled if list empty)

### 3. Results Summary Card
- **Metrics:**
  - Total products in requirement
  - Number matched
  - Number unmatched
  - Estimated total cost

### 4. Best Supplier Cards (Per Product)
- **Best Match Card (Highlighted):**
  - 🏆 Badge indicating best match
  - Product name and SKU
  - Quantity required
  - Supplier logo and name
  - Price per unit
  - Total price (price × quantity)
  - Price type indicator (Private/Default)
  - Action buttons (View Details, Contact Supplier)

- **Other Options Section:**
  - Collapsible list of other suppliers
  - Sorted by total price (ascending)
  - Compact card format
  - View Details button

### 5. Actions Bar
- Export Results (PDF/Excel)
- Save as Quote
- Print

## Mobile Design

```
┌─────────────────────────┐
│ Product Requirements    │
│ [← Back]                │
├─────────────────────────┤
│                         │
│ Add Product             │
│ ┌─────────────────────┐ │
│ │ Product Name/SKU    │ │
│ │ [____________]      │ │
│ │                     │ │
│ │ Quantity: [___]    │ │
│ │                     │ │
│ │ [Add Product]       │ │
│ └─────────────────────┘ │
│                         │
│ Requirements (2)        │
│ ┌─────────────────────┐ │
│ │ ✓ Cement            │ │
│ │   100 bags          │ │
│ │   [Remove]          │ │
│ ├─────────────────────┤ │
│ │ ✓ Steel Bars        │ │
│ │   50 units          │ │
│ │   [Remove]          │ │
│ └─────────────────────┘ │
│                         │
│ [Clear All]             │
│ [Find Best Suppliers]   │
│                         │
│ Summary                 │
│ ┌─────────────────────┐ │
│ │ Matched: 2/2 ✓      │ │
│ │ Total: $15,000      │ │
│ └─────────────────────┘ │
│                         │
│ Results                 │
│ ┌─────────────────────┐ │
│ │ 🏆 BEST             │ │
│ │ Cement              │ │
│ │                     │ │
│ │ [Logo] ABC Supplies │ │
│ │ $50/bag             │ │
│ │ Total: $5,000       │ │
│ │ Private Price ✓     │ │
│ │                     │ │
│ │ [View] [Contact]    │ │
│ └─────────────────────┘ │
│                         │
│ Other Options (2)        │
│ [Tap to expand]          │
│                         │
└─────────────────────────┘
```

## Visual Design Specifications

### Colors
- **Best Match Badge:** Gold/Yellow (#F59E0B) with dark text
- **Private Price Badge:** Green (#10B981) - "Private Price"
- **Default Price Badge:** Blue (#3B82F6) - "Default Price"
- **Card Background:** White with subtle shadow
- **Best Match Card:** Light gold/yellow background (#FEF3C7)

### Typography
- **Page Title:** Bold, 2xl (24px)
- **Product Name:** Bold, lg (18px)
- **Price:** Bold, xl (20px), primary color
- **Supplier Name:** Medium, base (16px)
- **Labels:** Small, gray-600

### Spacing
- **Card Padding:** 16px (mobile), 24px (desktop)
- **Card Gap:** 16px (mobile), 24px (desktop)
- **Section Margin:** 32px between major sections

### Icons
- 🏆 Trophy icon for best match
- ✓ Checkmark for matched products
- ✕ Close icon for remove
- 📊 Chart icon for summary
- 📄 Document icon for export

## User Interactions

### Adding Products
1. User types product name or SKU
2. Autocomplete shows matching products (optional)
3. User enters quantity
4. Unit auto-detected from product
5. Click "Add Product" → Added to list

### Finding Suppliers
1. Click "Find Best Suppliers"
2. Loading state with spinner
3. Results appear with animation
4. Best match highlighted at top
5. Other options collapsible below

### Viewing Details
1. Click "View Details" → Navigate to product detail page
2. Click "Contact Supplier" → Open contact modal or email

## Error States

### No Matches Found
```
┌─────────────────────────────────┐
│ ⚠️ No suppliers found for:      │
│    "Product Name"               │
│                                 │
│ Try adjusting your search or    │
│ contact suppliers directly.     │
└─────────────────────────────────┘
```

### Empty Requirements List
```
┌─────────────────────────────────┐
│ 📋 No products added yet         │
│                                 │
│ Add products above to find       │
│ the best suppliers.              │
└─────────────────────────────────┘
```

## Responsive Breakpoints

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md)
- **Desktop:** > 1024px (lg)

## Accessibility

- All buttons have proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- High contrast for price displays
- Touch targets minimum 44x44px

## Performance Considerations

- Lazy load supplier logos
- Pagination for large result sets
- Debounce search input
- Cache product search results
- Optimistic UI updates










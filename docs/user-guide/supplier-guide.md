# Supplier User Guide

Complete guide for suppliers using the Construction Pricing Platform.

## Table of Contents

1. [Dashboard Overview](#dashboard-overview)
2. [Managing Products](#managing-products)
3. [Setting Prices](#setting-prices)
4. [Viewing Statistics](#viewing-statistics)
5. [Best Practices](#best-practices)

## Dashboard Overview

The Supplier Dashboard provides an overview of your business on the platform.

### Key Metrics

- **Total Products**: All products in your catalog (including inactive)
- **Active Products**: Currently active products
- **Products with Prices**: Products that have default prices set
- **Private Prices**: Number of products with company-specific pricing

### Quick Actions

- **Add Product**: Create a new product in your catalog
- **Import CSV**: Bulk import products (coming soon - currently disabled)
- **User Management**: Manage users in your organization (admin only)
  - Shows a red notification badge with pending user request count

## Managing Products

### Adding a Product

#### Step 1: Click "Add Product"
Click the blue "Add Product" button in the Quick Actions section.

#### Step 2: Fill in Product Details

**Required Fields:**
- **SKU**: Unique product identifier (e.g., "STEEL-BAR-001")
- **Name**: Product name (e.g., "Steel Reinforcement Bar #3")
- **Unit**: Measurement unit (e.g., "piece", "kg", "m", "ton")

**Optional Fields:**
- **Description**: Detailed product description
- **Category**: Product category (e.g., "Steel", "Cement", "Wood")
- **Default Price**: Base price for all companies
- **Currency**: Price currency (USD, EUR, GBP, SGD)

#### Step 3: Create Product
Click "Create Product" to save. The product will appear in your catalog immediately.

### Viewing Products

#### Method 1: Click Stat Cards
1. Click on any stat card (Total Products, Active Products, etc.)
2. A filtered product list appears below
3. View products in a table format

#### Method 2: Filter by Type
- **Total Products**: Shows all products (including inactive)
- **Active Products**: Shows only active products
- **Products with Prices**: Shows products with default prices
- **Private Prices**: Shows products with company-specific pricing

#### Method 3: Search Products
1. Use the search bar at the top of the products table
2. Type the product name to filter
3. Search is case-insensitive and filters in real-time
4. Results update as you type

### Product Information Displayed

The product table shows:
- **SKU**: Product identifier
- **Name**: Product name
- **Category**: Product category
- **Unit**: Measurement unit
- **Price**: Current default price (if set)
- **Status**: Active or Inactive
- **Actions**: Edit, Inactive/Activate, and Delete buttons

### Managing Products in the Table

Each product row includes action buttons:

#### Edit Product
1. Click the **"Edit"** button on any product row
2. A modal opens with the product's current information pre-filled
3. Modify any field (SKU, name, description, category, unit, price, currency)
4. Click **"Update Product"** to save changes
5. Changes are reflected immediately in the table

#### Activate/Deactivate Product
1. Click the **"Inactive"** button to deactivate an active product
2. Click the **"Activate"** button to reactivate an inactive product
3. A confirmation dialog will appear before changing the status
4. Inactive products won't appear in company searches

#### Delete Product
**Note**: Delete functionality is only available to admin users (supplier_admin). Staff users cannot delete products.

1. Click the **"Delete"** button on any product row (admin only)
2. A confirmation modal appears asking to confirm deletion
3. Click **"Delete"** in the modal to permanently remove the product
4. **Warning**: This action cannot be undone
5. Product and all associated prices will be deleted

## Setting Prices

### Default Prices

Default prices are visible to all companies browsing your catalog.

#### Setting Default Price During Product Creation
1. When adding a product, enter the "Default Price" field
2. Select the currency
3. The price will be set automatically

#### Updating Default Price

**Using API:**
```bash
PUT /api/v1/products/{productId}/default-price
{
  "price": 150.00,
  "currency": "USD"
}
```

### Special Prices (Private Prices)

Special prices are company-specific prices that override default prices for that specific company. Only the selected company can see their special price - other companies will see the default price.

You can set special prices in two ways:
1. **Fixed Price**: Set a specific price amount (e.g., SGD 38.00)
2. **Discount Percentage**: Set a discount percentage (e.g., 3% off the default price)

#### Managing Special Prices During Product Creation

**Step 1: Add Special Price Entry**
1. When creating a new product, scroll to the "Special Prices (Optional)" section
2. Click **"Add Company Price"** button
3. Fill in the form:
   - **Company**: Select from the dropdown list of active companies
   - **Pricing Type**: Choose "Special Price" or "Discount %"
   - **If Special Price**:
     - Enter the fixed price amount
     - Select the currency (USD, EUR, GBP, SGD)
   - **If Discount %**:
     - Enter discount percentage (0-100)
     - Currency will use the product's default currency
   - **Notes** (Optional): Add any notes about this special price
4. Click **"Include"** to add the special price to the list

**Step 2: Review Included Special Prices**
- All included special prices are shown in a table
- Review the pricing type, price/discount, and company
- Edit or delete entries before creating the product

**Step 3: Create Product**
- Click **"Create Product"** to save the product with all special prices

#### Managing Special Prices When Editing Product

**Step 1: Edit Product**
1. Click the **"Edit"** button on any product row
2. The edit modal opens with current product information

**Step 2: Manage Special Prices**
1. Scroll to the "Special Prices (Optional)" section in the edit modal
2. View existing special prices in the table
3. Add new special prices:
   - Click **"Add Company Price"**
   - Fill in company, pricing type, and price/discount
   - Click **"Include"** to add
4. Edit existing special prices:
   - Click **"Edit"** button on any special price row
   - Modify pricing type, price/discount, or notes
   - Click **"Update"** to save changes
5. Delete special prices:
   - Click **"Delete"** button on any special price row
   - Confirm deletion

**Step 3: Update Product**
- Click **"Update Product"** to save all changes including special prices

#### Pricing Type Options

**Special Price (Fixed Price)**
- Enter a specific price amount (e.g., 40.00)
- Select currency independently
- Company sees this exact price

**Discount Percentage**
- Enter discount percentage (0-100)
- System calculates: Default Price × (1 - Discount% / 100)
- Example: Default SGD 40.00 with 3% discount = SGD 38.80
- Uses product's default currency
- Company sees both discount percentage and calculated price

#### Special Price Rules

- **One Pricing Type Per Company**: Each company can have either a fixed price OR a discount percentage, not both
- **Company Selection**: Once a company is included, it cannot be selected again for the same product
- **Validation**: Discount percentage must be between 0-100
- **Privacy**: Each company only sees their own special price

#### Benefits of Special Prices
- Offer discounts to specific companies
- Negotiate custom pricing
- Maintain different pricing tiers
- Track company-specific agreements
- **Privacy**: Each company only sees their own special price
- Easy management through the dashboard UI

#### Using API (Advanced)

You can also manage special prices via API:

**Create Special Price:**
```bash
POST /api/v1/products/{productId}/private-prices
{
  "companyId": "company-uuid",
  "price": 140.00,
  "currency": "USD",
  "notes": "Volume discount for preferred customer"
}
```

**List All Special Prices for a Product:**
```bash
GET /api/v1/products/{productId}/private-prices
```

**Update Special Price:**
```bash
PUT /api/v1/private-prices/{privatePriceId}
{
  "price": 135.00,
  "currency": "USD"
}
```

**Delete Special Price:**
```bash
DELETE /api/v1/private-prices/{privatePriceId}
```

## Viewing Statistics

### Dashboard Statistics

The dashboard automatically updates with:
- Total product count
- Active product count
- Products with pricing
- Private pricing agreements

### Real-Time Updates

- Statistics refresh automatically when you add products
- Product counts update immediately
- No manual refresh needed

## Best Practices

### Product Management

1. **Use Clear SKUs**
   - Follow a consistent naming convention
   - Make SKUs descriptive and unique
   - Example: "STEEL-BAR-001" instead of "SB1"

2. **Complete Product Information**
   - Always include descriptions
   - Use appropriate categories
   - Set accurate units

3. **Keep Products Active**
   - Deactivate products that are no longer available
   - Don't delete products (use soft delete)

### Pricing Strategy

1. **Set Competitive Default Prices**
   - Research market rates
   - Consider your margins
   - Update prices regularly

2. **Use Private Prices Strategically**
   - Offer discounts for volume buyers
   - Reward loyal customers
   - Negotiate long-term contracts

3. **Price Updates**
   - Update prices when costs change
   - Notify companies of significant changes
   - Maintain price history for reference

### Organization

1. **Categorize Products**
   - Use consistent categories
   - Group similar products
   - Makes browsing easier for companies

2. **Regular Maintenance**
   - Review product list regularly
   - Update outdated information
   - Remove discontinued products

## Troubleshooting

### Product Not Appearing
- Check if product is marked as active
- Verify you're viewing the correct filter
- Refresh the page

### Price Not Showing
- Ensure default price is set
- Check if price is marked as active
- Verify currency is correct

### Statistics Not Updating
- Wait a few seconds for automatic refresh
- Manually refresh the page
- Check your internet connection

## Responding to RFQs (Request for Quote) 🆕

The platform includes a comprehensive RFQ feature that allows suppliers to view and respond to quote requests from companies.

### Quick Overview

- **View RFQs**: Browse relevant RFQs (targeted to you or matching your product categories)
- **Submit Bids**: Respond to RFQs with pricing, terms, and conditions
- **Track Responses**: Monitor bid status and receive notifications
- **Negotiate**: Respond to company counter-offers

### Getting Started with RFQs

1. **View Available RFQs**
   - Navigate to Supplier Dashboard → RFQs section
   - Browse RFQs targeted to you or matching your product categories
   - Filter by status, category, and other criteria

2. **Submit a Bid**
   - Click "View" or "Respond" on any RFQ
   - Review RFQ requirements and details
   - Fill in your quote: price, quantity, terms, validity period
   - Submit your bid

3. **Track Your Bids**
   - Monitor bid status: Pending, Accepted, Rejected, Countered
   - Receive real-time notifications for company actions
   - Respond to counter-offers when companies negotiate

### Learn More

For complete RFQ documentation including workflows, best practices, and detailed guides, see:
- **[Complete RFQ Guide](./rfq-guide.md)** - Comprehensive RFQ feature documentation

## Next Steps

- Learn about [RFQ Feature](./rfq-guide.md) 🆕 - Complete guide for viewing and responding to RFQs
- Learn about [API Testing](./api-testing.md) for advanced features
- Review [Company Guide](./company-guide.md) to understand the buyer perspective
- Check [Technical Documentation](../technical/) for integration details









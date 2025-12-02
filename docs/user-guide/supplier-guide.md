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
- **Import CSV**: Bulk import products (coming soon)
- **View Products**: View all your products

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
1. Click the **"Delete"** button on any product row
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

#### Managing Special Prices Through UI

**Step 1: Access Special Price Management**
1. View your products list (click on any stat card)
2. Find the product you want to set special prices for
3. Click the **"Special Prices"** button in the Actions column
4. A modal opens showing all special prices for that product

**Step 2: Add a Special Price**
1. Click **"Add Special Price"** button in the modal
2. Fill in the form:
   - **Company**: Select from the dropdown list of active companies
   - **Currency**: Choose the currency (USD, EUR, GBP, SGD)
   - **Special Price**: Enter the price amount
   - **Notes** (Optional): Add any notes about this special price
3. Click **"Add Price"** to save

**Step 3: View Special Prices**
- All special prices for the product are displayed in a table
- Shows company name, price, currency, effective date, and notes
- You can see which companies have special pricing

**Step 4: Edit Special Price**
1. Find the special price in the table
2. Click **"Edit"** button
3. Modify the price, currency, or notes
4. Click **"Update Price"** to save changes

**Step 5: Delete Special Price**
1. Find the special price in the table
2. Click **"Delete"** button
3. Confirm the deletion
4. The special price will be removed and the company will see the default price

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

## Next Steps

- Learn about [API Testing](./api-testing.md) for advanced features
- Review [Company Guide](./company-guide.md) to understand the buyer perspective
- Check [Technical Documentation](../technical/) for integration details









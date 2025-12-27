# RFQ (Request for Quote) Feature Guide 🆕

Complete guide for the RFQ feature - enabling companies to request quotes from suppliers and manage the entire quote lifecycle.

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [RFQ Workflows](#rfq-workflows)
4. [Company Guide](#company-guide)
5. [Supplier Guide](#supplier-guide)
6. [Notification System](#notification-system)
7. [Bulk RFQ Upload (CSV)](#bulk-rfq-upload-csv)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The RFQ (Request for Quote) feature enables companies to request quotes from suppliers for products or services. It provides a complete workflow from RFQ creation to quote acceptance, including negotiation capabilities and real-time notifications.

### What is an RFQ?

An RFQ (Request for Quote) is a formal request sent by a company to one or more suppliers asking them to provide pricing and terms for specific products or services needed for a project.

### Key Benefits

- **Streamlined Communication**: Replace phone calls and emails with a structured platform
- **Real-Time Updates**: Instant notifications for all RFQ actions
- **Efficient Comparison**: View and compare multiple supplier quotes in one place
- **Negotiation Support**: Built-in counter-offer and negotiation capabilities
- **Bulk Operations**: Upload multiple RFQs via CSV for efficiency
- **Targeted Outreach**: Send RFQs to specific suppliers or open to relevant suppliers

---

## Key Features

### For Companies

✅ **Create RFQs**
- Single RFQ creation with detailed specifications
- Bulk RFQ upload via CSV
- Open RFQs (visible to relevant suppliers based on category)
- Targeted RFQs (send to specific suppliers)

✅ **Manage Supplier Bids**
- View all submitted bids in one place
- Accept bids with optional comments
- Reject bids with optional comments
- Counter-negotiate specific bids
- Submit counter-offers for entire RFQ

✅ **RFQ Status Tracking**
- Track RFQ status: Pending, Responded, Accepted, Rejected, Cancelled
- View detailed bid history and responses
- Monitor RFQ expiration dates

✅ **Real-Time Notifications**
- Instant notifications when suppliers submit bids
- Alerts for bid responses and negotiations
- Notification center with read/unread status

### For Suppliers

✅ **View RFQs**
- Browse relevant RFQs (targeted or category-matched open RFQs)
- Filter by status and category
- View RFQ details and requirements

✅ **Submit Quotes**
- Respond to RFQs with pricing and terms
- Set quote validity period
- Include detailed terms and conditions

✅ **Track Responses**
- Monitor bid status (pending, accepted, rejected, countered)
- Receive notifications for company actions
- View counter-offers and negotiate

✅ **Real-Time Notifications**
- Instant notifications for new RFQs
- Alerts when companies accept/reject/counter bids
- Notification center with complete history

---

## RFQ Workflows

### Workflow 1: Basic RFQ → Quote → Acceptance

```
┌─────────────┐
│   Company   │
│  Creates    │
│     RFQ     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  RFQ Created                        │
│  - Open RFQ: Relevant suppliers     │
│    notified (category match)        │
│  - Targeted: Specific supplier      │
│    notified                         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Supplier   │
│  Receives   │
│ Notification│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supplier   │
│  Submits    │
│    Bid      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Company    │
│  Receives   │
│ Notification│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Company    │
│   Accepts   │
│    Bid      │
│  (Optional  │
│   Comment)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supplier   │
│  Receives   │
│ Acceptance  │
│ Notification│
└─────────────┘
```

### Workflow 2: RFQ with Negotiation

```
┌─────────────┐
│   Company   │
│  Creates    │
│     RFQ     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supplier   │
│  Submits    │
│    Bid      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Company    │
│  Reviews    │
│    Bid      │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Company    │   │  Company    │
│  Counter    │   │  Rejects    │
│ Negotiates  │   │   (Comment) │
└──────┬──────┘   └─────────────┘
       │
       ▼
┌─────────────┐
│  Supplier   │
│  Receives   │
│  Counter    │
│   Offer     │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Supplier   │   │  Supplier   │
│  Accepts    │   │  Rejects    │
│  Counter    │   │  Counter    │
└──────┬──────┘   └─────────────┘
       │
       ▼
┌─────────────┐
│   Company   │
│  Receives   │
│  Response   │
└─────────────┘
```

### Workflow 3: Multiple Suppliers Competing

```
┌─────────────┐
│   Company   │
│  Creates    │
│  Open RFQ   │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│Supplier A│   │Supplier B│   │Supplier C│
│ Receives │   │ Receives │   │ Receives │
│  RFQ     │   │  RFQ     │   │  RFQ     │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│Supplier A│   │Supplier B│   │Supplier C│
│ Submits  │   │ Submits  │   │ Submits  │
│  Bid 1   │   │  Bid 2   │   │  Bid 3   │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┴──────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │    Company      │
          │  Views All Bids │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │    Company      │
          │  Accepts Best   │
          │     Bid         │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  All Suppliers  │
          │  Notified of    │
          │   Decision      │
          └─────────────────┘
```

---

## Company Guide

### Creating an RFQ

#### Method 1: Single RFQ Creation

1. **Navigate to RFQ Section**
   - Go to Company Dashboard
   - Click "Quotes" tab or navigate to `/company/quotes`

2. **Click "Create RFQ"**
   - Click the blue "Create RFQ" button
   - A modal form will appear

3. **Fill in RFQ Details**

   **Required Fields:**
   - **RFQ Title** (3-200 characters): Brief description of what you need
     - Example: "Need 500 bags of Portland Cement"

   **Optional Fields:**
   - **Description**: Detailed requirements, specifications, delivery location
   - **Category**: Product/service category (e.g., "Construction Materials")
   - **Quantity**: Required quantity
   - **Unit**: Unit of measurement (e.g., "bags", "tons", "m²")
   - **Budget**: Target/expected price
   - **Currency**: USD, SGD, MYR, EUR
   - **Expiry Date**: When the RFQ expires
   - **Target Supplier**: Select specific supplier or leave empty for open RFQ

4. **Submit RFQ**
   - Click "Submit RFQ" button
   - RFQ is created and relevant suppliers are notified

#### Method 2: Bulk RFQ Upload (CSV)

See [Bulk RFQ Upload (CSV)](#bulk-rfq-upload-csv) section for detailed instructions.

### Managing Supplier Bids

#### Viewing Bids

1. **Navigate to RFQ Details**
   - Click on any RFQ from your quotes list
   - View all submitted bids in the details page

2. **Bid Information Displayed**
   - Supplier name and contact
   - Price and currency
   - Quantity (if specified)
   - Terms and conditions
   - Validity period
   - Submission date/time
   - Bid status (pending, accepted, rejected, countered)

#### Accepting a Bid

1. **Review the Bid**
   - Open RFQ details page
   - Review all bid information

2. **Click "Accept"**
   - Click the "Accept" button on the bid card
   - An acceptance modal will appear

3. **Add Optional Comment**
   - Enter any comments or notes (optional)
   - Example: "Accepted. Please proceed with delivery as discussed."

4. **Confirm Acceptance**
   - Click "Confirm Acceptance"
   - Bid is accepted and supplier is notified
   - RFQ status changes to "Accepted"

#### Rejecting a Bid

1. **Click "Reject"**
   - Click the "Reject" button on the bid card
   - A rejection modal will appear

2. **Add Optional Comment**
   - Enter reason for rejection (optional)
   - Example: "Price exceeds budget. Unable to proceed."

3. **Confirm Rejection**
   - Click "Confirm Rejection"
   - Bid is rejected and supplier is notified
   - RFQ status changes to "Rejected"

#### Counter-Negotiating a Specific Bid

1. **Click "Negotiate"**
   - Click the "Negotiate" button on the bid card
   - Counter-offer modal will appear

2. **Enter Counter-Offer Details**
   - **Price**: Your proposed price
   - **Quantity**: Adjusted quantity (if applicable)
   - **Terms**: Modified terms and conditions
   - **Message**: Additional comments

3. **Submit Counter-Offer**
   - Click "Submit Counter-Offer"
   - Supplier receives notification with your counter-offer
   - Original bid remains, new counter-offer is created

#### Counter-Negotiating Entire RFQ

1. **Navigate to RFQ Details**
   - Open the RFQ you want to counter-negotiate

2. **Click "Submit Counter-Offer for RFQ"**
   - Button is located below the RFQ description
   - Counter-offer modal will appear

3. **Enter Counter-Offer Details**
   - **Price**: Your proposed price
   - **Quantity**: Adjusted quantity
   - **Terms**: Modified terms
   - **Message**: Additional comments

4. **Submit Counter-Offer**
   - Click "Submit Counter-Offer"
   - All relevant suppliers receive notification
   - This allows you to adjust RFQ requirements and notify all suppliers

### RFQ Statuses

- **Pending**: RFQ created, awaiting supplier responses
- **Responded**: At least one supplier has submitted a bid
- **Accepted**: Company has accepted a bid
- **Rejected**: Company has rejected all bids
- **Cancelled**: RFQ has been cancelled
- **Expired**: RFQ has passed its expiry date

---

## Supplier Guide

### Viewing RFQs

#### Accessing RFQs

1. **Navigate to RFQ Section**
   - Go to Supplier Dashboard
   - Click "RFQs" or navigate to public RFQ page

2. **View Relevant RFQs**
   - See RFQs targeted to you specifically
   - See open RFQs matching your product categories
   - Filter by status (pending, responded, etc.)
   - Filter by category

3. **RFQ Information Displayed**
   - RFQ title and description
   - Company name and details
   - Category
   - Quantity and unit
   - Budget (if specified)
   - Expiry date
   - Status
   - Number of existing responses

### Submitting a Bid

1. **View RFQ Details**
   - Click "View" or "Respond" on an RFQ card
   - Review all RFQ requirements

2. **Click "Submit Quote" or "Respond"**
   - Response modal/form will appear

3. **Fill in Quote Details**

   **Required Fields:**
   - **Price**: Your quoted price
   - **Currency**: Currency for the quote

   **Optional Fields:**
   - **Quantity**: Quantity you can supply (if different from RFQ)
   - **Terms**: Terms and conditions
   - **Message**: Additional comments or information
   - **Valid Until**: Quote validity period

4. **Submit Quote**
   - Click "Submit Quote" or "Send Response"
   - Your bid is submitted and company is notified
   - You can track the status in your dashboard

### Tracking Your Bids

#### Viewing Bid Status

1. **Access Your Quotes**
   - Navigate to your supplier dashboard
   - View RFQs you've responded to

2. **Status Indicators**
   - **Pending**: Awaiting company decision
   - **Accepted**: Company accepted your bid
   - **Rejected**: Company rejected your bid
   - **Countered**: Company submitted a counter-offer

#### Responding to Counter-Offers

1. **Receive Notification**
   - You'll receive a real-time notification when company counters
   - Check your notification center

2. **Review Counter-Offer**
   - View the counter-offer details
   - Compare with your original bid

3. **Respond**
   - Accept the counter-offer
   - Submit a new counter-offer
   - Reject and withdraw

---

## Notification System

### Real-Time Notifications

The platform uses WebSocket connections to provide real-time notifications for all RFQ activities.

### Notification Events

#### For Companies

- **`rfq:created`**: RFQ created successfully
- **`quote:responded`**: Supplier submitted a bid
- **`quote:countered`**: Supplier responded to your counter-offer

#### For Suppliers

- **`rfq:created`**: New RFQ available (targeted or relevant open RFQ)
- **`quote:accepted`**: Company accepted your bid
- **`quote:rejected`**: Company rejected your bid
- **`quote:countered`**: Company submitted a counter-offer

### Notification Center

#### Accessing Notifications

1. **Notification Bell Icon**
   - Located in the dashboard header
   - Red badge shows count of unread notifications

2. **View Notifications**
   - Click the bell icon
   - Dropdown shows recent notifications
   - Click a notification to navigate to relevant page

3. **Manage Notifications**
   - Mark individual notifications as read
   - Mark all as read
   - Clear individual notifications

### Notification Details

Each notification includes:
- **Type**: Event type (RFQ created, bid accepted, etc.)
- **Title**: Brief summary
- **Description**: Detailed information
- **Timestamp**: When the event occurred
- **Link**: Direct link to relevant RFQ/bid
- **Status**: Read or unread

---

## Bulk RFQ Upload (CSV)

### Overview

Upload multiple RFQs at once using a CSV file. This is ideal for bulk submissions or importing RFQs from other systems.

### CSV Format

#### Required Columns

- **title** (required): RFQ title, 3-200 characters

#### Optional Columns

- **description**: Detailed description
- **category**: Category name (e.g., "Construction Materials")
- **quantity**: Numeric quantity
- **unit**: Unit of measurement (e.g., "bags", "tons")
- **requestedPrice**: Budget/target price (numeric)
- **currency**: 3-letter currency code (default: USD)
- **expiresAt**: Expiry date in YYYY-MM-DD format
- **supplierId**: UUID of specific supplier (leave empty for open RFQs)

### Sample CSV

```csv
title,description,category,quantity,unit,requestedPrice,currency,expiresAt,supplierId
Need 500 bags of Portland Cement,We require high-quality Portland cement Type I for our residential construction project.,Construction Materials,500,bags,25000,USD,2024-12-31,
Steel Rebar Supply,Need Grade 60 steel rebar in various sizes for building foundation.,Steel & Metal,10,tons,15000,USD,2024-11-30,
Concrete Mixing Service,Looking for ready-mix concrete delivery service.,Construction Services,50,cubic meters,5000,USD,2024-12-15,
```

### Upload Process

1. **Access Upload Feature**
   - Go to Company Dashboard → Quotes section
   - Click "Upload CSV" button

2. **Prepare CSV File**
   - Download sample CSV template (if available)
   - Fill in your RFQ data following the format
   - Save as CSV file

3. **Upload File**
   - Click "Choose File" or drag and drop
   - Select your CSV file
   - Click "Upload"

4. **Review Results**
   - View summary:
     - Total records processed
     - Successfully created RFQs
     - Failed RFQs (with error messages)
     - Invalid rows (with validation errors)
   - Fix errors and re-upload if needed

### Validation Rules

1. **Title**: Required, 3-200 characters
2. **Quantity**: Must be valid number if provided
3. **Requested Price**: Must be valid number if provided
4. **Currency**: Must be exactly 3 characters (USD, SGD, etc.)
5. **Expires At**: Must be valid date in YYYY-MM-DD format, must be future date
6. **Supplier ID**: Must be valid UUID if provided

### Best Practices for CSV Upload

1. **Use Template**: Start with the provided sample CSV
2. **Validate Dates**: Ensure expiry dates are in the future
3. **Check Supplier IDs**: Verify UUIDs if targeting specific suppliers
4. **Review Errors**: Carefully review failed/invalid rows
5. **File Size**: Keep file under 5MB (typically 1000+ RFQs)
6. **Test First**: Upload a small test file before bulk upload

---

## RFQ Targeting and Notifications

### Open RFQs

When you create an RFQ without selecting a specific supplier:

1. **Category Matching**
   - System finds suppliers with products in the RFQ's category
   - Only relevant suppliers are notified
   - If no category specified, no automatic notifications (suppliers can browse)

2. **Visibility**
   - RFQ appears in public RFQ list
   - Suppliers can browse and respond
   - Real-time notifications sent to relevant suppliers

### Targeted RFQs

When you select a specific supplier:

1. **Direct Notification**
   - Only the selected supplier receives notification
   - RFQ is not visible in public list to other suppliers
   - Faster response from targeted supplier

2. **When to Use**
   - Existing relationship with supplier
   - Specific supplier expertise required
   - Preferred vendor for the product/service

### Choosing Between Open and Targeted

**Use Open RFQ when:**
- You want to compare multiple suppliers
- You're exploring new suppliers
- Category matching is sufficient
- You want competitive pricing

**Use Targeted RFQ when:**
- You have a preferred supplier
- Specific expertise required
- Urgent requirement
- Ongoing relationship

---

## Best Practices

### For Companies

#### Creating Effective RFQs

1. **Clear Titles**
   - Be specific and descriptive
   - Include key details (quantity, product type)
   - Example: "500 bags Portland Cement Type I" vs "Cement needed"

2. **Detailed Descriptions**
   - Include specifications, quality requirements
   - Delivery location and timeline
   - Any special requirements or constraints

3. **Realistic Budgets**
   - Set realistic budget expectations
   - Helps suppliers provide competitive quotes
   - Too low may discourage responses

4. **Appropriate Expiry Dates**
   - Give suppliers enough time to respond (typically 7-14 days)
   - Set clear deadlines for planning
   - Consider project timeline

#### Managing Bids

1. **Review All Bids**
   - Compare all bids before deciding
   - Consider price, terms, supplier reputation
   - Don't just accept the lowest price

2. **Use Comments**
   - Add comments when accepting/rejecting
   - Provides feedback to suppliers
   - Helps build relationships

3. **Negotiate Effectively**
   - Use counter-offers for beneficial negotiations
   - Be clear about requirements
   - Respond promptly to maintain momentum

### For Suppliers

#### Responding to RFQs

1. **Quick Response**
   - Respond promptly to show interest
   - Competitive advantage over slower responders
   - Companies appreciate fast turnaround

2. **Accurate Pricing**
   - Provide realistic, competitive pricing
   - Include all costs (materials, labor, delivery)
   - Avoid underbidding to win, then increasing later

3. **Detailed Terms**
   - Clearly state terms and conditions
   - Include delivery timeline
   - Specify payment terms

4. **Professional Communication**
   - Use clear, professional language
   - Address all RFQ requirements
   - Highlight your competitive advantages

#### Managing Your Bids

1. **Track Status**
   - Regularly check bid status
   - Respond promptly to counter-offers
   - Follow up if no response after reasonable time

2. **Learn from Rejections**
   - Review rejection comments (if provided)
   - Adjust pricing or terms for future RFQs
   - Build relationships through professional responses

---

## Troubleshooting

### Common Issues

#### Company Issues

**RFQ not appearing in supplier list**
- Verify RFQ was created successfully
- Check if RFQ is targeted (only selected supplier sees it)
- Ensure category matches supplier products (for open RFQs)
- Check RFQ status (expired/cancelled RFQs may not appear)

**No supplier responses**
- Verify RFQ was sent to relevant suppliers
- Check expiry date hasn't passed
- Ensure budget is realistic
- Consider sending targeted RFQ to specific suppliers

**Cannot accept/reject bid**
- Verify you're logged in as a company user
- Check RFQ hasn't expired
- Ensure bid status is "pending"
- Refresh page and try again

#### Supplier Issues

**Not receiving RFQ notifications**
- Check WebSocket connection status
- Verify you have products in the RFQ category (for open RFQs)
- Ensure you're logged in
- Check notification center for missed notifications

**Cannot submit bid**
- Verify RFQ hasn't expired
- Check RFQ status (only pending RFQs accept new bids)
- Ensure all required fields are filled
- Try refreshing the page

**Bid not showing in dashboard**
- Verify bid was submitted successfully
- Check for error messages
- Refresh the page
- Contact support if issue persists

### Getting Help

- Check notification center for system messages
- Review RFQ details page for status information
- Contact platform support for technical issues
- Refer to API documentation for programmatic access

---

## Next Steps

- Learn about [CSV Upload Details](../RFQ_CSV_UPLOAD.md) for bulk operations
- Review [Notification System](../RFQ_NOTIFICATION_SYSTEM.md) for technical details
- Check [API Reference](../technical/api-reference.md) for programmatic access
- Explore [Company Guide](./company-guide.md) for other company features
- Explore [Supplier Guide](./supplier-guide.md) for other supplier features

---

**Last Updated**: 2024-12-31  
**Version**: 1.0

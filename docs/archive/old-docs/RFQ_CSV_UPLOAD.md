# RFQ CSV Upload Guide

## Overview

Companies can upload multiple RFQs at once using a CSV file. This is useful for bulk RFQ submissions.

## CSV Format

### Required Columns
- **title** (required): RFQ title, 3-200 characters

### Optional Columns
- **description**: Detailed description of the RFQ
- **category**: Category name (e.g., "Construction Materials", "Steel & Metal")
- **quantity**: Numeric quantity
- **unit**: Unit of measurement (e.g., "bags", "tons", "cubic meters")
- **requestedPrice**: Budget/target price (numeric)
- **currency**: 3-letter currency code (default: USD)
- **expiresAt**: Expiry date in YYYY-MM-DD format (e.g., 2024-12-31)
- **supplierId**: UUID of specific supplier (leave empty for open RFQs)

## Sample CSV

```csv
title,description,category,quantity,unit,requestedPrice,currency,expiresAt,supplierId
Need 500 bags of Portland Cement,We require high-quality Portland cement Type I for our residential construction project.,Construction Materials,500,bags,25000,USD,2024-12-31,
Steel Rebar Supply,Need Grade 60 steel rebar in various sizes for building foundation.,Steel & Metal,10,tons,15000,USD,2024-11-30,
Concrete Mixing Service,Looking for ready-mix concrete delivery service.,Construction Services,50,cubic meters,5000,USD,2024-12-15,
```

## Validation Rules

1. **Title**: Required, 3-200 characters
2. **Quantity**: Must be a valid number if provided
3. **Requested Price**: Must be a valid number if provided
4. **Currency**: Must be exactly 3 characters (e.g., USD, SGD, MYR)
5. **Expires At**: Must be a valid date in YYYY-MM-DD format, must be in the future
6. **Supplier ID**: Must be a valid UUID if provided

## Upload Process

1. Click "Upload CSV" button in RFQ section
2. Select or download sample CSV file
3. Fill in your RFQ data following the format
4. Upload the CSV file
5. System validates and creates RFQs
6. Review results showing:
   - Successfully created RFQs
   - Failed RFQs (with error messages)
   - Invalid rows (with validation errors)

## API Endpoint

**POST** `/api/v1/quotes/rfq/upload-csv`

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Body:**
- `csvFile`: CSV file (max 5MB)

**Response:**
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
    {
      "id": "uuid",
      "title": "RFQ Title"
    }
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
      "data": {...},
      "errors": ["Title is required", "Invalid date format"]
    }
  ]
}
```

## Error Handling

- **No file**: Returns 400 error
- **Invalid CSV format**: Returns 400 with parsing error
- **No valid records**: Returns 400 with list of invalid rows
- **Partial success**: Returns 201 with summary of created/failed/invalid

## Best Practices

1. **Use the sample CSV** as a template
2. **Validate dates** before uploading (must be future dates)
3. **Check supplier IDs** if targeting specific suppliers
4. **Review errors** carefully and fix invalid rows
5. **Keep file size** under 5MB (typically 1000+ RFQs)

## File Location

Sample CSV file: `test-data/rfq-sample.csv`




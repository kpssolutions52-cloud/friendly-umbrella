# RFQ CSV Upload Setup

## Installation

The CSV upload feature requires the `csv-parse` package. Install it:

```bash
cd packages/backend
npm install csv-parse
```

## Features

✅ CSV file upload for bulk RFQ creation
✅ CSV validation with detailed error messages
✅ Sample CSV file for reference
✅ Upload progress and results display
✅ Download sample CSV template

## Files Created

1. **Backend:**
   - `packages/backend/src/utils/csvParser.ts` - CSV parsing and validation
   - `packages/backend/src/routes/quoteRoutes.ts` - CSV upload endpoint

2. **Frontend:**
   - `packages/frontend/src/components/RFQSection.tsx` - CSV upload UI

3. **Sample Data:**
   - `test-data/rfq-sample.csv` - Sample CSV file

4. **Documentation:**
   - `docs/RFQ_CSV_UPLOAD.md` - User guide
   - `docs/RFQ_CSV_SETUP.md` - This file

## Usage

1. Companies can click "Upload CSV" button in RFQ section
2. Download sample CSV or use provided template
3. Fill in RFQ data
4. Upload CSV file
5. Review results (created, failed, invalid)

## CSV Format

See `test-data/rfq-sample.csv` for example format.

Required: `title`
Optional: `description`, `category`, `quantity`, `unit`, `requestedPrice`, `currency`, `expiresAt`, `supplierId`




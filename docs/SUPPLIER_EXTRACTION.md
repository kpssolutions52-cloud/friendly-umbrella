# Singapore Supplier Data Extraction

This document describes how to extract supplier/contractor contact information from official Singapore sources and import them into the database.

## Data Sources

### 1. BCA Registered Contractors (Primary Source)
- **URL**: https://data.gov.sg/datasets/d_dcda79be4aded5f9e769b8e23ff69b47/view
- **Format**: CSV download available (2.9 MB, ~24,000 records)
- **Data Fields**: Company Name, UEN, Workhead, Grade, Address, Postal Code, Tel No
- **Status**: ✅ Automated extraction script available

### 2. BCA Suppliers Registry
- **URL**: https://www1.bca.gov.sg/bca-directory/suppliers-registry/supply
- **Format**: Web directory (searchable)
- **Coverage**: Registered suppliers by construction categories
- **Status**: ⚠️ Manual extraction or web scraping required

### 3. GeBIZ Supplier Directory
- **URL**: https://www.gebiz.gov.sg/ptn/supplier/directory/
- **Format**: Web directory (requires login)
- **Coverage**: Government suppliers registered for procurement
- **Status**: ⚠️ Manual extraction required

## Quick Start

### Option 1: Use the Extraction Script (Recommended)

```bash
# Run the extraction script
python3 extract_suppliers.py

# This will create: suppliers_singapore.csv
```

The script will:
- Fetch data from BCA Registered Contractors API
- Transform data to match your database schema
- Create a CSV file ready for import
- Handle rate limiting automatically

**Note**: The script fetches up to 1000 records by default to avoid rate limits. To get all ~24,000 records:
1. Download the CSV directly from data.gov.sg
2. Use the transformation script to convert it to your schema

### Option 2: Manual CSV Download

1. Visit: https://data.gov.sg/datasets/d_dcda79be4aded5f9e769b8e23ff69b47/view
2. Click "Download CSV (2.9 MB)"
3. Transform the CSV using the provided script or manually

## CSV Format

The generated CSV matches your `tenants` table schema:

| Column | Description | Example |
|--------|-------------|---------|
| `id` | UUID | `ed5e3486-223a-4695-a70d-afd83af5f965` |
| `name` | Company name | `ABC Construction Pte Ltd` |
| `type` | Always `supplier` | `supplier` |
| `email` | Contact email (auto-generated, needs verification) | `contact@abcconstruction.com.sg` |
| `phone` | Phone number | `+65 6123 4567` |
| `address` | Full address | `123 Construction St, #01-01` |
| `postal_code` | Singapore postal code | `123456` |
| `status` | Initial status | `pending` |
| `is_active` | Active flag | `false` |
| `metadata` | JSON with additional info | See below |

### Metadata JSON Structure

```json
{
  "registrationNumber": "UEN number",
  "contactPerson": "Contact person name",
  "website": "Company website",
  "taxId": "Tax ID",
  "businessLicense": "Business license number",
  "description": "Company description",
  "city": "Singapore",
  "state": "",
  "country": "Singapore",
  "workhead": "BCA workhead code",
  "grade": "BCA grade",
  "source": "BCA Registered Contractors"
}
```

## Database Import

### For Local PostgreSQL

```sql
-- Use the import script
\i database/28-import-suppliers-from-csv.sql

-- Or use COPY command directly
COPY tenants (id, name, type, email, phone, address, postal_code, status, is_active, metadata, created_at, updated_at)
FROM '/path/to/suppliers_singapore.csv'
WITH (FORMAT csv, HEADER true, QUOTE '"');
```

### For Supabase

1. **Via Dashboard**:
   - Go to Table Editor → `tenants`
   - Click "Import data" → Upload CSV
   - Map columns appropriately

2. **Via SQL Editor**:
   - Use the import script: `database/28-import-suppliers-from-csv.sql`
   - Adjust file paths as needed

3. **Via API** (Programmatic):
   - Use the Supabase REST API or client library
   - Read CSV and insert records via API

## Data Quality Notes

### ⚠️ Important Considerations

1. **Email Addresses**: 
   - Currently auto-generated from company names
   - **Action Required**: Verify and update email addresses manually
   - Many suppliers may not have public email addresses

2. **UEN Numbers**:
   - Some records may have empty UEN fields
   - UEN is stored in `metadata->>'registrationNumber'`

3. **Duplicate Companies**:
   - Same company may appear multiple times (different workheads)
   - Import script uses `ON CONFLICT (email) DO NOTHING` to prevent duplicates
   - Consider deduplicating by company name if needed

4. **Contact Information**:
   - Phone numbers are from BCA registry (usually available)
   - Addresses are complete with postal codes
   - Contact person names are not available in BCA data

## Next Steps

1. **Verify Email Addresses**:
   ```sql
   UPDATE tenants 
   SET metadata = jsonb_set(metadata, '{emailVerified}', 'false')
   WHERE type = 'supplier' AND email LIKE '%@example.com';
   ```

2. **Enrich Data**:
   - Add contact person names from other sources
   - Add website URLs
   - Verify business licenses

3. **Filter by Category**:
   - Use `metadata->>'workhead'` to filter by construction category
   - Common workheads: CR (Construction), ME (Mechanical/Electrical), FM (Facilities Management)

4. **Activate Suppliers**:
   ```sql
   UPDATE tenants 
   SET is_active = true, status = 'active'
   WHERE type = 'supplier' 
     AND email NOT LIKE '%@example.com'
     AND phone IS NOT NULL;
   ```

## Script Options

### Fetch More Records

Edit `extract_suppliers.py` and change the limit:

```python
# In extract_all_bca_contractors() function
if len(all_records) >= 1000:  # Change this number
    break
```

### Handle Rate Limiting

The script includes automatic retry with exponential backoff. If you hit rate limits:
- Wait a few minutes between runs
- Reduce the batch size (limit parameter)
- Use the direct CSV download from data.gov.sg instead

## Troubleshooting

### SSL Certificate Errors
If you see SSL errors, the script disables verification. For production, consider:
- Installing proper SSL certificates
- Using a proxy server
- Using the direct CSV download method

### Rate Limiting (429 Errors)
- The script automatically retries with delays
- If persistent, use the direct CSV download
- Consider running during off-peak hours

### Missing Data
- Some fields (email, contact person) may be empty
- This is expected - enrich manually or from other sources
- Focus on companies with complete phone/address data first

## Additional Resources

- **BCA Website**: https://www1.bca.gov.sg
- **Data.gov.sg**: https://data.gov.sg
- **GeBIZ**: https://www.gebiz.gov.sg
- **Singapore Business Directory**: https://www.sgpbusiness.com

## Support

For issues with:
- **Data extraction**: Check script logs and API responses
- **Database import**: Verify CSV format matches schema
- **Data quality**: Review source data and enrichment process

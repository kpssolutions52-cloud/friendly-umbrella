#!/usr/bin/env python3
"""
Script to extract supplier data from Singapore BCA and GeBIZ sources
and create a CSV file for database import.

Sources:
1. BCA Registered Contractors (data.gov.sg)
2. BCA Suppliers Registry
3. GeBIZ Supplier Directory
"""

import json
import csv
import urllib.request
import ssl
import sys
import time
from typing import List, Dict, Any
import uuid

# Disable SSL verification for data.gov.sg (if needed)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def fetch_bca_contractors(limit: int = 100, offset: int = 0, retry: int = 3) -> Dict[str, Any]:
    """Fetch BCA registered contractors from data.gov.sg API with retry logic"""
    url = f"https://data.gov.sg/api/action/datastore_search?resource_id=d_dcda79be4aded5f9e769b8e23ff69b47&limit={limit}&offset={offset}"
    
    for attempt in range(retry):
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
                data = json.loads(response.read().decode())
                return data
        except urllib.error.HTTPError as e:
            if e.code == 429:  # Too Many Requests
                wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                print(f"Rate limited. Waiting {wait_time} seconds...", file=sys.stderr)
                time.sleep(wait_time)
                continue
            else:
                print(f"HTTP Error {e.code}: {e}", file=sys.stderr)
                if attempt == retry - 1:
                    return {"success": False, "result": {"records": [], "total": 0}}
        except Exception as e:
            print(f"Error fetching BCA contractors (attempt {attempt + 1}/{retry}): {e}", file=sys.stderr)
            if attempt < retry - 1:
                time.sleep(2)
            else:
                return {"success": False, "result": {"records": [], "total": 0}}
    
    return {"success": False, "result": {"records": [], "total": 0}}

def extract_all_bca_contractors() -> List[Dict[str, Any]]:
    """Extract all BCA contractors with pagination"""
    all_records = []
    limit = 100
    offset = 0
    
    # First request to get total count
    first_response = fetch_bca_contractors(limit=limit, offset=offset)
    if not first_response.get("success"):
        print("Failed to fetch initial data", file=sys.stderr)
        return []
    
    total = first_response.get("result", {}).get("total", 0)
    records = first_response.get("result", {}).get("records", [])
    all_records.extend(records)
    
    print(f"Total records available: {total}")
    print(f"Fetched {len(all_records)} records so far...")
    
    # Fetch remaining records in batches with rate limiting
    while len(all_records) < total and len(records) > 0:
        offset += limit
        # Add delay to avoid rate limiting
        time.sleep(1)
        response = fetch_bca_contractors(limit=limit, offset=offset)
        if not response.get("success"):
            print(f"Failed to fetch more records at offset {offset}. Stopping.", file=sys.stderr)
            break
        records = response.get("result", {}).get("records", [])
        if not records:
            break
        all_records.extend(records)
        print(f"Fetched {len(all_records)}/{total} records...")
        
        # Stop if we've hit a reasonable limit (e.g., 1000 records) to avoid rate limits
        if len(all_records) >= 1000:
            print(f"Reached 1000 records. Stopping to avoid rate limits.", file=sys.stderr)
            break
    
    return all_records

def transform_to_supplier_format(contractor: Dict[str, Any]) -> Dict[str, str]:
    """Transform BCA contractor data to match tenants table schema"""
    # Extract fields from contractor record
    company_name = contractor.get("company_name", "").strip()
    uen = contractor.get("uen", "").strip()
    tel_no = contractor.get("tel_no", "").strip()
    building_no = contractor.get("building_no", "").strip()
    street_name = contractor.get("street_name", "").strip()
    unit_no = contractor.get("unit_no", "").strip()
    building_name = contractor.get("building_name", "").strip()
    postal_code = contractor.get("postal_code", "").strip()
    workhead = contractor.get("workhead", "").strip()
    grade = contractor.get("grade", "").strip()
    
    # Build address
    address_parts = []
    if building_no:
        address_parts.append(building_no)
    if street_name:
        address_parts.append(street_name)
    if unit_no:
        address_parts.append(f"#{unit_no}")
    if building_name:
        address_parts.append(building_name)
    address = ", ".join(address_parts) if address_parts else ""
    
    # Generate email (use placeholder - should be updated manually)
    # Clean company name for email generation
    clean_name = company_name.lower().replace(' ', '').replace('.', '').replace(',', '').replace("'", '').replace('#', '').replace('@', '').replace('-', '')[:30]
    if clean_name:
        email = f"contact@{clean_name}.com.sg"
    else:
        email = f"supplier_{uuid.uuid4().hex[:8]}@example.com"
    
    # Create metadata JSON
    metadata = {
        "registrationNumber": uen if uen else "",
        "contactPerson": "",  # Not available in BCA data
        "website": "",  # Not available in BCA data
        "taxId": uen if uen else "",
        "businessLicense": uen if uen else "",
        "description": f"BCA Registered Contractor - {workhead} (Grade: {grade})" if workhead else "BCA Registered Contractor",
        "city": "Singapore",
        "state": "",
        "country": "Singapore",
        "workhead": workhead,
        "grade": grade,
        "source": "BCA Registered Contractors"
    }
    
    return {
        "id": str(uuid.uuid4()),
        "name": company_name,
        "type": "supplier",
        "email": email,
        "phone": tel_no,
        "address": address,
        "postal_code": postal_code,
        "status": "pending",
        "is_active": "false",
        "metadata": json.dumps(metadata, ensure_ascii=False)
    }

def create_csv_file(records: List[Dict[str, Any]], filename: str = "suppliers_singapore.csv"):
    """Create CSV file from supplier records"""
    if not records:
        print("No records to write", file=sys.stderr)
        return
    
    # CSV headers matching tenants table
    fieldnames = [
        "id",
        "name",
        "type",
        "email",
        "phone",
        "address",
        "postal_code",
        "status",
        "is_active",
        "metadata"
    ]
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        
        for record in records:
            writer.writerow(record)
    
    print(f"\n✅ Created CSV file: {filename}")
    print(f"   Total suppliers: {len(records)}")

def main():
    print("🔍 Extracting supplier data from BCA Registered Contractors...")
    print("=" * 60)
    
    # Extract BCA contractors
    contractors = extract_all_bca_contractors()
    
    if not contractors:
        print("⚠️  No contractors found. Creating template CSV instead.")
        # Create a template with sample data
        sample_suppliers = [
            {
                "id": str(uuid.uuid4()),
                "name": "Sample Construction Supplier Pte Ltd",
                "type": "supplier",
                "email": "contact@sampleconstruction.com.sg",
                "phone": "+65 6123 4567",
                "address": "123 Construction Street, #01-01",
                "postal_code": "123456",
                "status": "pending",
                "is_active": "false",
                "metadata": json.dumps({
                    "registrationNumber": "123456789A",
                    "contactPerson": "John Doe",
                    "website": "https://www.sampleconstruction.com.sg",
                    "taxId": "123456789A",
                    "businessLicense": "BL-123456",
                    "description": "Construction materials supplier",
                    "city": "Singapore",
                    "state": "",
                    "country": "Singapore",
                    "source": "Manual Entry"
                }, ensure_ascii=False)
            }
        ]
        create_csv_file(sample_suppliers, "suppliers_singapore_template.csv")
        print("\n📝 Please manually populate the template with data from:")
        print("   1. BCA Suppliers Registry: https://www1.bca.gov.sg/bca-directory/suppliers-registry/supply")
        print("   2. GeBIZ: https://www.gebiz.gov.sg/ptn/supplier/directory/")
        print("   3. Download BCA CSV from: https://data.gov.sg/datasets/d_dcda79be4aded5f9e769b8e23ff69b47/view")
        return
    
    # Transform to supplier format
    print(f"\n🔄 Transforming {len(contractors)} contractor records...")
    suppliers = [transform_to_supplier_format(c) for c in contractors]
    
    # Create CSV
    create_csv_file(suppliers, "suppliers_singapore.csv")
    
    print("\n📊 Summary:")
    print(f"   - Total suppliers extracted: {len(suppliers)}")
    print(f"   - With phone numbers: {sum(1 for s in suppliers if s['phone'])}")
    print(f"   - With addresses: {sum(1 for s in suppliers if s['address'])}")
    print(f"   - With postal codes: {sum(1 for s in suppliers if s['postal_code'])}")

if __name__ == "__main__":
    main()

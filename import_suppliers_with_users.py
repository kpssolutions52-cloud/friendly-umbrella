#!/usr/bin/env python3
"""
Script to import suppliers from CSV into database with:
1. Tenant records with full profile details
2. User accounts with demo login credentials
3. Proper password hashing using PostgreSQL pgcrypto

Demo Password: "Demo123!" for all suppliers
"""

import csv
import json
import uuid
import sys

# Demo password pattern: "Demo123!" for all suppliers
# This is easy to remember for demo environments
DEMO_PASSWORD = "Demo123!"

def read_csv(filename):
    """Read supplier data from CSV"""
    suppliers = []
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            suppliers.append(row)
    return suppliers

def extract_metadata(metadata_str):
    """Parse JSON metadata string"""
    try:
        return json.loads(metadata_str.replace("''", "'"))
    except:
        return {}

def escape_sql_string(value):
    """Escape SQL string properly for PostgreSQL"""
    if value is None:
        return 'NULL'
    # Replace single quotes with two single quotes (SQL escaping)
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"

def generate_user_name(company_name):
    """Generate a user name from company name"""
    # Extract first meaningful words from company name
    # Remove common suffixes like "PTE. LTD.", "LTD", etc.
    name = company_name.upper()
    name = name.replace("PTE. LTD.", "").replace("PTE LTD", "").replace("LTD", "")
    name = name.replace("PRIVATE LIMITED", "").replace("LIMITED", "")
    name = name.strip()
    
    # Take first 2-3 words
    words = name.split()[:3]
    if words:
        return " ".join(words)
    return "Supplier Admin"

def generate_sql_inserts(suppliers):
    """Generate SQL INSERT statements for tenants and users"""
    
    sql_statements = []
    sql_statements.append("-- Import Singapore Suppliers with Demo Credentials")
    sql_statements.append("-- Generated from suppliers_singapore.csv")
    sql_statements.append("-- Demo Password for all suppliers: " + DEMO_PASSWORD)
    sql_statements.append("")
    sql_statements.append("-- Enable pgcrypto extension for password hashing")
    sql_statements.append("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    sql_statements.append("")
    sql_statements.append("BEGIN;")
    sql_statements.append("")
    
    # Track inserted emails to avoid duplicates
    inserted_emails = set()
    
    for supplier in suppliers:
        email = supplier.get('email', '').strip()
        if not email or email in inserted_emails:
            continue
        
        inserted_emails.add(email)
        
        # Extract data
        tenant_id = supplier.get('id', str(uuid.uuid4()))
        name = supplier.get('name', '').strip()
        phone = supplier.get('phone', '').strip() or None
        address = supplier.get('address', '').strip() or None
        postal_code = supplier.get('postal_code', '').strip() or None
        metadata_str = supplier.get('metadata', '{}')
        metadata = extract_metadata(metadata_str)
        
        # Parse metadata for profile fields
        registration_number = metadata.get('registrationNumber', '') or None
        contact_person = metadata.get('contactPerson', '') or None
        website = metadata.get('website', '') or None
        tax_id = metadata.get('taxId', '') or None
        business_license = metadata.get('businessLicense', '') or None
        description = metadata.get('description', '') or None
        city = metadata.get('city', 'Singapore') or 'Singapore'
        state = metadata.get('state', '') or None
        country = metadata.get('country', 'Singapore') or 'Singapore'
        workhead = metadata.get('workhead', '') or None
        grade = metadata.get('grade', '') or None
        
        # Build metadata JSON
        metadata_json = {
            "registrationNumber": registration_number or "",
            "contactPerson": contact_person or "",
            "website": website or "",
            "taxId": tax_id or "",
            "businessLicense": business_license or "",
            "description": description or "",
            "city": city,
            "state": state or "",
            "country": country,
            "workhead": workhead or "",
            "grade": grade or "",
            "source": "BCA Registered Contractors"
        }
        
        # Generate user name
        user_name = generate_user_name(name)
        if not contact_person:
            # Use company name as fallback
            contact_person = user_name
        
        # Insert into tenants table
        sql_statements.append(f"-- Supplier: {name}")
        sql_statements.append(f"INSERT INTO tenants (")
        sql_statements.append(f"    id, name, type, email, phone, address, postal_code,")
        sql_statements.append(f"    status, is_active, metadata, created_at, updated_at")
        sql_statements.append(f") VALUES (")
        sql_statements.append(f"    '{tenant_id}',")
        sql_statements.append(f"    {escape_sql_string(name)},")
        sql_statements.append(f"    'supplier',")
        sql_statements.append(f"    {escape_sql_string(email)},")
        sql_statements.append(f"    {escape_sql_string(phone) if phone else 'NULL'},")
        sql_statements.append(f"    {escape_sql_string(address) if address else 'NULL'},")
        sql_statements.append(f"    {escape_sql_string(postal_code) if postal_code else 'NULL'},")
        sql_statements.append(f"    'active',")  # Set to active for demo
        sql_statements.append(f"    true,")  # Set to active for demo
        sql_statements.append(f"    {escape_sql_string(json.dumps(metadata_json, ensure_ascii=False))}::jsonb,")
        sql_statements.append(f"    NOW(),")
        sql_statements.append(f"    NOW()")
        sql_statements.append(f")")
        sql_statements.append(f"ON CONFLICT (email) DO UPDATE SET")
        sql_statements.append(f"    name = EXCLUDED.name,")
        sql_statements.append(f"    phone = COALESCE(EXCLUDED.phone, tenants.phone),")
        sql_statements.append(f"    address = COALESCE(EXCLUDED.address, tenants.address),")
        sql_statements.append(f"    postal_code = COALESCE(EXCLUDED.postal_code, tenants.postal_code),")
        sql_statements.append(f"    metadata = EXCLUDED.metadata,")
        sql_statements.append(f"    updated_at = NOW();")
        sql_statements.append("")
        
        # Create user account with demo credentials
        user_id = str(uuid.uuid4())
        # Extract first and last name from contact person or company name
        name_parts = contact_person.split() if contact_person else user_name.split()
        first_name = name_parts[0] if name_parts else "Supplier"
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Admin"
        
        # Create user account with demo credentials
        sql_statements.append(f"-- Create user account for: {email}")
        sql_statements.append(f"INSERT INTO users (")
        sql_statements.append(f"    id, tenant_id, email, password_hash, first_name, last_name, role, status, is_active, created_at, updated_at")
        sql_statements.append(f") VALUES (")
        sql_statements.append(f"    '{user_id}',")
        sql_statements.append(f"    '{tenant_id}',")
        sql_statements.append(f"    {escape_sql_string(email)},")
        sql_statements.append(f"    crypt({escape_sql_string(DEMO_PASSWORD)}, gen_salt('bf', 12)),")  # bcrypt with 12 rounds
        sql_statements.append(f"    {escape_sql_string(first_name)},")
        sql_statements.append(f"    {escape_sql_string(last_name)},")
        sql_statements.append(f"    'supplier_admin',")  # Admin role for supplier
        sql_statements.append(f"    'active',")  # Active status for demo
        sql_statements.append(f"    true,")  # is_active = true
        sql_statements.append(f"    NOW(),")
        sql_statements.append(f"    NOW()")
        sql_statements.append(f")")
        sql_statements.append(f"ON CONFLICT (email) DO UPDATE SET")
        sql_statements.append(f"    tenant_id = EXCLUDED.tenant_id,")
        sql_statements.append(f"    password_hash = EXCLUDED.password_hash,")
        sql_statements.append(f"    first_name = EXCLUDED.first_name,")
        sql_statements.append(f"    last_name = EXCLUDED.last_name,")
        sql_statements.append(f"    role = EXCLUDED.role,")
        sql_statements.append(f"    status = 'active',")
        sql_statements.append(f"    is_active = true,")
        sql_statements.append(f"    updated_at = NOW();")
        sql_statements.append("")
    
    sql_statements.append("COMMIT;")
    sql_statements.append("")
    sql_statements.append("-- Summary")
    sql_statements.append("SELECT '=== IMPORT SUMMARY ===' as summary;")
    sql_statements.append("")
    sql_statements.append("SELECT ")
    sql_statements.append("    COUNT(*) as total_suppliers,")
    sql_statements.append("    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,")
    sql_statements.append("    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as with_address,")
    sql_statements.append("    COUNT(CASE WHEN postal_code IS NOT NULL THEN 1 END) as with_postal_code")
    sql_statements.append("FROM tenants")
    sql_statements.append("WHERE type = 'supplier'")
    sql_statements.append("  AND status = 'active';")
    sql_statements.append("")
    sql_statements.append("-- Sample suppliers with login credentials")
    sql_statements.append("SELECT ")
    sql_statements.append("    t.name as company_name,")
    sql_statements.append("    u.email as login_email,")
    sql_statements.append("    '" + DEMO_PASSWORD + "' as demo_password,")
    sql_statements.append("    u.first_name || ' ' || u.last_name as contact_name,")
    sql_statements.append("    t.phone,")
    sql_statements.append("    t.address")
    sql_statements.append("FROM tenants t")
    sql_statements.append("JOIN users u ON t.id = u.tenant_id")
    sql_statements.append("WHERE t.type = 'supplier' AND t.status = 'active'")
    sql_statements.append("ORDER BY t.created_at DESC")
    sql_statements.append("LIMIT 10;")
    
    return "\n".join(sql_statements)

def main():
    if len(sys.argv) < 2:
        csv_file = "suppliers_singapore.csv"
    else:
        csv_file = sys.argv[1]
    
    print(f"Reading suppliers from: {csv_file}")
    suppliers = read_csv(csv_file)
    print(f"Found {len(suppliers)} supplier records")
    
    print("Generating SQL statements...")
    sql = generate_sql_inserts(suppliers)
    
    output_file = "database/29-import-singapore-suppliers-with-users.sql"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print(f"✅ Generated SQL file: {output_file}")
    print(f"   Total suppliers: {len(suppliers)}")
    print(f"   Demo password for all: {DEMO_PASSWORD}")
    print(f"\nTo import, run:")
    print(f"   psql -d your_database -f {output_file}")

if __name__ == "__main__":
    main()

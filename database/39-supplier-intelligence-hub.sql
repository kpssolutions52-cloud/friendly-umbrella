-- Migration 39: Supplier Intelligence Hub (normalized supplier directory for QS)

DO $$ BEGIN
  CREATE TYPE "SupplierHubSourceType" AS ENUM ('excel', 'manual', 'web', 'imported');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupplierHubStatus" AS ENUM ('active', 'inactive', 'preferred', 'blacklisted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS supplier_hub_entries (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category         VARCHAR(255),
  company_name     VARCHAR(500) NOT NULL,
  address          TEXT,
  trade            VARCHAR(500),
  remark           TEXT,
  source_type      "SupplierHubSourceType" NOT NULL DEFAULT 'manual',
  status           "SupplierHubStatus" NOT NULL DEFAULT 'active',
  is_preferred     BOOLEAN NOT NULL DEFAULT FALSE,
  is_favorite      BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_hub_entries_org ON supplier_hub_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_hub_entries_company ON supplier_hub_entries(company_name);
CREATE INDEX IF NOT EXISTS idx_supplier_hub_entries_status ON supplier_hub_entries(status);

CREATE TABLE IF NOT EXISTS supplier_hub_contacts (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supplier_hub_entry_id TEXT NOT NULL REFERENCES supplier_hub_entries(id) ON DELETE CASCADE,
  contact_name         VARCHAR(255),
  phone                VARCHAR(100),
  fax                  VARCHAR(100),
  email                VARCHAR(255),
  whatsapp_number      VARCHAR(100),
  designation          VARCHAR(255),
  is_primary           BOOLEAN NOT NULL DEFAULT FALSE,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_hub_contacts_entry ON supplier_hub_contacts(supplier_hub_entry_id);
CREATE INDEX IF NOT EXISTS idx_supplier_hub_contacts_email ON supplier_hub_contacts(email);

CREATE TABLE IF NOT EXISTS supplier_hub_activities (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supplier_hub_entry_id TEXT NOT NULL REFERENCES supplier_hub_entries(id) ON DELETE CASCADE,
  user_id               TEXT REFERENCES users(id) ON DELETE SET NULL,
  action                VARCHAR(100) NOT NULL,
  details               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_hub_activities_entry ON supplier_hub_activities(supplier_hub_entry_id);
CREATE INDEX IF NOT EXISTS idx_supplier_hub_activities_created ON supplier_hub_activities(created_at);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_supplier_hub_entries_updated_at
    BEFORE UPDATE ON supplier_hub_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_supplier_hub_contacts_updated_at
    BEFORE UPDATE ON supplier_hub_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

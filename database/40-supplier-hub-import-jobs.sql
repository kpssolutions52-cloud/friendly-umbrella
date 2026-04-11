-- Async Excel import jobs (background processing + polling)

DO $$ BEGIN
  CREATE TYPE "SupplierHubImportJobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS supplier_hub_import_jobs (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  status          "SupplierHubImportJobStatus" NOT NULL DEFAULT 'pending',
  mode            VARCHAR(32) NOT NULL,
  payload         JSONB NOT NULL,
  result_created  INTEGER,
  result_skipped  INTEGER,
  result_errors   JSONB,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_hub_import_jobs_org ON supplier_hub_import_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_supplier_hub_import_jobs_status ON supplier_hub_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_supplier_hub_import_jobs_created ON supplier_hub_import_jobs(created_at DESC);

DO $$ BEGIN
  CREATE TRIGGER trg_supplier_hub_import_jobs_updated_at
    BEFORE UPDATE ON supplier_hub_import_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

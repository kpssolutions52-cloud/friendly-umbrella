-- Track how many existing hub rows got category filled during import (skip_duplicates mode).

ALTER TABLE supplier_hub_import_jobs
  ADD COLUMN IF NOT EXISTS result_backfilled INTEGER;

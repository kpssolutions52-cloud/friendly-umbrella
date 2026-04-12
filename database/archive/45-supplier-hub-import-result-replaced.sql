-- Count of existing hub rows fully overwritten by Excel import (replace_existing mode).

ALTER TABLE supplier_hub_import_jobs
  ADD COLUMN IF NOT EXISTS result_replaced INTEGER;

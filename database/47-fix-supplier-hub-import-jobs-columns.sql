-- Fix: "column supplier_hub_import_jobs.result_backfilled does not exist"
-- Prisma expects these optional counters; add them to Supabase (SQL Editor) if import /confirm fails.
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE supplier_hub_import_jobs
  ADD COLUMN IF NOT EXISTS result_backfilled INTEGER;

ALTER TABLE supplier_hub_import_jobs
  ADD COLUMN IF NOT EXISTS result_replaced INTEGER;

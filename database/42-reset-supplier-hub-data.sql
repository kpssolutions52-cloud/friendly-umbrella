-- Reset Supplier Intelligence Hub data for one organization so you can re-import
-- a fresh Excel file and verify categories, then re-export to inspect the Category column.
--
-- Export (after re-import): authenticated QS user → GET /supplier-hub/export
--   → downloads supplier-intelligence-export.xlsx with a "Category" column.
--
-- Usage (Supabase / psql): set :org to your organizations.id (UUID), then run.
--   In Supabase SQL editor, replace the UUID literal in both DELETEs below.

BEGIN;

-- Optional: clear import job history for this org (payload held the parsed preview rows).
DELETE FROM supplier_hub_import_jobs
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Deletes hub entries; contacts and activities CASCADE (see migration 39).
DELETE FROM supplier_hub_entries
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid;

COMMIT;

-- Preview before wiping (uncomment):
-- SELECT organization_id, count(*) AS entries FROM supplier_hub_entries GROUP BY 1;
-- SELECT id, company_name, category FROM supplier_hub_entries WHERE organization_id = '...' LIMIT 50;

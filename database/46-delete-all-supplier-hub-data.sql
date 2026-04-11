-- =============================================================================
-- Supplier Intelligence Hub — ONLY these tables hold the directory you see in
-- the QS "Supplier Hub" / chat hub UI:
--   supplier_hub_entries
--   supplier_hub_contacts   (FK → entries; normally CASCADE delete)
--   supplier_hub_activities (FK → entries; normally CASCADE delete)
--   supplier_hub_import_jobs
--
-- There is no other table for that list. If rows remain after DELETE, you are
-- almost certainly using the wrong organization_id (see diagnostics below).
--
-- NOT the same data (do not expect clearing hub to remove these):
--   organizations / users          — platform tenants & logins
--   products                     — supplier catalog SKUs
--   rfq_supplier_candidates      — procurement RFQ suggestions (different UI)
-- =============================================================================

-- ─── 1) Run diagnostics first (no writes) ───────────────────────────────────
-- Hub rows per org (pick the UUID that matches your logged-in QS company):
-- SELECT organization_id, count(*) AS hub_entries
-- FROM supplier_hub_entries
-- GROUP BY organization_id
-- ORDER BY count(*) DESC;

-- Map your login email → organization_id (QS user):
-- SELECT u.email, u.organization_id, o.name AS org_name, o.type
-- FROM users u
-- JOIN organizations o ON o.id = u.organization_id
-- WHERE u.email ILIKE '%you@example.com%';

-- ─── 2) Delete for ONE org — replace UUID below ─────────────────────────────
BEGIN;

DELETE FROM supplier_hub_import_jobs
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Explicit child deletes (safe even if CASCADE were missing on your DB)
DELETE FROM supplier_hub_activities
WHERE supplier_hub_entry_id IN (
  SELECT id FROM supplier_hub_entries
  WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
);

DELETE FROM supplier_hub_contacts
WHERE supplier_hub_entry_id IN (
  SELECT id FROM supplier_hub_entries
  WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid
);

DELETE FROM supplier_hub_entries
WHERE organization_id = '00000000-0000-0000-0000-000000000000'::uuid;

COMMIT;

-- ─── 3) Nuclear: ALL organizations (dev / staging only) ────────────────────
-- BEGIN;
-- DELETE FROM supplier_hub_import_jobs;
-- DELETE FROM supplier_hub_activities;
-- DELETE FROM supplier_hub_contacts;
-- DELETE FROM supplier_hub_entries;
-- COMMIT;

-- Deduplicate supplier_hub_entries per organization by normalized company name
-- (lower(trim(company_name))). Keeps the oldest row (earliest created_at, then id);
-- reassigns contacts and activities to the survivor, then deletes duplicate rows.
--
-- Usage: run in psql / Supabase SQL editor. Backup first.
-- Preview duplicates only:
--   SELECT organization_id, lower(trim(company_name)) AS norm, count(*) AS cnt
--   FROM supplier_hub_entries WHERE archived_at IS NULL
--   GROUP BY 1, 2 HAVING count(*) > 1;

BEGIN;

WITH entries AS (
  SELECT id, organization_id, lower(trim(company_name)) AS norm, created_at
  FROM supplier_hub_entries
  WHERE archived_at IS NULL
),
winners AS (
  SELECT DISTINCT ON (organization_id, norm)
    id AS winner_id,
    organization_id,
    norm
  FROM entries
  ORDER BY organization_id, norm, created_at ASC, id ASC
),
losers AS (
  SELECT e.id AS loser_id, w.winner_id
  FROM entries e
  INNER JOIN winners w
    ON e.organization_id = w.organization_id AND e.norm = w.norm
  WHERE e.id <> w.winner_id
)
UPDATE supplier_hub_contacts c
SET supplier_hub_entry_id = l.winner_id,
    updated_at = NOW()
FROM losers l
WHERE c.supplier_hub_entry_id = l.loser_id;

WITH entries AS (
  SELECT id, organization_id, lower(trim(company_name)) AS norm, created_at
  FROM supplier_hub_entries
  WHERE archived_at IS NULL
),
winners AS (
  SELECT DISTINCT ON (organization_id, norm)
    id AS winner_id,
    organization_id,
    norm
  FROM entries
  ORDER BY organization_id, norm, created_at ASC, id ASC
),
losers AS (
  SELECT e.id AS loser_id, w.winner_id
  FROM entries e
  INNER JOIN winners w
    ON e.organization_id = w.organization_id AND e.norm = w.norm
  WHERE e.id <> w.winner_id
)
UPDATE supplier_hub_activities a
SET supplier_hub_entry_id = l.winner_id
FROM losers l
WHERE a.supplier_hub_entry_id = l.loser_id;

WITH entries AS (
  SELECT id, organization_id, lower(trim(company_name)) AS norm, created_at
  FROM supplier_hub_entries
  WHERE archived_at IS NULL
),
winners AS (
  SELECT DISTINCT ON (organization_id, norm)
    id AS winner_id,
    organization_id,
    norm
  FROM entries
  ORDER BY organization_id, norm, created_at ASC, id ASC
),
losers AS (
  SELECT e.id AS loser_id, w.winner_id
  FROM entries e
  INNER JOIN winners w
    ON e.organization_id = w.organization_id AND e.norm = w.norm
  WHERE e.id <> w.winner_id
)
DELETE FROM supplier_hub_entries s
WHERE s.id IN (SELECT loser_id FROM losers);

COMMIT;

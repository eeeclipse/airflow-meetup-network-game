-- AMB-023 — Pin the production event's networking-session window
-- to the exact KST timestamps confirmed with the meetup organizer.
--
-- Run with the sync (psycopg) URL:
--   psql "$DB_URL_SYNC" -f scripts/set_event_cutoff.sql
--
-- Adjust :starts_at and :cutoff_at below to the real slot before
-- running. Default placeholder values match the spec (19:00 +
-- 45min) — change them if the actual slot moves.

\set event_slug 'airflow-meetup-2026-06-20'
\set starts_at '2026-06-20 19:00:00+09:00'
\set cutoff_at '2026-06-20 19:45:00+09:00'

BEGIN;

UPDATE events
   SET starts_at = :'starts_at',
       cutoff_at = :'cutoff_at',
       updated_at = NOW()
 WHERE slug = :'event_slug';

-- Sanity check — confirm exactly one row was touched.
SELECT
    id,
    slug,
    starts_at,
    cutoff_at,
    jsonb_array_length(keywords) AS keyword_count
  FROM events
 WHERE slug = :'event_slug';

COMMIT;

#!/usr/bin/env bash
# AMB-026 — Post-event data export.
#
# Captures three CSVs (exchanges, users, event row) for the
# Airflow Meetup 2026-06-20 so the run can be debriefed and any
# anonymized analytics can be derived. Writes into the directory
# you pass as the first argument (default: `.docs/reports/`).
#
# Requires `DB_URL_SYNC` env var (the same Supavisor URL minus
# the `+asyncpg` driver suffix — see backend/.env).
#
# Usage:
#   DB_URL_SYNC=postgresql://... ./scripts/post_event_export.sh
#   DB_URL_SYNC=postgresql://... ./scripts/post_event_export.sh /tmp/exports
set -euo pipefail

OUT_DIR=${1:-.docs/reports}
SLUG=${EVENT_SLUG:-airflow-meetup-2026-06-20}

if [ -z "${DB_URL_SYNC:-}" ]; then
    echo "DB_URL_SYNC env var required (psycopg-compatible URL)." >&2
    exit 1
fi

mkdir -p "$OUT_DIR"

EVENT_ID=$(psql "$DB_URL_SYNC" -At -c \
    "SELECT id FROM events WHERE slug = '$SLUG'")
if [ -z "$EVENT_ID" ]; then
    echo "No event with slug '$SLUG'." >&2
    exit 2
fi

echo "Exporting event id=$EVENT_ID to $OUT_DIR/"

psql "$DB_URL_SYNC" -c "\copy (
    SELECT * FROM bingo_interaction WHERE event_id = $EVENT_ID
) TO '$OUT_DIR/exchanges.csv' CSV HEADER"

psql "$DB_URL_SYNC" -c "\copy (
    SELECT id, nickname, board_layout, keywords
      FROM bingo_user WHERE event_id = $EVENT_ID
) TO '$OUT_DIR/users.csv' CSV HEADER"

psql "$DB_URL_SYNC" -c "\copy (
    SELECT id, name, slug, starts_at, cutoff_at, keywords
      FROM events WHERE id = $EVENT_ID
) TO '$OUT_DIR/event.csv' CSV HEADER"

echo "Done."
echo "Next:"
echo "  1. (Optional) Scrub nicknames in users.csv if you plan to share."
echo "  2. Drop the final leaderboard screenshot into $OUT_DIR/."
echo "  3. Write the report doc at $OUT_DIR/2026-06-20-airflow-meetup-bingo.md."

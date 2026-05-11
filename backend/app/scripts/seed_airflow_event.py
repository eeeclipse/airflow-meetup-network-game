"""Seed the Airflow Meetup 2026-06-20 event row.

Idempotent: re-running detects the existing event by slug and skips
the insert. Inserts a stub admin row if none with the configured
email exists yet — the bingo game does not depend on admin UI for
our one-shot networking event, but the events table has a NOT NULL
admin_id foreign key.

Run from `backend/`:

    ./.venv/bin/python -m app.scripts.seed_airflow_event
"""
from __future__ import annotations

import datetime as dt
import json
import os
import secrets
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load `.env` from the repo root (same path the alembic env.py uses).
load_dotenv(Path(__file__).resolve().parents[3] / ".env")


# --- Event configuration --------------------------------------------------

EVENT_NAME = "Airflow Meetup 2026-06-20"
EVENT_SLUG = "airflow-meetup-2026-06-20"
EVENT_LOCATION = "TBD"
EVENT_TEAM = "Airflow Korea Meetup"

# Overall event window (loose; the meetup itself runs longer than the
# bingo networking session).
START_TIME = "2026-06-20T18:00:00+09:00"
END_TIME = "2026-06-20T22:00:00+09:00"

# Networking-session window inside the event. The 45min bingo round.
# Adjust both fields per the organizer's confirmed slot (AMB-023).
STARTS_AT = "2026-06-20T19:00:00+09:00"
CUTOFF_AT = "2026-06-20T19:45:00+09:00"

# AMB-010 — 5x5 board.
BINGO_SIZE = 5
# Treated as "lines to call bingo" in upstream code; 5 matches a full
# row on a 5x5 board.
SUCCESS_CONDITION = 5

ADMIN_EMAIL = "airflow-meetup-bot@local"
ADMIN_NAME = "Airflow Meetup Bot"


# --- Keyword pool (mirror frontend/src/data/airflowKeywords.ts) ----------
# Labels only — descriptions live on the FE per the schema decision
# recorded in the plan addendum.

KEYWORDS: list[str] = [
    # operators / tasks (8)
    "PythonOperator", "BashOperator", "KubernetesPodOperator",
    "BigQueryInsertJobOperator", "S3KeySensor", "HttpSensor",
    "BranchPythonOperator", "ShortCircuitOperator",
    # core concepts (8)
    "DAG", "XCom", "TaskFlow API", "TaskGroup", "Pool", "SLA",
    "Backfill", "Dynamic Task Mapping",
    # executors / managed platforms (6)
    "CeleryExecutor", "KubernetesExecutor", "LocalExecutor",
    "MWAA", "Composer", "Astronomer",
    # ops / failure stories (5)
    "on_failure_callback", "Trigger Rule", "Retry/Exponential Backoff",
    "스케줄러 데드락 경험", "Backfill 폭주 경험",
    # ecosystem (3)
    "dbt + Airflow", "Datahub Lineage", "Great Expectations",
]
assert len(KEYWORDS) == 30, f"expected 30 keywords, got {len(KEYWORDS)}"


def _sync_url() -> str:
    """Convert `postgresql+asyncpg://...` to plain `postgresql://...`
    so the synchronous psycopg driver can open the connection."""
    return os.environ["DB_URL"].replace("+asyncpg", "")


def main() -> None:
    engine = create_engine(_sync_url())
    with engine.begin() as conn:
        # Skip if already seeded.
        existing_id = conn.execute(
            text("SELECT id FROM events WHERE slug = :slug"),
            {"slug": EVENT_SLUG},
        ).scalar()
        if existing_id is not None:
            print(
                f"Event '{EVENT_NAME}' already exists (id={existing_id}). "
                "Skipping."
            )
            return

        # Ensure admin row exists.
        admin_id = conn.execute(
            text("SELECT id FROM admins WHERE email = :email"),
            {"email": ADMIN_EMAIL},
        ).scalar()
        if admin_id is None:
            now_kst = dt.datetime.now(dt.timezone(dt.timedelta(hours=9)))
            # This admin row exists only to satisfy the events.admin_id FK
            # — the bingo game has no admin login flow. We bcrypt-hash a
            # one-shot random secret so the row is well-formed but the
            # account is effectively unusable from the admin UI.
            random_secret = secrets.token_urlsafe(32)
            password_hash = bcrypt.hashpw(
                random_secret.encode("utf-8"), bcrypt.gensalt()
            ).decode("utf-8")
            admin_id = conn.execute(
                text(
                    """
                    INSERT INTO admins (
                        email, password, name, role,
                        password_setup_required,
                        created_at, updated_at
                    )
                    VALUES (
                        :email, :password, :name, :role,
                        :password_setup_required,
                        :now, :now
                    )
                    RETURNING id
                    """
                ),
                {
                    "email": ADMIN_EMAIL,
                    "password": password_hash,
                    "name": ADMIN_NAME,
                    "role": "EVENT_MANAGER",
                    "password_setup_required": False,
                    "now": now_kst,
                },
            ).scalar_one()
            print(f"Created admin id={admin_id}")

        # Insert event. created_at/updated_at have ORM defaults (Python
        # lambdas) that don't fire for raw SQL inserts — set them
        # explicitly so the NOT NULL constraints pass.
        now_kst = dt.datetime.now(dt.timezone(dt.timedelta(hours=9)))
        ev_id = conn.execute(
            text(
                """
                INSERT INTO events (
                    name, slug, location, event_team,
                    start_time, end_time,
                    admin_id, admin_email,
                    bingo_size, success_condition,
                    keywords, game_mode, team_size,
                    publish_state,
                    starts_at, cutoff_at,
                    created_at, updated_at
                ) VALUES (
                    :name, :slug, :location, :event_team,
                    :start_time, :end_time,
                    :admin_id, :admin_email,
                    :bingo_size, :success_condition,
                    CAST(:keywords AS jsonb), :game_mode, :team_size,
                    :publish_state,
                    :starts_at, :cutoff_at,
                    :now, :now
                )
                RETURNING id
                """
            ),
            {
                "name": EVENT_NAME,
                "slug": EVENT_SLUG,
                "location": EVENT_LOCATION,
                "event_team": EVENT_TEAM,
                "start_time": START_TIME,
                "end_time": END_TIME,
                "admin_id": admin_id,
                "admin_email": ADMIN_EMAIL,
                "bingo_size": BINGO_SIZE,
                "success_condition": SUCCESS_CONDITION,
                "keywords": json.dumps(KEYWORDS),
                "game_mode": "INDIVIDUAL",
                "team_size": 1,
                "publish_state": "PUBLISHED",
                "starts_at": STARTS_AT,
                "cutoff_at": CUTOFF_AT,
                "now": now_kst,
            },
        ).scalar_one()
        print(
            f"Seeded event id={ev_id} (slug={EVENT_SLUG}) with "
            f"{len(KEYWORDS)} keywords"
        )


if __name__ == "__main__":
    main()

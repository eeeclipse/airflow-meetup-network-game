# Deploy

Production target: **Vercel (FE) + Fly.io (BE) + Supabase
(Postgres + Auth + Realtime)**. All three are free-tier-friendly
for the 50-person Airflow Meetup 2026-06-20.

## One-time setup

### 1. Install CLIs

```bash
# macOS
brew install flyctl
brew install vercel-cli   # optional — Vercel can also be driven from the dashboard
```

Authenticate:

```bash
fly auth signup   # or `fly auth login`
vercel login
```

### 2. Provision the Fly app (BE)

From the repo root:

```bash
cd backend
fly launch --no-deploy --copy-config --name airflow-meetup-bingo-be
```

The included `backend/fly.toml` pins the app to `sin`
(Singapore) so latency to the Supabase Supavisor pooler in
`ap-southeast-1` is single-digit ms.

Set secrets — these come from `backend/.env` (or your password
manager). **Never commit them.**

```bash
fly secrets set \
    DB_URL="postgresql+asyncpg://postgres.<ref>:<URL-encoded-pw>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" \
    ENV="production" \
    EVENT_SLUG_SALT="<32-char-hex>" \
    SUPABASE_URL="https://<ref>.supabase.co" \
    SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
```

Deploy:

```bash
fly deploy
```

Smoke check:

```bash
curl https://airflow-meetup-bingo-be.fly.dev/api/events/3/cutoff
# → { "now": "...", "cutoff_at": "2026-06-20T19:45:00+09:00" }
```

### 3. Provision the Vercel project (FE)

From the repo root:

```bash
cd frontend
vercel link
vercel env add VITE_SUPABASE_URL          # paste https://<ref>.supabase.co
vercel env add VITE_SUPABASE_ANON_KEY     # paste sb_publishable_...
vercel env add VITE_EVENT_ID              # paste 3 (or whatever the seeded id is)
vercel env add VITE_ORG_PIN               # paste your organizer PIN
```

The committed `frontend/vercel.json` proxies `/api/*` to the
Fly app, so the FE keeps using same-origin URLs and we never
need CORS.

Deploy:

```bash
vercel --prod
```

Smoke check: visit the Vercel URL, navigate to `/airflow/preview`,
confirm the board renders and the windmill overlay fires on a
full row.

## Recurring deploys

Both Vercel and Fly support GitHub-triggered deploys, but they
are not wired up yet for the eeeclipse fork. For the one-shot
meetup it is fine to deploy manually:

```bash
# BE
cd backend && fly deploy

# FE
cd frontend && vercel --prod
```

Tag `v1.0.0` once both targets pass production smoke (AMB-025
checklist).

## Cost expectation

| Service   | Tier              | Cost for the 1-day event |
|-----------|-------------------|--------------------------|
| Supabase  | Free              | $0 (under 500MB DB)      |
| Fly.io    | Hobby (1 shared-cpu, 512MB) | ~$0 inside free allowance |
| Vercel    | Hobby             | $0                       |

If usage spikes during the meetup, Fly will auto-scale to one
machine since `min_machines_running = 0` + `auto_start_machines
= true`. The first request after idleness incurs a small cold
start (~1s).

# Airflow Meetup Bingo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork `Pseudo-Lab/event-bingo` and customize into Airflow-themed networking bingo for 2026-06-20 meetup (~50 users, 45min session).

**Architecture:** Fork existing Vite+React+TS+MUI+Tailwind frontend and FastAPI+Alembic backend. Stand up new Supabase project (DB + Realtime + Anonymous Auth). Deploy frontend to Vercel. Customize: 4x4 board, 7-keyword selection, anonymous nickname-only login, Airflow theme (teal/dark/windmill logo), server-side 45min cutoff, dynamic keyword pool editing, bingo-line windmill overlay.

**Tech Stack:** React 18, TypeScript, Vite, MUI 5, Emotion, Tailwind 3, Supabase JS, React Router 6, Vitest, Playwright (FE) · FastAPI, SQLAlchemy, Alembic, Python 3.11 (BE) · Supabase Postgres + Realtime + Anonymous Auth · Vercel (FE) · GitHub Actions (CI/CD).

**Spec:** `docs/superpowers/specs/2026-05-11-airflow-meetup-bingo-design.md`

---

## File Structure

**New repo:** `airflow-meetup-bingo` (forked from `Pseudo-Lab/event-bingo`)

**Files to create:**
- `frontend/src/theme/airflow.ts` — MUI theme (teal palette, dark mode defaults)
- `frontend/src/assets/windmill.svg` — Airflow windmill icon
- `frontend/src/assets/logo-wordmark.svg` — "Airflow Meetup Bingo" wordmark
- `frontend/src/components/BingoCell/WindmillOverlay.tsx` — Bingo-line completion visual
- `frontend/src/components/KeywordChip/KeywordChipWithTooltip.tsx` — Cell with hover description
- `frontend/src/data/airflowKeywords.ts` — 30 keyword pool seed with descriptions
- `frontend/src/hooks/useAnonymousAuth.ts` — Supabase anon sign-in + localStorage backup
- `frontend/src/hooks/useServerCountdown.ts` — Server-time-driven countdown
- `frontend/src/lib/bingoLines.ts` — Board line detection (rows/cols/diagonals)
- `frontend/src/lib/leaderboard.ts` — Tiebreak ranking logic
- `frontend/src/modules/Organizer/KeywordPoolEditor.tsx` — Pool add/delete UI
- `backend/app/api/keywords.py` — POST/DELETE `/api/events/{event_id}/keywords`
- `backend/app/api/cutoff.py` — GET `/api/events/{event_id}/cutoff` returning server-time deadline
- `backend/app/scripts/seed_airflow_event.py` — Bootstrap event + 30 keywords
- `backend/app/migrations/versions/<rev>_add_keyword_meta.py` — Alembic migration: `description`, `category` columns
- `backend/app/migrations/versions/<rev>_add_event_cutoff.py` — Alembic migration: `starts_at`, `cutoff_at` columns on events

**Files to modify:**
- `frontend/tailwind.config.js` — Airflow teal palette + font stacks
- `frontend/src/main.tsx` — register MUI ThemeProvider with `airflowTheme`
- `frontend/index.html` — title, favicon, Pretendard + JetBrains Mono links
- `frontend/src/config/game.ts` (or equivalent) — `BOARD_ROWS=4`, `KEYWORDS_TO_PICK=7`, `SESSION_MINUTES=45`
- `frontend/src/modules/Login/Login.tsx` — replace with nickname-only anonymous flow
- `frontend/src/modules/KeywordSelect/KeywordSelect.tsx` — cap selection at 7
- `frontend/src/modules/Game/Board.tsx` — render 4x4 grid with `KeywordChipWithTooltip` + `WindmillOverlay`
- `frontend/src/modules/Game/Header.tsx` — `useServerCountdown` + red pulse <5min
- `frontend/src/modules/Leaderboard/Leaderboard.tsx` — use `rankUsers` tiebreak
- `frontend/src/api/supabase.ts` — new Supabase env vars + anonymous auth init
- `backend/app/managers/exchange_manager.py` (or equivalent) — reject exchange when `now() >= event.cutoff_at`
- `backend/app/models/keyword.py` (or equivalent) — add `description`, `category` fields

**Out of scope per spec §8** — do NOT implement: team mode, multi-device session restore, push notifications, multilang, photo upload, payment, analytics dashboard beyond basic counts.

---

## Phase 0 — Fork, Infra, Deploy Pipeline (D-40 → D-30, target 2026-05-21)

### Task 0.1: Fork repo + local clone

**Files:** new repo `airflow-meetup-bingo`

- [ ] **Step 1: Fork on GitHub**

In browser: `https://github.com/Pseudo-Lab/event-bingo` → Fork → owner `<your-account>` → name `airflow-meetup-bingo`.

- [ ] **Step 2: Clone locally**

```bash
cd ~/Documents_main/90_dev
git clone git@github.com:<your-account>/airflow-meetup-bingo.git
cd airflow-meetup-bingo
```

- [ ] **Step 3: Verify build of unmodified fork**

```bash
cd frontend && npm install && npm run build
cd ../backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

Expected: FE `dist/` produced. BE imports succeed.

- [ ] **Step 4: Commit fork baseline marker**

```bash
git checkout -b feat/airflow-fork-init
git commit --allow-empty -m "chore: init airflow-meetup-bingo fork from event-bingo"
git push -u origin feat/airflow-fork-init
```

### Task 0.2: Provision Supabase project

**Files:** `frontend/.env.local`, `frontend/.env.example`, `backend/.env`, `backend/.env.example`

- [ ] **Step 1: Create Supabase project**

Supabase dashboard → New Project → name `airflow-meetup-bingo-prod` → region `Northeast Asia (Seoul)` → strong DB password (store in password manager).

- [ ] **Step 2: Enable Anonymous Sign-In**

Supabase → Authentication → Providers → Anonymous → toggle on. Save.

- [ ] **Step 3: Add env vars**

```
# frontend/.env.local
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_EVENT_ID=<filled-in-after-seed>
VITE_ORG_PIN=<choose-a-pin>
```

```
# backend/.env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

- [ ] **Step 4: Verify Postgres connectivity**

```bash
cd backend && source .venv/bin/activate
psql "$DATABASE_URL" -c "select version();"
```

Expected: PostgreSQL version printed.

- [ ] **Step 5: Commit `.env.example` (no real secrets)**

```bash
git add frontend/.env.example backend/.env.example
git commit -m "chore: add env templates for new Supabase project"
```

### Task 0.3: Apply baseline schema migrations

**Files:** `backend/SCHEMA_BASELINE.sql`

- [ ] **Step 1: Run alembic upgrade head**

```bash
cd backend && source .venv/bin/activate
alembic upgrade head
```

- [ ] **Step 2: Verify tables**

```bash
psql "$DATABASE_URL" -c "\dt"
```

Expected: `events`, `users`, `exchanges`, and the keyword table (note exact name — may be `keywords` not `keywords_pool`; subsequent tasks reference whichever name is present).

- [ ] **Step 3: Snapshot schema**

```bash
pg_dump --schema-only "$DATABASE_URL" > backend/SCHEMA_BASELINE.sql
git add backend/SCHEMA_BASELINE.sql
git commit -m "chore: snapshot baseline schema after alembic upgrade"
```

### Task 0.4: Configure Vercel deployment

**Files:** none in repo (Vercel UI)

- [ ] **Step 1: Connect repo to Vercel**

Vercel dashboard → New Project → Import `airflow-meetup-bingo` → Root directory `frontend` → Framework Vite → Build cmd `npm run build` → Output `dist`.

- [ ] **Step 2: Add env vars in Vercel**

Settings → Environment Variables → add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_EVENT_ID`, `VITE_ORG_PIN` for Production and Preview.

- [ ] **Step 3: Trigger first deploy**

Push to `main`. Watch Vercel deploy.

- [ ] **Step 4: Smoke**

Visit Vercel URL. Expected: event-bingo default UI renders, no Supabase init errors in console.

### Task 0.5: CI workflow audit

**Files:** `.github/workflows/*.yml`

- [ ] **Step 1: Read existing workflow**

```bash
cat .github/workflows/*.yml
```

Note: secrets used, deploy targets. Replace any hardcoded refs to the old Supabase project.

- [ ] **Step 2: Add required secrets to repo**

GitHub → Settings → Secrets → add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.

- [ ] **Step 3: Run CI on PR**

Open dummy PR. Expected: lint + test + build pass.

- [ ] **Step 4: Commit**

```bash
git commit -am "ci: rewire secrets for airflow fork"
```

---

## Phase 1 — Theme & Branding (D-30 → D-20, target 2026-05-31)

### Task 1.1: Airflow MUI theme

**Files:**
- Create: `frontend/src/theme/airflow.ts`
- Modify: `frontend/src/main.tsx`
- Test: `frontend/src/theme/airflow.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// frontend/src/theme/airflow.test.ts
import { describe, it, expect } from 'vitest';
import { airflowTheme } from './airflow';

describe('airflowTheme', () => {
  it('uses Airflow teal as primary', () => {
    expect(airflowTheme.palette.primary.main).toBe('#017CEE');
  });
  it('defaults to dark mode', () => {
    expect(airflowTheme.palette.mode).toBe('dark');
  });
  it('uses Pretendard for body and JetBrains Mono for monospace', () => {
    expect(airflowTheme.typography.fontFamily).toContain('Pretendard');
    expect((airflowTheme.typography as any).monospace?.fontFamily).toContain('JetBrains Mono');
  });
});
```

- [ ] **Step 2: Run — expect FAIL (module missing)**

```bash
cd frontend && npx vitest run src/theme/airflow.test.ts
```

- [ ] **Step 3: Implement**

```ts
// frontend/src/theme/airflow.ts
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants { monospace: React.CSSProperties; }
  interface TypographyVariantsOptions { monospace?: React.CSSProperties; }
}

export const airflowTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#017CEE' },
    background: { default: '#0B1118', paper: '#121A23' },
  },
  typography: {
    fontFamily: 'Pretendard, system-ui, -apple-system, sans-serif',
    monospace: { fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
  },
});
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Wire into `main.tsx`**

```tsx
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { airflowTheme } from './theme/airflow';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={airflowTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/theme frontend/src/main.tsx
git commit -m "feat(theme): airflow teal dark-mode MUI theme"
```

### Task 1.2: Tailwind palette extension

**Files:**
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 1: Extend theme**

```js
// frontend/tailwind.config.js — add inside theme.extend
module.exports = {
  // ...existing
  theme: {
    extend: {
      colors: {
        'airflow-teal': { 500: '#017CEE', 600: '#0162BE', 400: '#3A99F3' },
        'bg-dark': '#0B1118',
        'bg-paper': '#121A23',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
};
```

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```

Expected: no Tailwind warning, dist built.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(theme): tailwind airflow palette + font stacks"
```

### Task 1.3: Brand assets

**Files:**
- Create: `frontend/src/assets/windmill.svg`, `frontend/src/assets/logo-wordmark.svg`, `frontend/public/favicon.svg`
- Modify: `frontend/index.html`

- [ ] **Step 1: Add windmill SVG**

Save windmill silhouette as `frontend/src/assets/windmill.svg` with `fill="currentColor"` so MUI palette can drive it. (If sourcing from Apache Airflow project assets, confirm Apache-2.0 attribution and add to repo `LICENSE` notice.)

- [ ] **Step 2: Add wordmark**

Generate "Airflow Meetup Bingo" wordmark SVG (Pretendard Bold, teal `#017CEE`). Save as `frontend/src/assets/logo-wordmark.svg`.

- [ ] **Step 3: Replace favicon + load fonts**

```html
<!-- frontend/index.html (modify head) -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<title>Airflow Meetup Bingo</title>
<link rel="preconnect" href="https://cdn.jsdelivr.net" />
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

- [ ] **Step 4: Install `vite-plugin-svgr` for SVG-as-component imports**

```bash
cd frontend && npm i -D vite-plugin-svgr
```

```ts
// frontend/vite.config.ts (add plugin)
import svgr from 'vite-plugin-svgr';
export default defineConfig({
  plugins: [react(), svgr()],
});
```

- [ ] **Step 5: Smoke dev**

```bash
npm run dev
```

Open http://localhost:5173. Expect dark background, teal accents, Pretendard rendering.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/assets frontend/public/favicon.svg frontend/index.html frontend/vite.config.ts frontend/package.json frontend/package-lock.json
git commit -m "feat(brand): windmill + wordmark + fonts + svgr plugin"
```

### Task 1.4: `KeywordChipWithTooltip` component

**Files:**
- Create: `frontend/src/components/KeywordChip/KeywordChipWithTooltip.tsx`
- Test: `frontend/src/components/KeywordChip/KeywordChipWithTooltip.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// KeywordChipWithTooltip.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeywordChipWithTooltip } from './KeywordChipWithTooltip';

it('shows description tooltip on hover', async () => {
  render(<KeywordChipWithTooltip label="KubernetesPodOperator" description="격리 환경 태스크 실행" marked={false} />);
  await userEvent.hover(screen.getByText('KubernetesPodOperator'));
  expect(await screen.findByRole('tooltip')).toHaveTextContent('격리 환경 태스크 실행');
});

it('renders marked styling when marked=true', () => {
  render(<KeywordChipWithTooltip label="DAG" description="Directed Acyclic Graph" marked={true} />);
  const el = screen.getByText('DAG').parentElement!;
  expect(el).toHaveAttribute('data-marked', 'true');
});
```

- [ ] **Step 2: Run — FAIL**

```bash
npx vitest run src/components/KeywordChip/
```

- [ ] **Step 3: Implement**

```tsx
// KeywordChipWithTooltip.tsx
import { Tooltip, Box } from '@mui/material';

export function KeywordChipWithTooltip(
  { label, description, marked, lineComplete }:
  { label: string; description: string; marked: boolean; lineComplete?: boolean; },
) {
  return (
    <Tooltip title={description} arrow>
      <Box
        data-marked={marked ? 'true' : 'false'}
        data-line-complete={lineComplete ? 'true' : 'false'}
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 14,
          textAlign: 'center',
          padding: 1.5,
          borderRadius: 1,
          bgcolor: marked ? 'primary.main' : 'background.paper',
          color: marked ? 'common.white' : 'text.primary',
          transition: 'background-color 200ms ease',
        }}
      >
        {label}
      </Box>
    </Tooltip>
  );
}
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/KeywordChip
git commit -m "feat(ui): KeywordChipWithTooltip"
```

### Task 1.5: `WindmillOverlay` for completed bingo line

**Files:**
- Create: `frontend/src/components/BingoCell/WindmillOverlay.tsx`
- Test: `frontend/src/components/BingoCell/WindmillOverlay.test.tsx`

- [ ] **Step 1: Failing test**

```tsx
// WindmillOverlay.test.tsx
import { render, screen } from '@testing-library/react';
import { WindmillOverlay } from './WindmillOverlay';

it('renders glowing windmill when active', () => {
  render(<WindmillOverlay active />);
  const overlay = screen.getByTestId('windmill-overlay');
  expect(overlay).toHaveAttribute('data-glow', 'true');
});

it('renders nothing when inactive', () => {
  render(<WindmillOverlay active={false} />);
  expect(screen.queryByTestId('windmill-overlay')).toBeNull();
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement**

```tsx
// WindmillOverlay.tsx
import Windmill from '../../assets/windmill.svg?react';
import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';

const glow = keyframes`
  0% { filter: drop-shadow(0 0 0 #017CEE); }
  50% { filter: drop-shadow(0 0 12px #017CEE); }
  100% { filter: drop-shadow(0 0 0 #017CEE); }
`;

export function WindmillOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <Box
      data-testid="windmill-overlay"
      data-glow="true"
      sx={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: `${glow} 1.6s ease-in-out infinite`,
        color: 'primary.main',
        pointerEvents: 'none',
      }}
    >
      <Windmill width="60%" height="60%" />
    </Box>
  );
}
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/BingoCell
git commit -m "feat(ui): WindmillOverlay with glow keyframe"
```

---

## Phase 2 — Feature Customization (D-20 → D-10, target 2026-06-10)

### Task 2.1: 30 keyword seed with descriptions (FE)

**Files:**
- Create: `frontend/src/data/airflowKeywords.ts`
- Test: `frontend/src/data/airflowKeywords.test.ts`

- [ ] **Step 1: Failing test**

```ts
// airflowKeywords.test.ts
import { describe, it, expect } from 'vitest';
import { AIRFLOW_KEYWORDS } from './airflowKeywords';

describe('AIRFLOW_KEYWORDS', () => {
  it('has 30 entries', () => expect(AIRFLOW_KEYWORDS.length).toBe(30));
  it('every label is unique', () => {
    expect(new Set(AIRFLOW_KEYWORDS.map(k => k.label)).size).toBe(30);
  });
  it('every entry has non-empty description and a valid category', () => {
    AIRFLOW_KEYWORDS.forEach(k => {
      expect(k.description.length).toBeGreaterThan(3);
      expect(['operator', 'core', 'executor', 'ops', 'ecosystem']).toContain(k.category);
    });
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement seed**

```ts
// airflowKeywords.ts
export type AirflowKeyword = {
  label: string;
  description: string;
  category: 'operator' | 'core' | 'executor' | 'ops' | 'ecosystem';
};

export const AIRFLOW_KEYWORDS: AirflowKeyword[] = [
  { label: 'PythonOperator', description: '파이썬 함수 실행', category: 'operator' },
  { label: 'BashOperator', description: '쉘 커맨드 실행', category: 'operator' },
  { label: 'KubernetesPodOperator', description: '격리 Pod 안에서 태스크 실행', category: 'operator' },
  { label: 'BigQueryInsertJobOperator', description: 'BigQuery 잡 제출', category: 'operator' },
  { label: 'S3KeySensor', description: 'S3 키 등장 대기', category: 'operator' },
  { label: 'HttpSensor', description: 'HTTP 응답 대기', category: 'operator' },
  { label: 'BranchPythonOperator', description: '조건부 분기 태스크', category: 'operator' },
  { label: 'ShortCircuitOperator', description: '조건 거짓이면 하위 스킵', category: 'operator' },
  { label: 'DAG', description: 'Directed Acyclic Graph', category: 'core' },
  { label: 'XCom', description: '태스크 간 작은 메시지 교환', category: 'core' },
  { label: 'TaskFlow API', description: '데코레이터 기반 DAG 정의', category: 'core' },
  { label: 'TaskGroup', description: 'UI 상 태스크 그룹화', category: 'core' },
  { label: 'Pool', description: '동시 실행 슬롯 제한', category: 'core' },
  { label: 'SLA', description: '태스크 완료 기한', category: 'core' },
  { label: 'Backfill', description: '과거 구간 재실행', category: 'core' },
  { label: 'Dynamic Task Mapping', description: '런타임 태스크 확장', category: 'core' },
  { label: 'CeleryExecutor', description: '워커 분산 실행', category: 'executor' },
  { label: 'KubernetesExecutor', description: 'Pod 단위 실행', category: 'executor' },
  { label: 'LocalExecutor', description: '단일 호스트 멀티프로세스', category: 'executor' },
  { label: 'MWAA', description: 'AWS 매니지드 Airflow', category: 'executor' },
  { label: 'Composer', description: 'GCP 매니지드 Airflow', category: 'executor' },
  { label: 'Astronomer', description: '상용 Airflow 호스팅', category: 'executor' },
  { label: 'on_failure_callback', description: '실패 시 콜백', category: 'ops' },
  { label: 'Trigger Rule', description: '상위 태스크 상태 기반 실행 규칙', category: 'ops' },
  { label: 'Retry/Exponential Backoff', description: '재시도 + 지수 백오프', category: 'ops' },
  { label: '스케줄러 데드락 경험', description: '스케줄러 멈춤 디버깅', category: 'ops' },
  { label: 'Backfill 폭주 경험', description: '잘못된 백필로 인한 부하 폭주', category: 'ops' },
  { label: 'dbt + Airflow', description: 'dbt 잡 오케스트레이션', category: 'ecosystem' },
  { label: 'Datahub Lineage', description: '데이터 리니지 트래킹', category: 'ecosystem' },
  { label: 'Great Expectations', description: '데이터 품질 검증', category: 'ecosystem' },
];
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data
git commit -m "feat(data): 30-keyword airflow pool seed with descriptions"
```

### Task 2.2: BE migration: keyword description/category + event cutoff

**Files:**
- Create: `backend/app/migrations/versions/<rev>_add_keyword_meta.py`
- Create: `backend/app/migrations/versions/<rev>_add_event_cutoff.py`

- [ ] **Step 1: Identify keyword table name**

```bash
cd backend && source .venv/bin/activate
psql "$DATABASE_URL" -c "\dt"
```

Record the actual keyword pool table name. Subsequent steps use `<keyword_table>` placeholder — substitute the real name.

- [ ] **Step 2: Generate migration 1 (keyword meta)**

```bash
alembic revision -m "add description and category to <keyword_table>"
```

Edit generated file:

```python
def upgrade():
    op.add_column('<keyword_table>', sa.Column('description', sa.Text(), nullable=False, server_default=''))
    op.add_column('<keyword_table>', sa.Column('category', sa.String(32), nullable=False, server_default='core'))

def downgrade():
    op.drop_column('<keyword_table>', 'category')
    op.drop_column('<keyword_table>', 'description')
```

- [ ] **Step 3: Generate migration 2 (event cutoff)**

```bash
alembic revision -m "add starts_at and cutoff_at to events"
```

```python
def upgrade():
    op.add_column('events', sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('events', sa.Column('cutoff_at', sa.DateTime(timezone=True), nullable=True))

def downgrade():
    op.drop_column('events', 'cutoff_at')
    op.drop_column('events', 'starts_at')
```

- [ ] **Step 4: Apply both**

```bash
alembic upgrade head
psql "$DATABASE_URL" -c "\d events" -c "\d <keyword_table>"
```

Expected: new columns present.

- [ ] **Step 5: Update SQLAlchemy models**

```python
# backend/app/models/keyword.py (modify class)
description: Mapped[str] = mapped_column(Text, nullable=False, default="")
category: Mapped[str] = mapped_column(String(32), nullable=False, default="core")

# backend/app/models/event.py (modify class)
starts_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
cutoff_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/migrations backend/app/models
git commit -m "feat(db): keyword meta columns + event cutoff columns"
```

### Task 2.3: Seed Airflow event + 30 keywords

**Files:**
- Create: `backend/app/scripts/seed_airflow_event.py`

- [ ] **Step 1: Write seed script**

```python
# backend/app/scripts/seed_airflow_event.py
import os, datetime
from sqlalchemy import create_engine, text

EVENT_NAME = "Airflow Meetup 2026-06-20"
EVENT_DATE = datetime.date(2026, 6, 20)

KEYWORDS = [
    ("PythonOperator", "파이썬 함수 실행", "operator"),
    ("BashOperator", "쉘 커맨드 실행", "operator"),
    ("KubernetesPodOperator", "격리 Pod 안에서 태스크 실행", "operator"),
    ("BigQueryInsertJobOperator", "BigQuery 잡 제출", "operator"),
    ("S3KeySensor", "S3 키 등장 대기", "operator"),
    ("HttpSensor", "HTTP 응답 대기", "operator"),
    ("BranchPythonOperator", "조건부 분기 태스크", "operator"),
    ("ShortCircuitOperator", "조건 거짓이면 하위 스킵", "operator"),
    ("DAG", "Directed Acyclic Graph", "core"),
    ("XCom", "태스크 간 작은 메시지 교환", "core"),
    ("TaskFlow API", "데코레이터 기반 DAG 정의", "core"),
    ("TaskGroup", "UI 상 태스크 그룹화", "core"),
    ("Pool", "동시 실행 슬롯 제한", "core"),
    ("SLA", "태스크 완료 기한", "core"),
    ("Backfill", "과거 구간 재실행", "core"),
    ("Dynamic Task Mapping", "런타임 태스크 확장", "core"),
    ("CeleryExecutor", "워커 분산 실행", "executor"),
    ("KubernetesExecutor", "Pod 단위 실행", "executor"),
    ("LocalExecutor", "단일 호스트 멀티프로세스", "executor"),
    ("MWAA", "AWS 매니지드 Airflow", "executor"),
    ("Composer", "GCP 매니지드 Airflow", "executor"),
    ("Astronomer", "상용 Airflow 호스팅", "executor"),
    ("on_failure_callback", "실패 시 콜백", "ops"),
    ("Trigger Rule", "상위 태스크 상태 기반 실행 규칙", "ops"),
    ("Retry/Exponential Backoff", "재시도 + 지수 백오프", "ops"),
    ("스케줄러 데드락 경험", "스케줄러 멈춤 디버깅", "ops"),
    ("Backfill 폭주 경험", "잘못된 백필로 인한 부하 폭주", "ops"),
    ("dbt + Airflow", "dbt 잡 오케스트레이션", "ecosystem"),
    ("Datahub Lineage", "데이터 리니지 트래킹", "ecosystem"),
    ("Great Expectations", "데이터 품질 검증", "ecosystem"),
]

# Replace <keyword_table> with the actual table name discovered in Task 2.2 Step 1.
KEYWORD_TABLE = "<keyword_table>"

def main():
    engine = create_engine(os.environ["DATABASE_URL"])
    with engine.begin() as conn:
        event_id = conn.execute(
            text("INSERT INTO events (name, date) VALUES (:n, :d) RETURNING id"),
            {"n": EVENT_NAME, "d": EVENT_DATE},
        ).scalar_one()
        for label, desc, cat in KEYWORDS:
            conn.execute(
                text(
                    f"INSERT INTO {KEYWORD_TABLE} (event_id, keyword, description, category)"
                    " VALUES (:e, :k, :desc, :cat)"
                ),
                {"e": event_id, "k": label, "desc": desc, "cat": cat},
            )
        print(f"Seeded event {event_id} with {len(KEYWORDS)} keywords")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run seed**

```bash
DATABASE_URL="$DATABASE_URL" python -m app.scripts.seed_airflow_event
```

Expected: prints "Seeded event <uuid> with 30 keywords".

- [ ] **Step 3: Copy event UUID to `frontend/.env.local` (`VITE_EVENT_ID`) and Vercel env vars.**

- [ ] **Step 4: Commit**

```bash
git add backend/app/scripts
git commit -m "feat(seed): airflow event + 30 keyword bootstrap"
```

### Task 2.4: Anonymous nickname-only login

**Files:**
- Create: `frontend/src/hooks/useAnonymousAuth.ts`
- Modify: `frontend/src/modules/Login/Login.tsx`
- Test: `frontend/src/hooks/useAnonymousAuth.test.ts`

- [ ] **Step 1: Locate existing login module**

```bash
grep -rln "signInWithOAuth\|signInWithPassword\|signIn\(" frontend/src
```

Note the file the router renders for `/` or `/login`.

- [ ] **Step 2: Failing test**

```ts
// useAnonymousAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAnonymousAuth } from './useAnonymousAuth';

vi.mock('../api/supabase', () => ({
  supabase: {
    auth: {
      signInAnonymously: vi.fn().mockResolvedValue({
        data: { user: { id: 'anon-uuid' } }, error: null,
      }),
    },
  },
}));

beforeEach(() => localStorage.clear());

it('stores nickname + user id and returns id', async () => {
  const { result } = renderHook(() => useAnonymousAuth());
  await act(async () => { await result.current.signInAs('jihyun'); });
  expect(localStorage.getItem('amb_nickname')).toBe('jihyun');
  expect(result.current.userId).toBe('anon-uuid');
});
```

- [ ] **Step 3: Run — FAIL**

- [ ] **Step 4: Implement**

```ts
// frontend/src/hooks/useAnonymousAuth.ts
import { useState, useCallback } from 'react';
import { supabase } from '../api/supabase';

const LS_NICK = 'amb_nickname';
const LS_USER = 'amb_user_id';

export function useAnonymousAuth() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem(LS_USER));
  const signInAs = useCallback(async (nickname: string) => {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: { data: { nickname } },
    });
    if (error) throw error;
    const id = data.user!.id;
    localStorage.setItem(LS_NICK, nickname);
    localStorage.setItem(LS_USER, id);
    setUserId(id);
    return id;
  }, []);
  const nickname = localStorage.getItem(LS_NICK);
  return { userId, nickname, signInAs };
}
```

- [ ] **Step 5: Run — PASS**

- [ ] **Step 6: Replace Login UI**

```tsx
// frontend/src/modules/Login/Login.tsx (replace contents)
import { useState } from 'react';
import { Box, TextField, Button, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAnonymousAuth } from '../../hooks/useAnonymousAuth';

export function Login() {
  const [nickname, setNickname] = useState('');
  const { signInAs } = useAnonymousAuth();
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    await signInAs(nickname.trim());
    nav('/keywords');
  };
  return (
    <Box sx={{ maxWidth: 360, mx: 'auto', mt: 8 }}>
      <Typography variant="h4" mb={2}>Airflow Meetup Bingo</Typography>
      <form onSubmit={submit}>
        <TextField
          name="nickname"
          label="닉네임"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          fullWidth
          autoFocus
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>입장</Button>
      </form>
      <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>
        <Link href="/privacy" target="_blank">개인정보 처리 안내</Link>
      </Typography>
    </Box>
  );
}
```

- [ ] **Step 7: Smoke**

```bash
npm run dev
```

Open / → enter nickname → expect navigate to `/keywords`.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/hooks/useAnonymousAuth.ts frontend/src/modules/Login
git commit -m "feat(auth): anonymous nickname-only login with localStorage backup"
```

### Task 2.5: 4x4 board + 7-keyword selection cap

**Files:**
- Create or modify: `frontend/src/config/game.ts`
- Modify: `frontend/src/modules/KeywordSelect/KeywordSelect.tsx`
- Modify: board-generation logic (location discovered in Step 1)

- [ ] **Step 1: Locate existing board-size constant**

```bash
grep -rn "5 \* 5\|BOARD_SIZE\|gridSize\|board_size" frontend/src backend/app
```

- [ ] **Step 2: Add config constants**

```ts
// frontend/src/config/game.ts
export const BOARD_ROWS = 4;
export const BOARD_COLS = 4;
export const BOARD_CELLS = BOARD_ROWS * BOARD_COLS; // 16
export const KEYWORDS_TO_PICK = 7;
export const SESSION_MINUTES = 45;
```

- [ ] **Step 3: Replace hardcoded board-size references with config imports** in all files identified in Step 1.

- [ ] **Step 4: Failing test for pick cap**

```ts
// KeywordSelect.test.ts (new or amend existing)
import { renderHook, act } from '@testing-library/react';
import { useKeywordPick } from './useKeywordPick';

it('caps selection at 7', () => {
  const { result } = renderHook(() => useKeywordPick());
  for (let i = 0; i < 10; i++) act(() => result.current.toggle(`kw${i}`));
  expect(result.current.selected.length).toBe(7);
});
```

- [ ] **Step 5: Implement cap**

```ts
// frontend/src/modules/KeywordSelect/useKeywordPick.ts (new or modify)
import { useState, useCallback } from 'react';
import { KEYWORDS_TO_PICK } from '../../config/game';

export function useKeywordPick() {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = useCallback((kw: string) => {
    setSelected(prev => {
      if (prev.includes(kw)) return prev.filter(x => x !== kw);
      if (prev.length >= KEYWORDS_TO_PICK) return prev;
      return [...prev, kw];
    });
  }, []);
  const isComplete = selected.length === KEYWORDS_TO_PICK;
  return { selected, toggle, isComplete };
}
```

Bind `시작` button `disabled={!isComplete}`.

- [ ] **Step 6: Run tests**

```bash
npx vitest run
```

- [ ] **Step 7: Verify board generation picks `BOARD_CELLS` (16) from pool**

Read the existing board-generation function flagged in Step 1. Confirm it picks exactly `BOARD_CELLS` keywords. If hardcoded to 25, change to `BOARD_CELLS`.

- [ ] **Step 8: Commit**

```bash
git commit -am "feat(game): 4x4 board + 7-keyword pick cap"
```

### Task 2.6: Server cutoff endpoint + reject-on-cutoff

**Files:**
- Create: `backend/app/api/cutoff.py`
- Modify: `backend/app/managers/exchange_manager.py` (or equivalent)
- Test: `backend/app/tests/test_cutoff.py`

- [ ] **Step 1: Failing test**

```python
# backend/app/tests/test_cutoff.py
import datetime, pytest
from app.managers.exchange_manager import create_exchange, CutoffPassed

def test_rejects_exchange_after_cutoff(session, event_after_cutoff, sender, receiver):
    with pytest.raises(CutoffPassed):
        create_exchange(sender.id, receiver.id, event_after_cutoff.id, session=session)
```

Fixture `event_after_cutoff` sets `cutoff_at = now() - 1min`.

- [ ] **Step 2: Run — FAIL**

```bash
pytest backend/app/tests/test_cutoff.py -v
```

- [ ] **Step 3: Implement reject logic**

```python
# backend/app/managers/exchange_manager.py (add at top + modify create_exchange)
from datetime import datetime, timezone
from app.models.event import Event

class CutoffPassed(Exception):
    pass

def create_exchange(sender_id, receiver_id, event_id, *, session):
    ev = session.get(Event, event_id)
    if ev.cutoff_at and datetime.now(timezone.utc) >= ev.cutoff_at:
        raise CutoffPassed(f"event {event_id} cutoff at {ev.cutoff_at}")
    # existing insert path; UNIQUE(sender, receiver, event_id) already enforced by DB
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Add cutoff endpoint**

```python
# backend/app/api/cutoff.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from app.models.event import Event
from app.api.deps import get_session

router = APIRouter()

@router.get("/events/{event_id}/cutoff")
def get_cutoff(event_id: str, session=Depends(get_session)):
    ev = session.get(Event, event_id)
    if not ev:
        raise HTTPException(404)
    return {
        "now": datetime.now(timezone.utc).isoformat(),
        "cutoff_at": ev.cutoff_at.isoformat() if ev.cutoff_at else None,
    }
```

Register in `app/main.py`:

```python
from app.api.cutoff import router as cutoff_router
app.include_router(cutoff_router, prefix="/api")
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/cutoff.py backend/app/managers backend/app/main.py backend/app/tests/test_cutoff.py
git commit -m "feat(timing): server cutoff endpoint + reject-after-cutoff"
```

### Task 2.7: Client `useServerCountdown` hook

**Files:**
- Create: `frontend/src/hooks/useServerCountdown.ts`
- Test: `frontend/src/hooks/useServerCountdown.test.ts`

- [ ] **Step 1: Failing test**

```ts
// useServerCountdown.test.ts
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useServerCountdown } from './useServerCountdown';

beforeEach(() => {
  vi.useFakeTimers().setSystemTime(new Date('2026-06-20T12:00:10Z'));
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ now: '2026-06-20T12:00:00Z', cutoff_at: '2026-06-20T12:45:00Z' }),
  }) as any;
});
afterEach(() => vi.useRealTimers());

it('computes remaining seconds from server time delta', async () => {
  const { result } = renderHook(() => useServerCountdown('event-123'));
  await vi.runAllTimersAsync();
  expect(result.current.remainingSec).toBeLessThanOrEqual(45 * 60 - 10);
  expect(result.current.remainingSec).toBeGreaterThan(45 * 60 - 12);
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement**

```ts
// frontend/src/hooks/useServerCountdown.ts
import { useEffect, useState } from 'react';

export function useServerCountdown(eventId: string) {
  const [remainingSec, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    let driftMs = 0;
    let cutoffMs: number | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    (async () => {
      const res = await fetch(`/api/events/${eventId}/cutoff`).then(r => r.json());
      const serverNow = new Date(res.now).getTime();
      driftMs = serverNow - Date.now();
      cutoffMs = res.cutoff_at ? new Date(res.cutoff_at).getTime() : null;
      const tick = () => {
        if (cancelled || cutoffMs === null) return;
        const left = Math.max(0, Math.floor((cutoffMs - (Date.now() + driftMs)) / 1000));
        setRemaining(left);
      };
      tick();
      timer = setInterval(tick, 1000);
    })();
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [eventId]);
  return { remainingSec };
}
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Wire into game Header**

```tsx
// frontend/src/modules/Game/Header.tsx
import { useServerCountdown } from '../../hooks/useServerCountdown';

export function Header({ eventId, nickname, linesCount }: { eventId: string; nickname: string; linesCount: number }) {
  const { remainingSec } = useServerCountdown(eventId);
  const danger = remainingSec !== null && remainingSec < 300;
  const mm = remainingSec === null ? '--' : String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const ss = remainingSec === null ? '--' : String(remainingSec % 60).padStart(2, '0');
  return (
    <Box display="flex" gap={2} alignItems="center" sx={{
      animation: danger ? 'pulse-red 1s ease-in-out infinite' : 'none',
      '@keyframes pulse-red': { '50%': { color: '#ff5252' } },
    }}>
      <Typography>{nickname}</Typography>
      <Typography variant="h5" fontFamily="monospace">{mm}:{ss}</Typography>
      <Typography>라인 {linesCount}</Typography>
    </Box>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useServerCountdown.ts frontend/src/modules/Game/Header.tsx
git commit -m "feat(timing): drift-aware countdown + red pulse under 5min"
```

### Task 2.8: Bingo line detection lib

**Files:**
- Create: `frontend/src/lib/bingoLines.ts`
- Test: `frontend/src/lib/bingoLines.test.ts`

- [ ] **Step 1: Failing test**

```ts
// bingoLines.test.ts
import { describe, it, expect } from 'vitest';
import { findCompletedLines } from './bingoLines';

describe('findCompletedLines (4x4)', () => {
  it('detects single completed row', () => {
    const marked = new Set([0, 1, 2, 3]);
    expect(findCompletedLines(marked, 4)).toEqual([[0, 1, 2, 3]]);
  });
  it('detects main diagonal', () => {
    const marked = new Set([0, 5, 10, 15]);
    expect(findCompletedLines(marked, 4)).toContainEqual([0, 5, 10, 15]);
  });
  it('detects anti-diagonal', () => {
    const marked = new Set([3, 6, 9, 12]);
    expect(findCompletedLines(marked, 4)).toContainEqual([3, 6, 9, 12]);
  });
  it('returns empty when no line', () => {
    expect(findCompletedLines(new Set([0, 1, 2]), 4)).toEqual([]);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// frontend/src/lib/bingoLines.ts
export function findCompletedLines(marked: Set<number>, size: number): number[][] {
  const lines: number[][] = [];
  for (let r = 0; r < size; r++) {
    const row = Array.from({ length: size }, (_, c) => r * size + c);
    if (row.every(i => marked.has(i))) lines.push(row);
  }
  for (let c = 0; c < size; c++) {
    const col = Array.from({ length: size }, (_, r) => r * size + c);
    if (col.every(i => marked.has(i))) lines.push(col);
  }
  const d1 = Array.from({ length: size }, (_, i) => i * size + i);
  if (d1.every(i => marked.has(i))) lines.push(d1);
  const d2 = Array.from({ length: size }, (_, i) => i * size + (size - 1 - i));
  if (d2.every(i => marked.has(i))) lines.push(d2);
  return lines;
}
```

- [ ] **Step 3: Run — PASS**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/bingoLines.ts
git commit -m "feat(lib): bingo line detection (rows/cols/diagonals)"
```

### Task 2.9: Integrate board with overlay + chips

**Files:**
- Modify: `frontend/src/modules/Game/Board.tsx`

- [ ] **Step 1: Refactor Board**

```tsx
// frontend/src/modules/Game/Board.tsx
import { Box } from '@mui/material';
import { findCompletedLines } from '../../lib/bingoLines';
import { KeywordChipWithTooltip } from '../../components/KeywordChip/KeywordChipWithTooltip';
import { WindmillOverlay } from '../../components/BingoCell/WindmillOverlay';
import { BOARD_ROWS, BOARD_COLS } from '../../config/game';

type Cell = { label: string; description: string };

export function Board({ board, markedIdx }: { board: Cell[]; markedIdx: Set<number> }) {
  const completed = new Set(findCompletedLines(markedIdx, BOARD_ROWS).flat());
  return (
    <Box display="grid" gridTemplateColumns={`repeat(${BOARD_COLS}, 1fr)`} gap={1} data-testid="bingo-board">
      {board.map((cell, idx) => (
        <Box key={idx} position="relative">
          <KeywordChipWithTooltip
            label={cell.label}
            description={cell.description}
            marked={markedIdx.has(idx)}
            lineComplete={completed.has(idx)}
          />
          <WindmillOverlay active={completed.has(idx)} />
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 2: Smoke test in dev**

```bash
npm run dev
```

Use browser devtools to mark a full row via Supabase Studio; verify windmill overlay only appears on completed line cells.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/modules/Game/Board.tsx
git commit -m "feat(game): board integrates chips + windmill overlay"
```

### Task 2.10: Leaderboard tiebreak

**Files:**
- Create: `frontend/src/lib/leaderboard.ts`
- Test: `frontend/src/lib/leaderboard.test.ts`
- Modify: `frontend/src/modules/Leaderboard/Leaderboard.tsx`

- [ ] **Step 1: Failing test**

```ts
// leaderboard.test.ts
import { rankUsers } from './leaderboard';

const u = (id: string, lines: number, cells: number, sumMs: number) => ({ id, lines, cells, sumMs });

it('orders by lines desc, cells desc, sumMs asc', () => {
  const rows = [
    u('a', 2, 8, 1000),
    u('b', 3, 6, 999),
    u('c', 2, 8, 500),
    u('d', 2, 9, 9999),
  ];
  expect(rankUsers(rows).map(r => r.id)).toEqual(['b', 'd', 'c', 'a']);
});
```

- [ ] **Step 2: Implement**

```ts
// frontend/src/lib/leaderboard.ts
export type LBRow = { id: string; lines: number; cells: number; sumMs: number };

export function rankUsers(rows: LBRow[]): LBRow[] {
  return [...rows].sort((x, y) =>
    (y.lines - x.lines) || (y.cells - x.cells) || (x.sumMs - y.sumMs),
  );
}
```

- [ ] **Step 3: Run — PASS**

- [ ] **Step 4: Wire into Leaderboard component**

```tsx
// inside Leaderboard.tsx, replace sort logic with:
import { rankUsers } from '../../lib/leaderboard';
const ranked = rankUsers(rows);
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/leaderboard.ts frontend/src/modules/Leaderboard
git commit -m "feat(leaderboard): tiebreak lines->cells->time"
```

### Task 2.11: Organizer keyword pool editor

**Files:**
- Create: `backend/app/api/keywords.py`
- Create: `frontend/src/modules/Organizer/KeywordPoolEditor.tsx`
- Create: `frontend/src/modules/Organizer/OrganizerGate.tsx`
- Test: `backend/app/tests/test_keywords_api.py`

- [ ] **Step 1: Failing BE test**

```python
# backend/app/tests/test_keywords_api.py
def test_add_keyword_appears_in_pool(client, event):
    r = client.post(
        f"/api/events/{event.id}/keywords",
        json={"keyword": "AirflowREST", "description": "REST API", "category": "core"},
    )
    assert r.status_code == 201
    listing = client.get(f"/api/events/{event.id}/keywords").json()
    assert any(k["keyword"] == "AirflowREST" for k in listing)

def test_delete_keyword(client, event, seeded_keyword):
    r = client.delete(f"/api/events/{event.id}/keywords/{seeded_keyword.id}")
    assert r.status_code == 204
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement endpoints**

```python
# backend/app/api/keywords.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.models.keyword import KeywordPool  # adapt to actual model class
from app.api.deps import get_session

router = APIRouter()

class KeywordIn(BaseModel):
    keyword: str
    description: str = ""
    category: str = "core"

@router.get("/events/{event_id}/keywords")
def list_keywords(event_id: str, session=Depends(get_session)):
    rows = session.query(KeywordPool).filter_by(event_id=event_id).all()
    return [{"id": r.id, "keyword": r.keyword, "description": r.description, "category": r.category} for r in rows]

@router.post("/events/{event_id}/keywords", status_code=201)
def add_keyword(event_id: str, body: KeywordIn, session=Depends(get_session)):
    kw = KeywordPool(event_id=event_id, keyword=body.keyword, description=body.description, category=body.category)
    session.add(kw); session.commit(); session.refresh(kw)
    return {"id": kw.id, "keyword": kw.keyword}

@router.delete("/events/{event_id}/keywords/{keyword_id}", status_code=204)
def delete_keyword(event_id: str, keyword_id: str, session=Depends(get_session)):
    kw = session.get(KeywordPool, keyword_id)
    if not kw or kw.event_id != event_id:
        raise HTTPException(404)
    session.delete(kw); session.commit()
```

Register router in `app/main.py`:

```python
from app.api.keywords import router as keywords_router
app.include_router(keywords_router, prefix="/api")
```

- [ ] **Step 4: Run BE tests — PASS**

- [ ] **Step 5: Implement OrganizerGate (PIN entry)**

```tsx
// frontend/src/modules/Organizer/OrganizerGate.tsx
import { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

export function OrganizerGate({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState('');
  const [ok, setOk] = useState(false);
  if (ok) return <>{children}</>;
  const expected = import.meta.env.VITE_ORG_PIN as string;
  return (
    <Box sx={{ maxWidth: 320, mx: 'auto', mt: 8 }}>
      <TextField label="organizer PIN" type="password" value={pin} onChange={e => setPin(e.target.value)} fullWidth />
      <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => setOk(pin === expected)}>입장</Button>
    </Box>
  );
}
```

- [ ] **Step 6: Implement editor**

```tsx
// frontend/src/modules/Organizer/KeywordPoolEditor.tsx
import { useEffect, useState } from 'react';
import { Box, TextField, Button, List, ListItem, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type Pool = { id: string; keyword: string; description: string; category: string };

export function KeywordPoolEditor({ eventId }: { eventId: string }) {
  const [pool, setPool] = useState<Pool[]>([]);
  const [draft, setDraft] = useState({ keyword: '', description: '', category: 'core' });
  const refresh = () => fetch(`/api/events/${eventId}/keywords`).then(r => r.json()).then(setPool);
  useEffect(() => { refresh(); }, [eventId]);
  const add = async () => {
    await fetch(`/api/events/${eventId}/keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setDraft({ keyword: '', description: '', category: 'core' });
    refresh();
  };
  const remove = async (id: string) => {
    await fetch(`/api/events/${eventId}/keywords/${id}`, { method: 'DELETE' });
    refresh();
  };
  return (
    <Box>
      <Box display="flex" gap={1} mb={2}>
        <TextField label="키워드" value={draft.keyword} onChange={e => setDraft({ ...draft, keyword: e.target.value })} />
        <TextField label="설명" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
        <TextField label="카테고리" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} />
        <Button onClick={add} variant="contained">추가</Button>
      </Box>
      <List>
        {pool.map(k => (
          <ListItem key={k.id} secondaryAction={<IconButton onClick={() => remove(k.id)}><DeleteIcon /></IconButton>}>
            {k.keyword} — {k.description} [{k.category}]
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
```

- [ ] **Step 7: Add route**

```tsx
// frontend/src/App.tsx
import { OrganizerGate } from './modules/Organizer/OrganizerGate';
import { KeywordPoolEditor } from './modules/Organizer/KeywordPoolEditor';
// ...
<Route
  path="/organizer"
  element={
    <OrganizerGate>
      <KeywordPoolEditor eventId={import.meta.env.VITE_EVENT_ID as string} />
    </OrganizerGate>
  }
/>
```

- [ ] **Step 8: Smoke**

```bash
npm run dev
```

Visit `/organizer`, enter PIN, add a test keyword, delete it. Confirm Supabase row mirrors changes.

- [ ] **Step 9: Commit**

```bash
git add backend/app/api/keywords.py backend/app/main.py backend/app/tests/test_keywords_api.py frontend/src/modules/Organizer frontend/src/App.tsx
git commit -m "feat(organizer): keyword pool editor UI + API"
```

---

## Phase 3 — QA & Hardening (D-10 → D-5, target 2026-06-15)

### Task 3.1: E2E happy-path

**Files:**
- Create: `frontend/e2e/networking-bingo.spec.ts`

- [ ] **Step 1: Write E2E**

```ts
// frontend/e2e/networking-bingo.spec.ts
import { test, expect } from '@playwright/test';

test('login → pick 7 → board → exchange marks cells', async ({ page, browser }) => {
  await page.goto('/');
  await page.fill('input[name="nickname"]', 'tester-a');
  await page.click('button:has-text("입장")');
  await expect(page).toHaveURL(/\/keywords/);
  const chips = page.locator('[data-testid="kw-chip"]');
  for (let i = 0; i < 7; i++) await chips.nth(i).click();
  await page.click('button:has-text("시작")');
  await expect(page.locator('[data-testid="bingo-board"]')).toBeVisible();
  const code = await page.locator('[data-testid="my-share-code"]').textContent();

  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await p2.goto('/');
  await p2.fill('input[name="nickname"]', 'tester-b');
  await p2.click('button:has-text("입장")');
  const chips2 = p2.locator('[data-testid="kw-chip"]');
  for (let i = 0; i < 7; i++) await chips2.nth(i).click();
  await p2.click('button:has-text("시작")');
  await p2.fill('input[name="partner-code"]', code!.trim());
  await p2.click('button:has-text("전송")');

  await page.reload();
  const markedCount = await page.locator('[data-marked="true"]').count();
  expect(markedCount).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run**

```bash
cd frontend && npx playwright test e2e/networking-bingo.spec.ts
```

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/networking-bingo.spec.ts
git commit -m "test(e2e): nickname → pick → exchange → mark"
```

### Task 3.2: 50-VU load smoke

**Files:**
- Create: `scripts/load_test.k6.js`

- [ ] **Step 1: Write k6 script**

```js
// scripts/load_test.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 50, duration: '60s' };

export default function () {
  const r = http.get(`${__ENV.BASE_URL}/api/events/${__ENV.EVENT_ID}/cutoff`);
  check(r, { 'status 200': res => res.status === 200, 'p95 ok': res => res.timings.duration < 500 });
  sleep(1);
}
```

- [ ] **Step 2: Run against preview**

```bash
BASE_URL=https://airflow-meetup-bingo-preview.vercel.app EVENT_ID=<uuid> k6 run scripts/load_test.k6.js
```

Expected: p95 < 500ms, error rate 0.

- [ ] **Step 3: Realtime concurrency check**

Write a Playwright script that opens 50 concurrent contexts subscribing to leaderboard channel; send 10 exchanges across pairs; verify all 50 contexts observe the broadcasts. (Add as `scripts/realtime_concurrency.spec.ts`.)

- [ ] **Step 4: Commit**

```bash
git add scripts/load_test.k6.js
git commit -m "test(load): 50-VU smoke on cutoff endpoint"
```

### Task 3.3: Mobile QA matrix

- [ ] **Step 1: Run Playwright mobile profiles**

```bash
npx playwright test --project="Mobile Safari" --project="Mobile Chrome"
```

- [ ] **Step 2: Manual device test** — login, pick, exchange, leaderboard on real iOS Safari + Android Chrome.

- [ ] **Step 3: File any breakages as GitHub issues; fix inline before rehearsal.**

### Task 3.4: Internal 5-person rehearsal

- [ ] **Step 1: Schedule 30min rehearsal on a staging event with 45min cutoff_at.**

- [ ] **Step 2: Capture issues to GitHub; fix in D-5..D-1 window.**

- [ ] **Step 3: Delete rehearsal data**

```bash
psql "$DATABASE_URL" -c "DELETE FROM exchanges WHERE event_id='<rehearsal-uuid>'; DELETE FROM users WHERE event_id='<rehearsal-uuid>'; DELETE FROM events WHERE id='<rehearsal-uuid>';"
```

---

## Phase 4 — Launch Prep (D-5 → D-day, 6/15 → 6/20)

### Task 4.1: Final keyword pool sign-off

- [ ] Visit `/organizer`, confirm 30 keywords match spec §5.

### Task 4.2: Set production event cutoff

- [ ] Run SQL:

```sql
UPDATE events
SET starts_at = '2026-06-20T19:00:00+09:00',
    cutoff_at = '2026-06-20T19:45:00+09:00'
WHERE id = '<prod-event-uuid>';
```

(Adjust start time to actual meetup networking-session slot.)

### Task 4.3: Production smoke

- [ ] Run E2E against prod URL with `BASE_URL=https://<prod>.vercel.app`.

- [ ] Clean throwaway users:

```sql
DELETE FROM exchanges WHERE sender_id IN (SELECT id FROM users WHERE nickname LIKE 'smoke-%');
DELETE FROM users WHERE nickname LIKE 'smoke-%';
```

### Task 4.4: QR + short URL

- [ ] Generate short URL (Bitly or `vercel.app` short alias).

- [ ] Generate QR PNG, embed in A4 PDF for on-site signage.

### Task 4.5: Freeze + on-site checklist

- [ ] Tag `v1.0.0` and protect `main`.

```bash
git tag v1.0.0 && git push origin v1.0.0
```

- [ ] On-site checklist (printed):
  - Vercel deploy green
  - `events.cutoff_at` correct
  - QR loads on phone
  - MC script: rules in 60s, point to QR, timer starts on `now()` ≥ `starts_at`

### Task 4.6: Post-event data export

- [ ] Export to CSV:

```bash
psql "$DATABASE_URL" -c "\copy (SELECT * FROM exchanges WHERE event_id='<uuid>') TO 'exchanges.csv' CSV HEADER"
psql "$DATABASE_URL" -c "\copy (SELECT id, nickname, board_layout, keywords FROM users WHERE event_id='<uuid>') TO 'users.csv' CSV HEADER"
```

- [ ] Archive CSV + final leaderboard screenshot to `docs/reports/2026-06-20-airflow-meetup-bingo.md`.

---

## Self-Review Notes

**Spec coverage:**

- §2 Game Rules → Task 2.5 (4x4 + 7-pick), Task 2.6 (cutoff reject) + Task 2.7 (countdown), Task 2.8 (lines), Task 2.10 (tiebreak)
- §3.1 Stack → Phase 0
- §3.2 Auth → Task 2.4
- §3.3 Data Model → Tasks 0.3 (baseline), 2.2 (meta + cutoff columns)
- §3.4 Realtime → existing event-bingo Realtime subs reused; verified in Tasks 3.1 + 3.2 (no new code unless reconnect missing — fall-through note below)
- §4.1–4.3 UI/Theme → Tasks 1.1–1.5, Task 2.9
- §5 Keyword Pool → Tasks 2.1, 2.3; §5.1 dynamic editing → Task 2.11
- §6 Operations → Phases 0–4 timeline
- §7 Done Criteria → fully covered across Phases 0–4
- §9 Risks → mitigations: localStorage backup (Task 2.4), UNIQUE constraint (existing schema in Task 0.3), server cutoff (Task 2.6), drift-aware countdown (Task 2.7), category data for post-event analysis (Task 2.2)

**Open assumption — Realtime reconnect:** event-bingo's Supabase client is assumed to handle reconnect. Verify during Task 3.1 E2E by toggling network. If reconnect is missing, add a follow-up task in Phase 3 to wire `supabase.realtime.connect()` retry on `CHANNEL_ERROR` events.

**Open assumption — keyword table name:** event-bingo's keyword pool table may be named `keywords` rather than `keywords_pool`. Tasks 2.2, 2.3, 2.11 explicitly flag this via the `<keyword_table>` placeholder discovered in Task 2.2 Step 1.

**Open assumption — share code field:** Plan assumes existing `users.share_code` column (or equivalent). If absent in baseline schema, add column + generator in a new Phase 2 sub-task before Task 2.4.

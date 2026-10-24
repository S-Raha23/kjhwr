# 03 — Architecture

## 1. Overview

```
            ┌──────────────────────── Docker image (Heroku web dyno) ───────────────────────┐
Browser ──► │  FastAPI (uvicorn, $PORT)                                                       │
            │   ├── /api/*            JSON analytics endpoints                                │
            │   └── /*                static React build (Vite dist/), SPA fallback → index   │
            │                                                                                  │
            │  SnapshotStore (in-memory pandas, loaded at startup from snapshot/*.parquet)    │
            │   ▲                                                                              │
            │   └── refresh: elexon client → validate → atomically swap + write parquet       │
            └─────────────────────────────────────────────────┬────────────────────────────────┘
                                                              │ (only on refresh / ingest CLI)
                                                              ▼
                                              data.elexon.co.uk/bmrs/api/v1
```

- **One process, one container, deployed on Heroku only.** About 20k forecast rows and 1.6k actual rows, so pandas in memory is ample. No database server.
- **Snapshot-first:** `backend/snapshot/actuals.parquet`, `backend/snapshot/forecasts.parquet` and `backend/snapshot/snapshot_meta.json` are committed. The app starts without network access.
- **Refresh:** `python -m app.data.ingest` (CLI, rewrites the snapshot files) or `POST /api/admin/refresh` with the `X-Admin-Token` header (memory only). Heroku's filesystem is ephemeral, so a refresh on Heroku updates memory, not the committed snapshot. That is fine.

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | Python 3.12, FastAPI, uvicorn, pandas, pyarrow, httpx, pydantic v2 | `pydantic-settings` for config |
| Frontend | React 18 + TypeScript (strict) + Vite | |
| Charts | **Recharts** | Simple, declarative, good enough for time series + bars |
| Data fetching | TanStack Query | Caching, loading/error states |
| Styling | Tailwind CSS | Fast, consistent |
| Dates | `date-fns` + `date-fns-tz` | Display in Europe/London |
| Tests | pytest (+ FastAPI TestClient), vitest + React Testing Library | |
| Lint/format | ruff (lint + format), mypy (backend), eslint, prettier | |
| CI | GitHub Actions: backend lint+type+test, frontend lint+test+build, docker build | |
| Container | Multi-stage Dockerfile (node:20-alpine → python:3.12-slim) | |
| Deploy | **Heroku** container stack via `heroku.yml` | No other host |

## 3. Repository layout

Create exactly this structure. Do not add top-level folders without a reason recorded in the README.

```
<random-repo-name>/
├── README.md
├── CLAUDE.md                          # agent instructions (keep; documents AI usage)
├── docs/                              # spec files (this folder) + img/ screenshots
├── Dockerfile
├── heroku.yml
├── docker-compose.yml                 # local dev: backend + vite dev server
├── Makefile                           # dev, test, lint, ingest, docker-build, docker-run
├── .github/workflows/ci.yml
├── .gitignore  .dockerignore  .editorconfig
│
├── backend/
│   ├── pyproject.toml                 # deps, ruff, mypy, pytest config
│   ├── snapshot/                      # committed data snapshot (NOT code)
│   │   ├── actuals.parquet
│   │   ├── forecasts.parquet
│   │   └── snapshot_meta.json
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # create_app(): routers, static mount, SPA fallback, lifespan
│   │   │
│   │   ├── core/                      # cross-cutting, no business logic
│   │   │   ├── config.py              # Settings (env vars) + domain constants (period, cutoff, tz)
│   │   │   ├── logging.py             # logging setup
│   │   │   └── errors.py              # domain exceptions (DataUnavailableError, IngestValidationError)
│   │   │
│   │   ├── data/                      # everything that touches external data or disk
│   │   │   ├── elexon_client.py       # HTTP client: fetch_actuals(), fetch_forecasts() (chunked, retries)
│   │   │   ├── transform.py           # raw JSON → typed DataFrames, dedupe
│   │   │   ├── validation.py          # snapshot validation rules (§5)
│   │   │   ├── snapshot_store.py      # SnapshotStore: load/save parquet, versioned atomic swap
│   │   │   └── ingest.py              # CLI entry: python -m app.data.ingest
│   │   │
│   │   ├── analytics/                 # PURE functions: DataFrames in → DataFrames/dataclasses out
│   │   │   ├── period.py              # delivery-day window, London cutoff computation
│   │   │   ├── selection.py           # select_at_cutoff(), select_at_horizon()  ← core logic
│   │   │   ├── alignment.py           # join forecasts ↔ actuals, error column
│   │   │   ├── metrics.py             # summary, by_hour, by_day, histogram
│   │   │   ├── horizon_curve.py       # accuracy vs lead time
│   │   │   └── bands.py               # empirical P10/P90 error bands
│   │   │
│   │   ├── services/                  # orchestration: store + analytics + caching
│   │   │   └── analysis_service.py    # AnalysisService: series(), metrics(), horizon_curve(), day()
│   │   │
│   │   ├── api/                       # HTTP layer only: parse, validate, call service, serialise
│   │   │   ├── deps.py                # FastAPI dependencies (get_service, query-param model, admin auth)
│   │   │   ├── schemas.py             # pydantic request/response models
│   │   │   └── routes/
│   │   │       ├── health.py          # /api/health, /api/meta
│   │   │       ├── analysis.py        # /api/series, /api/metrics, /api/horizon-curve, /api/day
│   │   │       └── admin.py           # /api/admin/refresh
│   │   │
│   │   └── static/                    # React build copied here in Docker (gitignored)
│   │
│   └── tests/                         # mirrors app/ structure
│       ├── conftest.py                # synthetic fixtures + real-snapshot fixture
│       ├── data/        test_transform.py  test_validation.py  test_elexon_client.py
│       ├── analytics/   test_period.py  test_selection.py  test_metrics.py  test_bands.py
│       │                test_reference.py      # reproduces docs/04 §6 on the real snapshot
│       └── api/         test_routes.py
│
└── frontend/
    ├── package.json  vite.config.ts  tsconfig.json  tailwind.config.ts  eslint.config.js
    ├── index.html
    └── src/
        ├── main.tsx                   # providers (QueryClient, BrowserRouter)
        ├── App.tsx                    # route table only
        ├── pages/                     # composition layer: wires hooks to features
        │   ├── StoryPage.tsx  ExplorePage.tsx  MethodPage.tsx  NotFoundPage.tsx
        │   └── story/                 # one component per story chapter (Decision … Desk)
        ├── api/
        │   ├── client.ts              # fetch wrapper, ApiError
        │   ├── endpoints.ts           # getSeries(), getMetrics(), getHorizonCurve(), getDay(), getMeta()
        │   └── types.ts               # TS types mirroring backend schemas
        ├── hooks/                     # TanStack Query hooks (one per endpoint) + UI hooks
        │   └── useSeries.ts  useMetrics.ts  useHorizonCurve.ts  useDay.ts  useMeta.ts
        │       useInView.ts  useReducedMotion.ts  useScrollProgress.ts
        ├── state/
        │   └── useFilters.ts          # URL-synced explorer filters: start, end, mode, horizonH, day
        ├── features/                  # presentational feature folders (never import each other)
        │   ├── layout/                SiteNav.tsx  SiteFooter.tsx  SiteLayout.tsx
        │   ├── story/                 Hero.tsx  DecisionTimeline.tsx  DayStrip.tsx  DeskTakeaways.tsx  facts.ts
        │   ├── method/                MethodContent.tsx
        │   ├── controls/              Controls.tsx  DateRangePicker.tsx  HorizonSlider.tsx  presets.ts
        │   ├── kpis/                  KpiTiles.tsx  InsightStrip.tsx  insights.ts
        │   ├── timeseries/            ForecastVsActualChart.tsx  ErrorChart.tsx
        │   ├── day-decision/          DayView.tsx
        │   ├── horizon/               HorizonCurveChart.tsx
        │   ├── patterns/              ErrorByHourChart.tsx  ErrorHistogram.tsx
        │   └── daily-table/           DailyTable.tsx
        ├── components/ui/             # generic, feature-agnostic: Card, Chapter, Callout, StatBlock,
        │                              # Reveal, CountUp, Skeleton, ErrorState, EmptyState, InfoTooltip, QueryState
        ├── lib/
        │   ├── format.ts              # MW/GW, %, London-time formatting
        │   ├── chartTheme.ts          # series colours, error colours, axis defaults
        │   ├── chartTicks.ts  rank.ts
        │   └── constants.ts           # period bounds, horizon range, routes, data sources
        └── test/                      # vitest setup; *.test.ts(x) live next to the file they test
```

## 3a. Code organisation rules (mandatory)

The reviewer is a tech lead. The structure must read as deliberate, not accreted.

**Backend dependency direction:** `api → services → analytics` and `services → data`; `core` is importable by all.
- `analytics/` imports only pandas/numpy/stdlib and `core`. **No FastAPI, no I/O, no global state.** Every function is deterministic and unit-testable.
- `api/` contains no pandas logic. Routes are 3–10 lines: take validated params, call the service, return a schema.
- `data/` is the only package that does HTTP or file I/O.
- `services/` is the only place that combines the store with analytics and owns caching.

**Frontend:**
- `pages/` is the composition layer: it calls hooks and wires data into features. Features are presentational and take data as props.
- Components never call `fetch` directly; they use hooks from `hooks/`. Hooks use `api/endpoints.ts`.
- No metric computation in the frontend. The backend computes, the frontend formats and draws.
- Feature components may import from `components/ui`, `lib`, `hooks`, `state`. A feature never imports another feature (`pages/` compose them).
- Colours and formatting come only from `lib/chartTheme.ts` and `lib/format.ts`. No inline hex codes or ad-hoc `toFixed` in components.

**General:**
- One responsibility per module. Soft limit ~200 lines per file and ~40 lines per function; split when exceeded.
- No magic numbers or strings: the period, cutoff (11:00), timezone, horizon range, bin width, and band buckets live in `core/config.py` (backend) and `lib/constants.ts` (frontend).
- Full type hints (mypy clean) and strict TypeScript. No `any` unless commented why.
- Naming: `snake_case` Python modules/functions, `PascalCase` React components and their files, `camelCase` hooks prefixed `use`.
- Docstrings on public analytics functions explaining *what* and the rule implemented (e.g. leakage rule); no comments restating code.
- No dead code, commented-out code, `print` debugging, or TODOs left in committed code.
- Tests mirror the source tree.

## 4. API contract

All responses are JSON. All timestamps are ISO-8601 UTC with a `Z` suffix. MW values are numbers (floats allowed).

Common query parameters (the frontend sends these on every analysis call):

| Param | Type | Default | Notes |
|---|---|---|---|
| `start` | date `YYYY-MM-DD` | `2026-01-02` | first delivery day (London), clamped to period |
| `end` | date `YYYY-MM-DD` | `2026-02-01` | last delivery day **inclusive**, clamped |
| `mode` | `cutoff` \| `horizon` | `cutoff` | selection rule (docs/04 §2) |
| `horizon_h` | int 0–48 | `24` | used only when `mode=horizon` |

Validation: return 422 for `start > end`, bad mode, or a horizon out of range. Clamp dates silently to the period and echo the effective values in `meta`.

### `GET /api/health`
`{"status":"ok","data_loaded":true,"snapshot_fetched_at":"…Z"}`

### `GET /api/meta`
```json
{
  "period": {"start":"2026-01-02","end":"2026-02-01","timezone":"Europe/London"},
  "decision_cutoff_local": "11:00",
  "horizon_range_h": [0, 48],
  "counts": {"actual_rows": 1632, "forecast_rows": 20440, "forecast_runs": 280},
  "snapshot_fetched_at": "2026-10-23T23:59:00Z",
  "source": "Elexon BMRS FUELHH (WIND) and WINDFOR"
}
```

### `GET /api/series?start&end&mode&horizon_h`
The main time series. One point per **half hour** of actuals; forecast fields are null at :30.
```json
{
  "meta": {"start":"2026-01-02","end":"2026-02-01","mode":"cutoff","horizon_h":null},
  "points": [
    {"t":"2026-01-02T00:00:00Z","actual":13756,"forecast":15020,
     "forecast_published":"2026-01-01T09:30:00Z","horizon_h":14.5,"error":1264}
  ]
}
```

### `GET /api/metrics?start&end&mode&horizon_h`
```json
{
  "meta": {...},
  "summary": {"n":744,"mae":1995.6,"rmse":2498.8,"bias":1728.0,"wape_pct":17.68,
              "p50_abs":…, "p90_abs":4183.9,"max_abs":6857,"p10_signed":-502.7,"p90_signed":4183.9,
              "mean_actual":…, "share_over_forecast_pct":…},
  "by_hour": [{"hour_local":0,"mae":…,"bias":…,"n":…}, …],          // 24 rows, London hour
  "by_day":  [{"day":"2026-01-02","mae":…,"bias":…,"wape_pct":…,"forecast_published":"…Z",
               "actual_mwh":…,"forecast_mwh":…}, …],
  "histogram": {"bin_edges":[…], "counts":[…]}                     // signed error, 500 MW bins
}
```

### `GET /api/horizon-curve?start&end`
Accuracy against lead time; it ignores `mode`.
```json
{"points":[{"horizon_h":0,"n":744,"mae":1679.9,"rmse":…,"bias":…,"wape_pct":…,"coverage_pct":100.0}, …]}  // h = 0..48 step 1
```

### `GET /api/day?date=YYYY-MM-DD`
The decision panel for one delivery day, in cutoff mode.
```json
{
  "date":"2026-01-15",
  "decision_time":"2026-01-14T11:00:00Z",
  "forecast_published":"2026-01-14T09:30:00Z",
  "points":[{"t":"…Z","forecast":…,"actual":…,"band_p10":…,"band_p90":…}],
  "totals":{"forecast_mwh":…,"actual_mwh":…,"error_mwh":…,"error_pct":…}
}
```
`band_p10` / `band_p90`: the plausible range for **actual** wind given the forecast,
built from empirical errors (docs/04 §5).

### `POST /api/admin/refresh`
Requires the `X-Admin-Token` header to equal `ADMIN_TOKEN` (401 otherwise). If `ADMIN_TOKEN` is unset, return 404.
Re-fetches both datasets, validates them (§5), swaps them in atomically, and returns the new counts. On any failure it returns 502 and keeps the old data.

## 5. Data validation (ingest)

Fail the ingest (and keep the old snapshot) if:
- the actuals in the period have fewer than 95 % of the expected half-hours;
- any delivery day in the period has no forecast run before its 11:00 D-1 cutoff;
- any value is null, or `generation` is outside 0 … 30,000 MW.

Log the warnings: duplicate keys (dedupe and keep the last `publishTime` for actuals), unexpected minutes.

## 6. Configuration (env vars)

| Var | Default | Purpose |
|---|---|---|
| `PORT` | 8000 | Heroku injects it |
| `ADMIN_TOKEN` | unset | enables the refresh endpoint |
| `SNAPSHOT_DIR` | `backend/snapshot` (resolved relative to the package) | parquet location |
| `CORS_ORIGINS` | `http://localhost:5173` | dev only; same-origin in prod |
| `LOG_LEVEL` | `INFO` | |

## 7. Cross-cutting

- **Caching:** analytics are pure functions of (params, data version). `AnalysisService` caches results in an LRU keyed on (params, `store.version`). Set `Cache-Control: public, max-age=300` on `/api/*` GETs.
- **Logging:** structured one-line logs; log ingest counts and timing.
- **Errors:** domain exceptions from `core/errors.py` are mapped to HTTP codes in one exception handler in `main.py`. The frontend shows a friendly card with a retry button. The backend never leaks stack traces.
- **Performance budget:** each analytics endpoint must respond in < 300 ms warm on a Heroku Eco dyno.

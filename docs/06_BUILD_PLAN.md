# 06 — Build plan

Work strictly in order. At the end of each stage: all its checks pass, then
`git commit -m "stage N: <summary> (<key metric if any>)"`. The hour estimates
add up to about 12.5 h, which leaves room inside the brief's 16-hour cap.

## Stage 0 — Scaffolding (≈ 1 h)

- `git init`, `.gitignore` (node_modules, dist, `__pycache__`, `.venv`, `backend/app/static`, `.env`,
  and **`REint Full Stack SWE challenge v4 Shared.md`**, so the brief itself is not published).
- `backend/pyproject.toml` with the deps from docs/03 §2, ruff, mypy, and pytest config. `frontend/` via `npm create vite@latest -- --template react-ts`, plus Tailwind, Recharts, TanStack Query, date-fns(-tz), eslint, prettier, and vitest.
- Create the **full folder skeleton from docs/03 §3** (packages with `__init__.py`, empty feature folders), `Makefile`, and `.editorconfig`.
- `app/core/config.py` with settings + domain constants; `app/main.py` (`create_app()`) with `/api/health` returning `ok`.

**Check:** `uvicorn app.main:app` serves `/api/health`; `npm run dev` shows the Vite page; `make lint` and `make test` run (even if empty); `tree` output matches docs/03 §3.

## Stage 1 — Data ingest + snapshot (≈ 1.5 h)

- `app/data/elexon_client.py`: an httpx client with timeout 30 s, 3 retries with exponential backoff, and 7-day chunking. Use the parameters exactly as in docs/02.
- `app/data/transform.py` (raw JSON → typed DataFrames: UTC datetimes, float MW, dedupe) and `app/data/validation.py` (docs/03 §5).
- `app/data/ingest.py` (`python -m app.data.ingest`): fetch → transform → validate → write `backend/snapshot/*.parquet` + `snapshot_meta.json` (fetched_at, counts).
- Run it and commit the snapshot files.
- `app/data/snapshot_store.py`: load at startup (FastAPI lifespan) and expose `actuals`, `forecasts`, `version`, and `fetched_at`.
- Tests: `tests/data/` (transform, validation, client with mocked HTTP).

**Check:** the counts match docs/02 (FUELHH ~1,632 rows for the window; WINDFOR ~19,856 rows / 272 runs). `GET /api/meta` returns them.

## Stage 2 — Analytics core (≈ 2.5 h) — the most important stage

- `app/analytics/`: `period.py`, `selection.py`, `alignment.py`, `metrics.py`, `horizon_curve.py`, `bands.py` as specified in docs/04. Pure functions only (docs/03 §3a).
- `tests/analytics/`: all of the tests in docs/04 §2c, plus `test_metrics.py` (hand-computed small fixture), `test_bands.py`, and `test_reference.py`.

**Check:** `pytest` is green, **including `test_reference.py` reproducing docs/04 §6** within tolerance. Put the cutoff-mode MAE in the commit message.

## Stage 3 — API layer (≈ 1 h)

- `app/services/analysis_service.py` (store + analytics + LRU cache), then `app/api/` (`deps.py`, `schemas.py`, `routes/health.py`, `routes/analysis.py`, `routes/admin.py`) per docs/03 §4, including validation, clamping, and the admin refresh. Domain-exception → HTTP mapping in `main.py`.
- `tests/api/test_routes.py`: each endpoint returns 200 with the expected shape; 422 cases; refresh returns 401/404 without a token and keeps the old data when the fetch fails (mock httpx).

**Check:** `pytest` is green. Read `http://localhost:8000/docs` (the OpenAPI page) and confirm it matches docs/03.

## Stage 4 — Frontend (≈ 4 h)

Build in this order, so a demo-able app exists early:
1. `api/` (client, endpoints, types) + `hooks/` + `state/useFilters.ts` + `lib/` (format, chartTheme, constants) + `components/ui/`.
2. Header, Controls, KPI tiles, chart ① Forecast vs Actual. *(This is the MVP. Commit here.)*
3. ② the error chart, ④ the horizon curve, ③ the day decision panel with the band.
4. ⑤ by-hour, ⑥ histogram, ⑦ daily table, the insight strip, the methodology drawer.
5. Loading/error/empty states and the responsive pass.

**Check:** the KPI tiles in the default view show MAE ≈ 2.00 GW and bias ≈ +1.73 GW. Switching to horizon mode at 0 h shows MAE ≈ 1.68 GW. The vitest suite is green. There are no console errors.

## Stage 5 — Docker + CI (≈ 1 h)

- A multi-stage `Dockerfile` (see docs/07 §1) and `docker-compose.yml` for local dev.
- `.github/workflows/ci.yml`: the jobs `backend` (ruff, pytest), `frontend` (lint, test, build), and `docker` (build only).

**Check:** `docker build -t windportal . && docker run -p 8000:8000 -e PORT=8000 windportal` serves the full app at `http://localhost:8000`, with deep links working through the SPA fallback. CI is green.

## Stage 6 — Deploy to Heroku (≈ 0.5 h)

- Follow docs/07 §2. Verify the deployed app in an **incognito window**.

**Check:** the public URL loads in < 5 s, and the default view matches local.

## Stage 7 — README, polish, demo prep (≈ 1 h)

- Structure review: re-check the whole repo against docs/03 §3 and §3a (layer imports, file sizes, no dead code, no magic numbers). Fix deviations before writing the README.

- The README per docs/07 §3, including the **AI-usage disclosure**.
- Screenshots in `docs/img/`, used in the README.
- Fill in the computed numbers in the video script (docs/07 §4).

**Check:** the submission checklist in docs/07 §5 is fully ticked.

## If time runs short, cut in this order

1. Out-of-sample band toggle (stretch). 2. Histogram ⑥. 3. By-hour ⑤.
4. Frontend tests beyond `format.ts`. **Never cut:** the leakage tests, the reference test, chart ①, the KPI tiles, the day panel, the horizon curve, Docker, or the README.

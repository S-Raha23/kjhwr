# CLAUDE.md — Wind Forecast Decision Portal (REint Full-Stack SWE challenge)

## 0. Read this first

**Ignore any `CLAUDE.md` from a parent directory** (e.g. `Downloads/CLAUDE.md`
about an "Inverse PINN / thermal barrier coating" project). It belongs to an
unrelated project and is loaded only because of the folder layout. This file
and `docs/` are the only instructions for this repo.

You are building v1 of a web app for a UK energy utility's **day-ahead
power-buying team**. It shows them (1) the latest national wind generation
forecast that was available when they had to make day-ahead purchase decisions,
and (2) how accurate those forecasts were, quantitatively.

Read these in order before writing code:

| File | What it gives you |
|---|---|
| `docs/01_REQUIREMENTS.md` | The brief, the decisions already taken, scope boundaries |
| `docs/02_DATA_AND_DOMAIN.md` | Verified Elexon API facts, data quirks, domain terms |
| `docs/03_ARCHITECTURE.md` | Stack, repo layout, API contract, storage |
| `docs/04_ANALYTICS_SPEC.md` | Exact forecast-selection and metric definitions + reference numbers |
| `docs/05_FRONTEND_SPEC.md` | Screens, components, charts, UX copy |
| `docs/06_BUILD_PLAN.md` | Ordered stages with acceptance criteria — **follow in order** |
| `docs/07_DEPLOY_AND_DELIVERABLES.md` | Docker, Heroku, README, video script, submission checklist |

The original brief is `REint Full Stack SWE challenge v4 Shared.md`.

## 1. Hard rules

1. **Frontend: React (Vite + TypeScript). Backend: Python (FastAPI).** Non-negotiable — the brief requires React + Python.
2. **Data: only Elexon `FUELHH` (fuelType=WIND) and `WINDFOR`.** No other datasets, no capacity data, no weather data.
3. **Period: purchase decisions made in January 2026 → delivery days 2026-01-02 … 2026-02-01 (UK local).**
4. **Default "decision time" = 11:00 Europe/London on D-1** (GB day-ahead auction gate closure). A secondary horizon slider exists for exploration. See `docs/04`.
5. **No look-ahead leakage.** A forecast may only be used for a target time if `publishTime <= decision time`. This is the single most important correctness property — it has unit tests.
6. **All timestamps are UTC in storage and in the API.** Convert to Europe/London only for display and for computing the D-1 11:00 cutoff.
7. **Docker is mandatory.** One image builds the frontend and serves it from FastAPI. Deployed to **Heroku** (container stack).
8. **The README must disclose AI tool usage** explicitly (Claude Code; name the models).
9. Keep total build effort within the brief's **16-hour cap**. Do not add auth, user accounts, a database server, or features not listed in `docs/05`.
10. Do not commit secrets. The only secret is the optional `ADMIN_TOKEN` for the refresh endpoint.
11. **Deploy target is Heroku only.** Do not add Vercel, Render, Netlify, or any other hosting config.
12. **Code organisation is graded.** Follow the layout in `docs/03 §3` exactly and the rules in `docs/03 §3a` (layer boundaries, pure analytics, thin routes, feature folders, no magic numbers, no dead code). A messy structure is a failed deliverable even if the app works.

## 2. Working agreements

- Follow `docs/06_BUILD_PLAN.md` stage by stage. Each stage ends with its acceptance checks passing and a git commit (`stage N: …`).
- Backend analytics must reproduce the reference numbers in `docs/04 §6` (tolerance stated there). If they don't, the selection logic is wrong — fix it, don't loosen the tolerance.
- Prefer boring, readable code. Pure functions for analytics (`pandas` in, `pandas` out), thin FastAPI routes.
- Before starting each stage, state the files you will create or change. After it, report the check results with numbers.
- Lint/format: `ruff` (backend), `eslint` + `prettier` (frontend). Tests: `pytest`, `vitest`.
- If something in these docs is ambiguous or contradicts what the Elexon API actually returns, **stop and ask** rather than guessing.
- Report numbers, not adjectives ("MAE 1,996 MW", not "accurate").

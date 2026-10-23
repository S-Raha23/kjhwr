# 01 — Requirements and decisions

## 1. The brief (condensed)

The client is a UK energy utility. Its day-ahead trading team buys electricity
on the GB **day-ahead market** one day before delivery. To decide how much
non-renewable power to buy, it needs to know how much **wind** will be
available. Wind is weather-driven, so the team relies on **forecasts** at
decision time.

The web app must let them:

1. **See the latest wind generation forecast that was available at decision
   time** for each delivery period.
2. **Evaluate forecast accuracy quantitatively**, so they can factor the
   quantified error into purchase decisions.

Scope limits from the brief:

- National-level wind only, from Elexon BMRS:
  - Actuals: `FUELHH` stream, `fuelType == "WIND"` (`startTime`, `generation`)
  - Forecasts: `WINDFOR` stream (`startTime`, `publishTime`, `generation`)
- Only data relevant to **purchase decisions made in January 2026**.
- React front-end, Python back-end, Docker. The brief allows Vercel or Heroku; **we deploy on Heroku only** (D3).
- AI tools are allowed but must be disclosed in the README.
- ≤ 16 hours of effort.

Deliverables (see `docs/07`): unlisted YouTube video (≤ 10 min: 5 min client
pitch + 5 min tech-lead walkthrough), a public GitHub repo with an
**anonymous random name** (e.g. `kjhwr`), a README, a deployed app link, and the
submission form.

## 2. Decisions taken (final — confirmed by the project owner, do not re-litigate)

| # | Question | Decision |
|---|---|---|
| D1 | What is "latest forecast available at decision time"? | **Default: latest `WINDFOR` forecast with `publishTime <= 11:00 Europe/London on D-1`** for delivery day D (GB day-ahead auction gate closure). **Plus** a secondary "custom lead time" mode with a horizon slider (0–48 h): for each target time t, use the latest forecast with `publishTime <= t − h`. |
| D2 | Which period? | Decisions dated 2026-01-01 … 2026-01-31 ⇒ **delivery days 2026-01-02 … 2026-02-01** (UK local days). The date picker is clamped to this range. |
| D3 | Deployment | **Heroku, single Docker container** (`heroku.yml`, container stack). FastAPI serves `/api/*` and the built React app. |
| D4 | Data source | **Committed snapshot + live refresh.** An ingest script fetches from Elexon into Parquet files committed to the repo and loaded at startup. A protected refresh endpoint / CLI re-fetches live. If the live fetch fails, the app keeps serving the snapshot. |

Further modelling choices, made in these docs (change them only with the user's agreement):

| # | Choice | Rationale |
|---|---|---|
| M1 | Compare forecast and actual **at the forecast's hourly timestamps** (exact `startTime` join). Half-hourly actuals at :30 are drawn on the chart but excluded from metrics. | `WINDFOR` is hourly at :00; this is the simplest defensible alignment and is what "startTime is similar" in the brief implies. Document it in the UI's "Methodology" panel. |
| M2 | Error sign convention: **error = forecast − actual**. Positive ⇒ forecast over-predicted wind ⇒ buyer would have **under-procured**. | This is the decision-relevant direction and is stated everywhere errors are shown. |
| M3 | Exclude forecast rows with `startTime < publishTime` (negative horizon). | They are not forecasts in the decision sense. |
| M4 | Percentage error = **WAPE** (Σ\|e\| / Σ actual), not MAPE. | MAPE blows up at low wind; WAPE is stable and is what traders understand as "% of energy". |

## 3. Out of scope for v1

- Other fuel types, regional data, solar, demand, prices, imbalance costs.
- Building a better forecast (no ML models). Bias-correction is **shown as an
  insight** (what the error statistics imply), not deployed as a model.
- User accounts, auth (except the admin refresh token), multi-tenant anything.
- Real-time streaming / websockets.

## 4. Definition of done

- App deployed on Heroku and reachable in an incognito window.
- Default view answers in ≤ 5 seconds: "For delivery day X, what did the forecast
  say at 11:00 the day before, what actually happened, how big was the error, and
  how big is the error typically?"
- Analytics match the reference numbers in `docs/04 §6`.
- `docker build` + `docker run` works from a clean clone. `pytest` and `vitest` pass in CI.
- README complete (`docs/07 §3`); video script drafted (`docs/07 §4`).

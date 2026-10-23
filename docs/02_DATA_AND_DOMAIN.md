# 02 — Data and domain

All facts below were **verified against the live API on 2026-10-23**, not just
read from the docs. The documentation pages at `bmrs.elexon.co.uk/api-documentation/...`
are JavaScript-rendered; the actual API base URL is:

```
https://data.elexon.co.uk/bmrs/api/v1
```

No API key is required.

## 1. Actuals — FUELHH

```
GET /datasets/FUELHH/stream?settlementDateFrom=2026-01-01&settlementDateTo=2026-02-02&fuelType=WIND
```

- Verified parameters: `settlementDateFrom`, `settlementDateTo` (YYYY-MM-DD),
  `fuelType`. `publishDateTimeFrom` / `publishDateTimeTo` (ISO-8601 UTC) also work.
- Response is a bare JSON array. Example record:

```json
{"dataset":"FUELHH","publishTime":"2026-01-01T02:00:00Z","startTime":"2026-01-01T01:30:00Z",
 "settlementDate":"2026-01-01","settlementPeriod":4,"fuelType":"WIND","generation":14077}
```

- Resolution **30 minutes** (`startTime` at :00 and :30). `generation` in **MW**.
- Verified for 2025-12-31 … 2026-02-02: 1,632 rows, **no duplicate `startTime`s, no gaps**.
  Settlement dates Jan 1–31 ⇒ exactly 1,488 rows (31 × 48).
- Use `startTime` (UTC) as the key. Ignore `settlementDate`/`settlementPeriod` (UK-local constructs).
- Range observed Jan 2026: 1,695 – 17,805 MW.

## 2. Forecasts — WINDFOR

```
GET /datasets/WINDFOR/stream?publishDateTimeFrom=2025-12-29T00:00:00Z&publishDateTimeTo=2026-02-02T00:00:00Z
```

- Verified parameters: `publishDateTimeFrom`, `publishDateTimeTo`.
  ⚠️ `from`/`to` are **silently ignored**: the call returns the latest data, not an error. Do not use them.
- Example record:

```json
{"dataset":"WINDFOR","publishTime":"2026-01-01T22:30:00Z","startTime":"2026-01-02T21:00:00Z","generation":19498}
```

- Resolution **hourly** (`startTime` minutes are always :00). `generation` in MW.
- **Publish cadence: 8 runs/day** at 02:30, 04:30, 07:30, 09:30, 11:30, 15:30,
  18:30, 22:30 UTC (one stray 12:25 run observed in the window). Expect occasional missing or extra runs; never hard-code these times.
- Each run spans ~73 hourly points from about −25 h to +66 h relative to the publish
  time. Rows with `startTime < publishTime` exist and are **excluded** (decision M3).
- The window Dec 29 – Feb 2 has 272 runs and 19,856 rows. A single request for that window succeeded. Still, the ingest
  script must **chunk requests by 7 days** in case of server limits, then de-duplicate on (`publishTime`, `startTime`).
- Observed Jan 2026 range: 2,250 – 21,353 MW.

## 3. Domain primer (for UI copy and the video)

- **Day-ahead market (GB):** the hourly/half-hourly power auctions
  for delivery day D (EPEX SPOT / N2EX) close at **11:00 UK time on D-1**. That is
  the "decision time" this app is built around. In January, UK time = GMT = UTC,
  but always compute via `Europe/London` so the logic stays correct across BST.
- **Delivery day D:** 00:00–24:00 Europe/London.
- **Forecast horizon / lead time:** `startTime − publishTime`. With an 11:00
  cutoff, the 09:30 UTC run is selected and lead times run **14.5 h – 37.5 h**
  across the delivery day.
- **Why accuracy matters:** if the wind forecast is too high (positive error),
  the buyer under-buys and is exposed to **imbalance (cash-out) prices** or
  expensive intraday top-ups. If it is too low, they over-buy and must sell back at a discount.
- **Observed systematic bias (key insight):** in January 2026 the decision-time
  forecast was on average **~1.7 GW above** metered actuals (positive at every
  horizon). The likely explanation is that `FUELHH` reports **metered output after
  curtailment** (e.g. Scottish transmission constraints in high-wind periods),
  while `WINDFOR` forecasts **unconstrained wind availability**. Coverage scope may also differ.
  The app must make this bias visible. Present the explanation as a **hypothesis to
  verify with the client**, not as fact.

## 4. Ingest windows (what to fetch)

| Dataset | Request window | Why |
|---|---|---|
| FUELHH | settlementDate 2026-01-01 … 2026-02-02 | Covers delivery Jan 2 00:00 – Feb 1 24:00 London with margin |
| WINDFOR | publishTime 2025-12-29T00:00Z … 2026-02-02T00:00Z | Covers 11:00 D-1 cutoffs from Jan 1, and horizons up to 48 h for the slider |

After ingest, store **unfiltered** (apart from fuelType=WIND and dedupe). Do the analysis-time filtering in the analytics layer, so it is testable.

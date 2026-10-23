# 05 — Frontend specification

Audience: a day-ahead power trader. They are numerate and time-poor, and they think in **MW / GW,
delivery days, and gate closure**. The app is a single-page dashboard. Clarity beats
features. Every number has a unit and a plain-English line.

## 1. Layout (desktop ≥ 1280 px; must remain usable down to 390 px wide)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Header: "Wind Forecast Decision Portal" · GB national wind · Jan 2026 pilot     │
│         data source + snapshot time · "Methodology" button (opens drawer)        │
├───────────────────────────────────────────────────────────────────────────────┤
│ Controls: [Delivery date range ▾]  Mode: (●) Decision time: 11:00 D-1           │
│                                          ( ) Custom lead time: [slider 0–48 h] 24h│
├───────────────────────────────────────────────────────────────────────────────┤
│ KPI tiles: MAE · WAPE % · Bias (± with words) · P90 abs error · Max error       │
├───────────────────────────────────────────────────────────────────────────────┤
│ ① Forecast vs Actual (time series, full width)                                  │
│    actual (solid, 30-min) · forecast used (dashed, hourly) · brush/zoom          │
│    tooltip: time (London), actual, forecast, error, forecast published, lead time │
│ ② Error over time (bar/area: forecast − actual, + / − coloured)                 │
├──────────────────────────────────────┬────────────────────────────────────────┤
│ ③ Delivery-day decision panel         │ ④ Accuracy vs lead time (line, MAE &   │
│   pick a day (or click the chart)     │    bias vs h=0..48, marker at the        │
│   forecast @ decision + 80% band      │    11:00 D-1 lead-time range 14.5–37.5h) │
│   + actual overlay + day totals (MWh) │                                          │
├──────────────────────────────────────┼────────────────────────────────────────┤
│ ⑤ Error by hour of day (bars: MAE,    │ ⑥ Error distribution (histogram, signed, │
│   line: bias)                         │    P10/P90 markers)                      │
├──────────────────────────────────────┴────────────────────────────────────────┤
│ ⑦ Daily table: day · forecast run used · MAE · bias · WAPE · forecast vs actual │
│   MWh · sortable; the worst 3 days highlighted; row click → selects day in ③     │
├───────────────────────────────────────────────────────────────────────────────┤
│ Insight strip (docs/04 §7) — 3–5 one-line computed insights                      │
└───────────────────────────────────────────────────────────────────────────────┘
```

The insight strip may sit directly under the KPI tiles instead. Pick whichever reads better.

## 2. Behaviour

- **State:** `start`, `end`, `mode`, `horizon_h`, `day`. Sync it to the URL query string so a view can be shared by link.
- **Default view:** the full period, cutoff mode, `day` = the worst-MAE day (good demo opener).
- Changing the controls refetches `/api/series` and `/api/metrics`. `/api/horizon-curve` depends only on the date range. `/api/day` depends only on `day`.
- The date range picker is clamped to 2026-01-02 … 2026-02-01, with quick presets: "Full period", "Week 1–4".
- The slider is disabled in cutoff mode. In horizon mode, show "Using latest forecast published ≥ {h} h before each half-hour".
- **All displayed times are in Europe/London.** Format: `Thu 15 Jan 14:00`. Label the axes "UK time".
- Units: values ≥ 1,000 MW are shown in **GW, with 2 decimals** in tiles and **MW** in tooltips and tables. Use thousands separators.
- **Error colours:** over-forecast (e > 0, buyer short) = amber/red; under-forecast = blue. Use the same colours everywhere, with a legend: "Forecast too high → you'd be short".
- **Loading:** skeletons per card. **Error:** a card with the message and a Retry button. **Empty:** "No forecast available before the cutoff for this period."
- **Methodology drawer:** the data sources and links, the decision-time rule, the half-hour/hourly alignment (M1), the error sign (M2), WAPE vs MAPE, the in-sample band caveat, the curtailment-bias hypothesis, and the snapshot time.

## 3. Visual style

- Clean, light theme (a dark theme is optional). One accent colour, plus the two error colours above.
- Cards with subtle borders and generous whitespace. A tabular-numeral font for numbers (`font-variant-numeric: tabular-nums`).
- Charts: there is no chart junk. Use gridlines on y only, a legend at the top, and consistent series colours across charts (actual = dark slate, forecast = accent).
- Accessibility: colour is never the sole signal (use a +/− sign or label), and the controls are keyboard-operable with aria-labels.

## 4. Frontend tests (vitest + RTL, keep it lean)

- `format.ts`: MW/GW formatting, London-time formatting (including a BST date).
- `KpiTiles` renders values and bias wording for both signs.
- `Controls`: switching the mode enables/disables the slider and updates the URL.
- The API client handles non-200 responses by throwing a typed error.

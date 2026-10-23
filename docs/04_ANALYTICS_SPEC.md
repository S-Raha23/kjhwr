# 04 — Analytics specification

This is the part the client is paying for. Implement it as **pure functions** in
`backend/app/analytics/`, with exhaustive tests.

Notation: `F` = forecasts DataFrame (`publishTime`, `startTime`, `generation`), `A` =
actuals DataFrame (`startTime`, `generation`). All times are tz-aware UTC. `LON = "Europe/London"`.

## 1. Period

Delivery days `D ∈ [start, end]` (London local dates, inclusive).
Target-time window: `[start 00:00 LON, (end + 1 day) 00:00 LON)`, converted to UTC.
Default: 2026-01-02 … 2026-02-01 ⇒ 31 days ⇒ 1,488 half-hours, 744 hourly targets.

## 2. Forecast selection (the core, and where leakage hides)

Before any selection, drop rows where `startTime < publishTime` (M3).

### 2a. Cutoff mode (default)
For each hourly target `t` in the window:
```
D           = date of t in LON
cutoff(t)   = (D − 1 day) at 11:00 LON  → UTC
candidates  = F[startTime == t and publishTime <= cutoff(t)]
selected    = candidate with max publishTime  (none ⇒ no forecast for t)
```
Note: every hour of the same delivery day shares one cutoff, so they all come from the
**same forecast run**. This is how the buying team experiences it: one decision per day.

### 2b. Horizon mode
For each hourly target `t`, with lead time `h` hours (0 ≤ h ≤ 48):
```
candidates = F[startTime == t and publishTime <= t − h]
selected   = candidate with max publishTime
```

Implement both modes vectorised: filter, then `sort_values("publishTime").groupby("startTime").tail(1)`.
Return `startTime, forecast, forecast_published, horizon_h`.

### 2c. Mandatory tests (`test_selection.py`)
1. **No leakage:** for every selected row, `forecast_published <= cutoff` (or `<= t − h`). Assert this on the real snapshot for both modes, and for h ∈ {0, 1, 12, 24, 36, 48}.
2. **Latest wins:** a synthetic fixture with runs at 08:30, 09:30, and 11:30 on D-1 ⇒ cutoff mode picks 09:30. A run at exactly 11:00 is included (`<=`).
3. **Same run per day:** in cutoff mode, every hour of a delivery day has the same `forecast_published`.
4. **Negative horizons excluded.**
5. **Missing run:** if no run exists before the cutoff, the target has `forecast = None` and it is excluded from metrics (not zero-filled).
6. **DST safety:** a synthetic delivery day of 2026-03-29 (the clocks-change day) produces the cutoff `2026-03-28T11:00:00Z`, and a BST day produces `10:00Z`. The period has no DST, but the code must not assume UTC == London.

## 3. Joining with actuals

Inner-join the selected forecasts to `A` on `startTime` (hourly targets only, M1).
`error = forecast − actual` (M2). For `/api/series`, left-join the other way: all half-hourly actuals, forecast fields null where there is none.

## 4. Metrics

For a set of errors `e_i` with actuals `a_i`:

| Metric | Definition | Shown as |
|---|---|---|
| `n` | count of matched points | |
| `mae` | mean \|e\| | MW (and GW in tiles) |
| `rmse` | sqrt(mean e²) | MW |
| `bias` | mean e | MW, with sign + words ("forecast too high by…") |
| `wape_pct` | 100 · Σ\|e\| / Σa | % |
| `p50_abs`, `p90_abs` | quantiles of \|e\| (pandas default linear interpolation) | MW: "9 hours in 10 the error was below …" |
| `max_abs` | max \|e\| | MW |
| `p10_signed`, `p90_signed` | quantiles of e | MW, used for bands |
| `share_over_forecast_pct` | 100 · mean(e > 0) | %: "forecast was too high X % of the time" |
| `mean_actual` | mean a | MW |

Breakdowns:
- `by_hour`: group by **London** hour of `t` → mae, bias, n.
- `by_day`: group by London delivery day → mae, bias, wape_pct, `forecast_published`. Also energy totals: `forecast_mwh = Σ forecast × 1 h`, `actual_mwh = Σ actual(hourly points) × 1 h`. State in the methodology panel that daily energy is approximated from the hourly points.
- `histogram`: signed error, fixed 500 MW bins, from floor(min/500)·500 to ceil(max/500)·500.
- `horizon_curve`: for h = 0 … 48, the horizon-mode metrics over the window, plus `coverage_pct = 100 · n / 744` (h = 48 has only ~79 % coverage, because runs reach only ~66 h ahead and one run boundary truncates. Show coverage so a dip in n is not misread).

## 5. Error bands for the decision panel (`bands.py`)

The decision question is: "given this forecast, how much wind could I really get?"

- Bucket the cutoff-mode errors by lead time: `[14,20)`, `[20,26)`, `[26,32)`, `[32,38]` h.
- Per bucket, compute the P10 and P90 of the signed error `e` over the **selected date range**.
- For each hourly point: `band_p10 = forecast − P90(e)`, `band_p90 = forecast − P10(e)`. That is the 80 % range for the **actual**, corrected for bias. Clip at 0.
- The band is **in-sample**: it is calibrated on the same month it is drawn on. Label it "Typical error range (Jan 2026, 80 %)" in the UI and say so in the methodology panel.
- *Stretch goal (only if time permits):* an out-of-sample variant that uses only the days before D (expanding window, minimum 7 days). Toggle: "Use only past errors".

## 6. Reference numbers — acceptance test (`test_reference.py`)

Computed independently from the real data (snapshot fetched 2026-10-23) with
the exact rules above. The implementation must match them to within **±0.5 MW**
(and ±0.05 for percentages). Small revisions are possible if Elexon republishes. If the
numbers differ, first diff the snapshot row counts against `docs/02`.

**Cutoff mode, full period (Jan 2 – Feb 1), n = 744:**

| mae | rmse | bias | wape_pct | p90_abs | p10_signed | p90_signed | max_abs |
|---|---|---|---|---|---|---|---|
| 1995.6 | 2498.8 | 1728.0 | 17.68 | 4183.9 | −502.7 | 4183.9 | 6857 |

The selected run was always the **09:30 UTC** run. Lead times were 14.5 h – 37.5 h.

**Horizon mode, full period:**

| h | n | mae | rmse | bias | wape_pct |
|---|---|---|---|---|---|
| 0 | 744 | 1679.9 | 2141.1 | 1471.1 | 14.89 |
| 4 | 744 | 1719.4 | 2199.7 | 1524.4 | 15.24 |
| 12 | 744 | 1791.2 | 2263.6 | 1595.1 | 15.87 |
| 24 | 744 | 1932.2 | 2399.4 | 1736.2 | 17.12 |
| 36 | 744 | 2142.5 | 2647.8 | 1833.7 | 18.98 |
| 48 | 589 | 2301.2 | 2871.5 | 1800.5 | 20.50 |

## 7. Insights the UI must surface (computed, never hard-coded)

1. **Headline:** "At the 11:00 D-1 decision point, the wind forecast was off by
   {mae} MW on average ({wape}% of wind energy)."
2. **Bias:** "Forecasts were too high {share_over}% of the time; average over-forecast {bias} MW."
   Add a caveat tooltip about curtailment vs unconstrained forecast (docs/02 §3).
3. **Lead-time value:** "Waiting from a {h_cutoff}-h to a 4-h lead time would cut the MAE by {x}%." The
   horizon curve makes this point.
4. **Worst days:** the top 3 delivery days by MAE in the selected range, each clickable to open the day panel.
5. **Hour-of-day pattern:** the hours with the largest average error.

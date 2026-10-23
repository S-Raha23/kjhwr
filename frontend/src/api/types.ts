/** Types mirroring the backend response schemas (backend/app/api/schemas.py). */

export type Mode = 'cutoff' | 'horizon'

export interface AnalysisParams {
  start: string
  end: string
  mode: Mode
  horizonH: number
}

export interface Meta {
  period: { start: string; end: string; timezone: string }
  decision_cutoff_local: string
  horizon_range_h: [number, number]
  counts: { actual_rows: number; forecast_rows: number; forecast_runs: number }
  snapshot_fetched_at: string
  source: string
}

export interface AnalysisMeta {
  start: string
  end: string
  mode: Mode
  horizon_h: number | null
}

export interface SeriesPoint {
  t: string
  actual: number
  forecast: number | null
  forecast_published: string | null
  horizon_h: number | null
  error: number | null
}

export interface SeriesResponse {
  meta: AnalysisMeta
  points: SeriesPoint[]
}

export interface Summary {
  n: number
  mae: number | null
  rmse: number | null
  bias: number | null
  wape_pct: number | null
  p50_abs: number | null
  p90_abs: number | null
  max_abs: number | null
  p10_signed: number | null
  p90_signed: number | null
  mean_actual: number | null
  share_over_forecast_pct: number | null
}

export interface ByHourRow {
  hour_local: number
  mae: number
  bias: number
  n: number
}

export interface ByDayRow {
  day: string
  mae: number
  bias: number
  wape_pct: number
  forecast_published: string
  actual_mwh: number
  forecast_mwh: number
}

export interface Histogram {
  bin_edges: number[]
  counts: number[]
}

export interface MetricsResponse {
  meta: AnalysisMeta
  summary: Summary
  by_hour: ByHourRow[]
  by_day: ByDayRow[]
  histogram: Histogram
}

export interface HorizonPoint {
  horizon_h: number
  n: number
  mae: number | null
  rmse: number | null
  bias: number | null
  wape_pct: number | null
  coverage_pct: number
}

export interface HorizonCurveResponse {
  points: HorizonPoint[]
}

export interface DayPoint {
  t: string
  forecast: number
  actual: number
  band_p10: number | null
  band_p90: number | null
}

export interface DayResponse {
  date: string
  decision_time: string
  forecast_published: string | null
  points: DayPoint[]
  totals: {
    forecast_mwh: number
    actual_mwh: number
    error_mwh: number
    error_pct: number | null
  }
}

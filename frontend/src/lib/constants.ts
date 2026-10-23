export const PERIOD_START = '2026-01-02'
export const PERIOD_END = '2026-02-01'
export const DISPLAY_TIMEZONE = 'Europe/London'
export const DECISION_CUTOFF_LABEL = '11:00 D-1'

export const HORIZON_RANGE_H = { min: 0, max: 48 } as const
export const DEFAULT_HORIZON_H = 24
/** Lead times of the forecast run selected at the 11:00 D-1 decision point. */
export const CUTOFF_LEAD_RANGE_H = { min: 14.5, max: 37.5 } as const
export const LEAD_TIME_COMPARISON_H = { from: 24, to: 4 } as const

export const GW_THRESHOLD_MW = 1000
export const WORST_DAYS_COUNT = 3
export const WEEK_DAYS = 7
export const LAST_DAYS_PRESET = 3
export const QUERY_STALE_MS = 5 * 60 * 1000

export const DATA_SOURCES = [
  {
    label: 'Elexon BMRS FUELHH (WIND) — actual generation',
    href: 'https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream',
  },
  {
    label: 'Elexon BMRS WINDFOR — wind generation forecast',
    href: 'https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream',
  },
] as const

export const CURTAILMENT_CAVEAT =
  'Hypothesis to verify with the client: FUELHH reports metered output after curtailment, while WINDFOR forecasts unconstrained availability.'

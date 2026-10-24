import type { HorizonPoint, MetricsResponse } from '../../api/types'
import { LEAD_TIME_COMPARISON_H } from '../../lib/constants'
import { formatLondonClock } from '../../lib/format'

const PERCENT = 100

export interface StoryFacts {
  dayCount: number
  /** Delivery days whose average error was positive (forecast too high). */
  daysTooHigh: number
  /** "09:30" when every day used the same forecast run, otherwise null. */
  runClock: string | null
  mae24: number | null
  mae4: number | null
  /** Percentage by which MAE falls moving from the 24 h to the 4 h lead time. */
  leadCutPct: number | null
  /** Average error of the freshest (0 h) forecast. */
  bias0: number | null
}

function maeAt(curve: HorizonPoint[], hours: number): number | null {
  return curve.find((point) => point.horizon_h === hours)?.mae ?? null
}

/** Numbers for the narrative that are derived from, never hard-coded beside, the API data. */
export function buildStoryFacts(metrics: MetricsResponse, curve: HorizonPoint[]): StoryFacts {
  const runClocks = new Set(metrics.by_day.map((row) => formatLondonClock(row.forecast_published)))
  const mae24 = maeAt(curve, LEAD_TIME_COMPARISON_H.from)
  const mae4 = maeAt(curve, LEAD_TIME_COMPARISON_H.to)
  return {
    dayCount: metrics.by_day.length,
    daysTooHigh: metrics.by_day.filter((row) => row.bias > 0).length,
    runClock: runClocks.size === 1 ? [...runClocks][0] : null,
    mae24,
    mae4,
    leadCutPct:
      mae24 !== null && mae4 !== null && mae24 > 0 ? (PERCENT * (mae24 - mae4)) / mae24 : null,
    bias0: curve.find((point) => point.horizon_h === 0)?.bias ?? null,
  }
}

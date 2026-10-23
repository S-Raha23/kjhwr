import type { HorizonPoint, MetricsResponse } from '../../api/types'
import { CURTAILMENT_CAVEAT, LEAD_TIME_COMPARISON_H } from '../../lib/constants'
import { formatGw, formatHourOfDay, formatPct, formatPower } from '../../lib/format'
import { worstDays } from '../../lib/rank'

export interface Insight {
  id: string
  text: string
  hint?: string
  /** Delivery days to render as clickable links after the text. */
  days?: string[]
}

const HOURS_LISTED = 3
const PERCENT = 100

/** One-line insights, all derived from the metrics and horizon curve returned by the API. */
export function buildInsights(
  metrics: MetricsResponse,
  curve: HorizonPoint[] | undefined,
  decisionLabel: string,
): Insight[] {
  const { summary, by_day, by_hour, meta } = metrics
  if (summary.n === 0 || summary.mae === null) return []

  const basis =
    meta.mode === 'cutoff'
      ? `At the ${decisionLabel} decision point`
      : `With a ${meta.horizon_h} h lead time`
  const insights: Insight[] = [
    {
      id: 'headline',
      text: `${basis}, the wind forecast was off by ${formatPower(summary.mae)} on average (${formatPct(summary.wape_pct ?? 0)} of wind energy).`,
    },
  ]

  if (summary.bias !== null && summary.share_over_forecast_pct !== null) {
    const direction = summary.bias >= 0 ? 'over-forecast' : 'under-forecast'
    insights.push({
      id: 'bias',
      text: `Forecasts were too high ${formatPct(summary.share_over_forecast_pct, 0)} of the time; average ${direction} ${formatPower(Math.abs(summary.bias))}.`,
      hint: CURTAILMENT_CAVEAT,
    })
  }

  const from = curve?.find((p) => p.horizon_h === LEAD_TIME_COMPARISON_H.from)?.mae
  const to = curve?.find((p) => p.horizon_h === LEAD_TIME_COMPARISON_H.to)?.mae
  if (from != null && to != null && from > 0) {
    insights.push({
      id: 'lead-time',
      text: `Waiting from a ${LEAD_TIME_COMPARISON_H.from} h to a ${LEAD_TIME_COMPARISON_H.to} h lead time would cut the MAE by ${formatPct((PERCENT * (from - to)) / from, 0)} (${formatGw(from)} → ${formatGw(to)}).`,
    })
  }

  const worst = worstDays(by_day)
  if (worst.length > 0) {
    insights.push({
      id: 'worst-days',
      text: `Worst days by MAE:`,
      days: worst,
    })
  }

  const hours = [...by_hour].sort((a, b) => b.mae - a.mae).slice(0, HOURS_LISTED)
  if (hours.length > 0) {
    insights.push({
      id: 'hours',
      text: `Largest average errors at ${hours.map((h) => formatHourOfDay(h.hour_local)).join(', ')} (UK time).`,
    })
  }
  return insights
}

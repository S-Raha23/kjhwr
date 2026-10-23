import { describe, expect, it } from 'vitest'
import type { ByDayRow, HorizonPoint, MetricsResponse } from '../../api/types'
import { buildInsights } from './insights'

const horizonPoint = (horizon_h: number, mae: number): HorizonPoint => ({
  horizon_h,
  n: 744,
  mae,
  rmse: null,
  bias: null,
  wape_pct: null,
  coverage_pct: 100,
})

const day = (date: string, mae: number): ByDayRow => ({
  day: date,
  mae,
  bias: mae,
  wape_pct: 10,
  forecast_published: '2026-01-01T09:30:00Z',
  actual_mwh: 1,
  forecast_mwh: 2,
})

const metrics: MetricsResponse = {
  meta: { start: '2026-01-02', end: '2026-01-03', mode: 'cutoff', horizon_h: null },
  summary: {
    n: 48,
    mae: 2000,
    rmse: 2500,
    bias: 1700,
    wape_pct: 17.7,
    p50_abs: 1600,
    p90_abs: 4000,
    max_abs: 6000,
    p10_signed: -500,
    p90_signed: 4000,
    mean_actual: 11000,
    share_over_forecast_pct: 84,
  },
  by_hour: [
    { hour_local: 3, mae: 2400, bias: 2000, n: 2 },
    { hour_local: 4, mae: 2100, bias: 1900, n: 2 },
    { hour_local: 12, mae: 1300, bias: 1000, n: 2 },
  ],
  by_day: [day('2026-01-02', 3000), day('2026-01-03', 1000)],
  histogram: { bin_edges: [], counts: [] },
}

const LABEL = '11:00 D-1'

describe('buildInsights', () => {
  it('computes every insight from the API data', () => {
    const curve = [horizonPoint(24, 1932), horizonPoint(4, 1719)]
    const insights = buildInsights(metrics, curve, LABEL)
    expect(insights.map((i) => i.id)).toEqual([
      'headline',
      'bias',
      'lead-time',
      'worst-days',
      'hours',
    ])
    expect(insights[0].text).toContain('2.00 GW')
    expect(insights[1].text).toContain('84%')
    expect(insights[2].text).toContain('cut the MAE by 11%')
    expect(insights[3].days).toEqual(['2026-01-02', '2026-01-03'])
    expect(insights[4].text).toContain('03:00, 04:00, 12:00')
  })

  it('omits the lead-time insight when the curve is unavailable', () => {
    const ids = buildInsights(metrics, undefined, LABEL).map((i) => i.id)
    expect(ids).not.toContain('lead-time')
  })

  it('returns nothing for an empty selection', () => {
    const empty = { ...metrics, summary: { ...metrics.summary, n: 0, mae: null } }
    expect(buildInsights(empty, [], LABEL)).toEqual([])
  })
})

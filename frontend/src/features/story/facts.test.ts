import { describe, expect, it } from 'vitest'
import type { ByDayRow, HorizonPoint, MetricsResponse } from '../../api/types'
import { buildStoryFacts } from './facts'

const day = (date: string, bias: number, published = '2026-01-01T09:30:00Z'): ByDayRow => ({
  day: date,
  mae: Math.abs(bias),
  bias,
  wape_pct: 10,
  forecast_published: published,
  actual_mwh: 1,
  forecast_mwh: 2,
})

const point = (horizon_h: number, mae: number, bias: number): HorizonPoint => ({
  horizon_h,
  n: 744,
  mae,
  rmse: null,
  bias,
  wape_pct: null,
  coverage_pct: 100,
})

function metricsWith(rows: ByDayRow[]): MetricsResponse {
  return {
    meta: { start: '2026-01-02', end: '2026-01-04', mode: 'cutoff', horizon_h: null },
    summary: {} as MetricsResponse['summary'],
    by_hour: [],
    by_day: rows,
    histogram: { bin_edges: [], counts: [] },
  }
}

describe('buildStoryFacts', () => {
  const curve = [point(0, 1680, 1471), point(4, 1719, 1524), point(24, 1932, 1736)]

  it('counts the days the forecast was too high', () => {
    const rows = [day('2026-01-02', 500), day('2026-01-03', -200), day('2026-01-04', 900)]
    const facts = buildStoryFacts(metricsWith(rows), curve)
    expect(facts.dayCount).toBe(3)
    expect(facts.daysTooHigh).toBe(2)
  })

  it('names the forecast run when every day used the same one', () => {
    const rows = [day('2026-01-02', 1), day('2026-01-03', 1, '2026-01-02T09:30:00Z')]
    expect(buildStoryFacts(metricsWith(rows), curve).runClock).toBe('09:30')
  })

  it('has no single run when the days used different ones', () => {
    const rows = [day('2026-01-02', 1), day('2026-01-03', 1, '2026-01-02T07:30:00Z')]
    expect(buildStoryFacts(metricsWith(rows), curve).runClock).toBeNull()
  })

  it('derives the lead-time improvement and the freshest-forecast bias from the curve', () => {
    const facts = buildStoryFacts(metricsWith([day('2026-01-02', 1)]), curve)
    expect(facts.mae24).toBe(1932)
    expect(facts.mae4).toBe(1719)
    expect(facts.leadCutPct).toBeCloseTo((100 * (1932 - 1719)) / 1932)
    expect(facts.bias0).toBe(1471)
  })

  it('leaves lead-time facts null when the curve lacks the horizons', () => {
    const facts = buildStoryFacts(metricsWith([day('2026-01-02', 1)]), [])
    expect(facts.leadCutPct).toBeNull()
    expect(facts.bias0).toBeNull()
  })
})

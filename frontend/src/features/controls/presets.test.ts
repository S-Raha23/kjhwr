import { expect, it } from 'vitest'
import { rangePresets } from './presets'

it('offers the full period, four whole weeks and the final days', () => {
  const presets = rangePresets()
  expect(presets.map((p) => [p.label, p.start, p.end])).toEqual([
    ['Full period', '2026-01-02', '2026-02-01'],
    ['Week 1', '2026-01-02', '2026-01-08'],
    ['Week 2', '2026-01-09', '2026-01-15'],
    ['Week 3', '2026-01-16', '2026-01-22'],
    ['Week 4', '2026-01-23', '2026-01-29'],
    ['Last 3 days', '2026-01-30', '2026-02-01'],
  ])
})

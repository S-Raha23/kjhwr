import { expect, it } from 'vitest'
import { dayTicks } from './chartTicks'

const HOUR_MS = 3_600_000
const START = Date.parse('2026-01-02T00:00:00Z')

it('returns one tick per London day', () => {
  const hours = Array.from({ length: 72 }, (_, i) => START + i * HOUR_MS)
  expect(dayTicks(hours)).toEqual([START, START + 24 * HOUR_MS, START + 48 * HOUR_MS])
})

it('thins ticks for long ranges', () => {
  const hours = Array.from({ length: 31 * 24 }, (_, i) => START + i * HOUR_MS)
  expect(dayTicks(hours).length).toBeLessThanOrEqual(10)
})

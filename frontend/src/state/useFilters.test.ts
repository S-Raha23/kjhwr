import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, parseFilters, serializeFilters } from './useFilters'

describe('filters <-> URL', () => {
  it('uses defaults for an empty query string', () => {
    expect(parseFilters('')).toEqual(DEFAULT_FILTERS)
    expect(serializeFilters(DEFAULT_FILTERS)).toBe('')
  })

  it('round-trips a shared view', () => {
    const filters = {
      start: '2026-01-09',
      end: '2026-01-15',
      mode: 'horizon' as const,
      horizonH: 4,
      day: '2026-01-12',
    }
    expect(parseFilters(serializeFilters(filters))).toEqual(filters)
  })

  it('clamps dates to the period and ignores invalid values', () => {
    const parsed = parseFilters('?start=2025-01-01&end=2030-01-01&mode=x&horizon=99&day=nope')
    expect(parsed).toEqual(DEFAULT_FILTERS)
  })

  it('falls back to the full period when start is after end', () => {
    const parsed = parseFilters('?start=2026-01-20&end=2026-01-10')
    expect([parsed.start, parsed.end]).toEqual([DEFAULT_FILTERS.start, DEFAULT_FILTERS.end])
  })
})

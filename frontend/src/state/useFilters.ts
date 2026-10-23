import { useCallback, useEffect, useState } from 'react'
import type { Mode } from '../api/types'
import { DEFAULT_HORIZON_H, HORIZON_RANGE_H, PERIOD_END, PERIOD_START } from '../lib/constants'

export interface Filters {
  start: string
  end: string
  mode: Mode
  horizonH: number
  /** Selected delivery day; null means "the worst-MAE day of the range". */
  day: string | null
}

export const DEFAULT_FILTERS: Filters = {
  start: PERIOD_START,
  end: PERIOD_END,
  mode: 'cutoff',
  horizonH: DEFAULT_HORIZON_H,
  day: null,
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function parseDate(value: string | null, fallback: string): string {
  if (value === null || !ISO_DATE.test(value)) return fallback
  return value < PERIOD_START ? PERIOD_START : value > PERIOD_END ? PERIOD_END : value
}

/** Filters from a URL query string; anything invalid falls back to the default. */
export function parseFilters(search: string): Filters {
  const params = new URLSearchParams(search)
  let start = parseDate(params.get('start'), DEFAULT_FILTERS.start)
  let end = parseDate(params.get('end'), DEFAULT_FILTERS.end)
  if (start > end) [start, end] = [DEFAULT_FILTERS.start, DEFAULT_FILTERS.end]
  const horizon = Number(params.get('horizon'))
  const validHorizon =
    Number.isInteger(horizon) && horizon >= HORIZON_RANGE_H.min && horizon <= HORIZON_RANGE_H.max
  const day = params.get('day')
  return {
    start,
    end,
    mode: params.get('mode') === 'horizon' ? 'horizon' : 'cutoff',
    horizonH: params.has('horizon') && validHorizon ? horizon : DEFAULT_FILTERS.horizonH,
    day: day !== null && ISO_DATE.test(day) ? day : null,
  }
}

/** Query string for the filters that differ from the defaults. */
export function serializeFilters(filters: Filters): string {
  const params = new URLSearchParams()
  if (filters.start !== DEFAULT_FILTERS.start) params.set('start', filters.start)
  if (filters.end !== DEFAULT_FILTERS.end) params.set('end', filters.end)
  if (filters.mode === 'horizon') {
    params.set('mode', 'horizon')
    params.set('horizon', String(filters.horizonH))
  }
  if (filters.day !== null) params.set('day', filters.day)
  const query = params.toString()
  return query ? `?${query}` : ''
}

/** Dashboard filters, kept in sync with the URL query string so a view can be shared. */
export function useFilters() {
  const [filters, setFilters] = useState<Filters>(() => parseFilters(window.location.search))

  useEffect(() => {
    const url = `${window.location.pathname}${serializeFilters(filters)}`
    window.history.replaceState(null, '', url)
  }, [filters])

  const update = useCallback((patch: Partial<Filters>) => {
    setFilters((current) => ({ ...current, ...patch }))
  }, [])

  return { filters, update }
}

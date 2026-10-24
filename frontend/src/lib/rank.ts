import type { ByDayRow } from '../api/types'
import { WORST_DAYS_COUNT } from './constants'

/** Delivery-day rows with the largest MAE, worst first. */
export function worstDayRows(rows: ByDayRow[], count = WORST_DAYS_COUNT): ByDayRow[] {
  return [...rows].sort((a, b) => b.mae - a.mae).slice(0, count)
}

/** Delivery days with the largest MAE, worst first. */
export function worstDays(rows: ByDayRow[], count = WORST_DAYS_COUNT): string[] {
  return worstDayRows(rows, count).map((row) => row.day)
}

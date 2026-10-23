import type { ByDayRow } from '../api/types'
import { WORST_DAYS_COUNT } from './constants'

/** Delivery days with the largest MAE, worst first. */
export function worstDays(rows: ByDayRow[], count = WORST_DAYS_COUNT): string[] {
  return [...rows]
    .sort((a, b) => b.mae - a.mae)
    .slice(0, count)
    .map((row) => row.day)
}

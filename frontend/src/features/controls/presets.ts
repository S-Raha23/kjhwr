import { addDays, format, parseISO } from 'date-fns'
import { LAST_DAYS_PRESET, PERIOD_END, PERIOD_START, WEEK_DAYS } from '../../lib/constants'

export interface RangePreset {
  label: string
  start: string
  end: string
}

const ISO = 'yyyy-MM-dd'
const WEEK_COUNT = 4

function shift(isoDate: string, days: number): string {
  return format(addDays(parseISO(isoDate), days), ISO)
}

/** "Full period", one preset per whole week from the period start, and the final days. */
export function rangePresets(): RangePreset[] {
  const weeks = Array.from({ length: WEEK_COUNT }, (_, index) => ({
    label: `Week ${index + 1}`,
    start: shift(PERIOD_START, index * WEEK_DAYS),
    end: shift(PERIOD_START, index * WEEK_DAYS + WEEK_DAYS - 1),
  }))
  return [
    { label: 'Full period', start: PERIOD_START, end: PERIOD_END },
    ...weeks,
    {
      label: `Last ${LAST_DAYS_PRESET} days`,
      start: shift(PERIOD_END, 1 - LAST_DAYS_PRESET),
      end: PERIOD_END,
    },
  ]
}

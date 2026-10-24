import { formatInTimeZone } from 'date-fns-tz'
import type { ByDayRow } from '../../api/types'
import { COLORS, HEAT_MIN_OPACITY } from '../../lib/chartTheme'
import { DISPLAY_TIMEZONE } from '../../lib/constants'
import { biasWords, formatLondonDay } from '../../lib/format'

interface DayStripProps {
  rows: ByDayRow[]
  onSelectDay: (day: string) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** ISO weekday index (0 = Monday) of a delivery day. */
function weekdayIndex(day: string): number {
  return Number(formatInTimeZone(`${day}T12:00:00Z`, DISPLAY_TIMEZONE, 'i')) - 1
}

function dayOfMonth(day: string): number {
  return Number(day.slice(-2))
}

function cellColour(bias: number, maxAbs: number): { backgroundColor: string; opacity: number } {
  const strength = maxAbs > 0 ? Math.abs(bias) / maxAbs : 0
  return {
    backgroundColor: bias >= 0 ? COLORS.over : COLORS.under,
    opacity: HEAT_MIN_OPACITY + (1 - HEAT_MIN_OPACITY) * strength,
  }
}

/** A calendar of the month. Each day is tinted by its average bias; click to open the day. */
export function DayStrip({ rows, onSelectDay }: DayStripProps) {
  if (rows.length === 0) return null
  const maxAbs = Math.max(...rows.map((row) => Math.abs(row.bias)))
  const offset = weekdayIndex(rows[0].day)

  return (
    <div>
      <div
        className="grid grid-cols-7 gap-1.5 sm:gap-2"
        role="list"
        aria-label="Daily forecast bias"
      >
        {WEEKDAYS.map((name) => (
          <p key={name} className="pb-1 text-center text-xs font-medium text-ink-400">
            {name}
          </p>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span key={`gap-${index}`} aria-hidden="true" />
        ))}
        {rows.map((row) => (
          <div key={row.day} role="listitem">
            <button
              type="button"
              onClick={() => onSelectDay(row.day)}
              aria-label={`${formatLondonDay(row.day)}: ${biasWords(row.bias)}`}
              title={`${formatLondonDay(row.day)} · ${biasWords(row.bias)}`}
              className="group relative aspect-square w-full overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 transition group-hover:brightness-90"
                style={cellColour(row.bias, maxAbs)}
              />
              <span className="relative text-sm font-semibold text-ink-900">
                {dayOfMonth(row.day)}
              </span>
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ backgroundColor: COLORS.over }} />
          Forecast too high (+) — you'd be short
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ backgroundColor: COLORS.under }} />
          Too low (−) — you'd be long
        </span>
        <span>Deeper colour = bigger average miss. Click a day to open it.</span>
      </p>
    </div>
  )
}

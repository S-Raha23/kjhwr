import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { ByDayRow, DayResponse } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { Chapter } from '../../components/ui/Chapter'
import { QueryState } from '../../components/ui/QueryState'
import { Reveal } from '../../components/ui/Reveal'
import { DayView } from '../../features/day-decision/DayView'
import { CHART_HEIGHT } from '../../lib/chartTheme'
import { ROUTES } from '../../lib/constants'
import { formatGw, formatLondonDay, formatMwh } from '../../lib/format'

interface DayChapterProps {
  dayQuery: UseQueryResult<DayResponse>
  /** The days offered as chips, worst first. */
  rows: ByDayRow[]
  selectedDay: string | null
  onPick: (day: string) => void
}

function leadText(day: DayResponse | undefined): string {
  if (!day || day.points.length === 0) {
    return 'Pick one of the hardest days of the month and see the forecast against the outcome.'
  }
  const { forecast_mwh, actual_mwh, error_mwh } = day.totals
  const position = error_mwh >= 0 ? 'short' : 'long'
  return `${formatLondonDay(day.date)}: the forecast promised ${formatMwh(forecast_mwh)}. The wind delivered ${formatMwh(actual_mwh)}. A desk buying against the forecast would have been ${position} by about ${formatMwh(Math.abs(error_mwh))}.`
}

export function DayChapter({ dayQuery, rows, selectedDay, onPick }: DayChapterProps) {
  return (
    <Chapter
      id="one-day"
      number="02"
      kicker="Chapter two · One day, up close"
      title="What the forecast promised, and what the wind did"
      lead={leadText(dayQuery.data)}
      tone="paper"
    >
      <Reveal>
        <div
          className="mb-4 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Pick a day"
        >
          <span className="text-sm text-ink-500">The hardest days:</span>
          {rows.map((row) => (
            <button
              key={row.day}
              type="button"
              aria-pressed={row.day === selectedDay}
              onClick={() => onPick(row.day)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-accent-400 ${
                row.day === selectedDay
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
              }`}
            >
              {formatLondonDay(row.day)} · off by {formatGw(row.mae)}
            </button>
          ))}
        </div>
        <Card>
          <QueryState query={dayQuery} skeletonHeight={CHART_HEIGHT + 120}>
            {(day) => <DayView data={day} />}
          </QueryState>
        </Card>
        {selectedDay && (
          <p className="mt-4 text-sm">
            <Link
              to={`${ROUTES.explore}?day=${selectedDay}`}
              className="font-semibold text-accent-700 underline underline-offset-4"
            >
              Open this day in the explorer →
            </Link>
          </p>
        )}
      </Reveal>
    </Chapter>
  )
}

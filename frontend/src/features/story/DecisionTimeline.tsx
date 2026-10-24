import type { DayResponse } from '../../api/types'
import { CUTOFF_LEAD_RANGE_H, DECISION_CUTOFF_LABEL } from '../../lib/constants'
import {
  formatHours,
  formatLondonClock,
  formatLondonDateTime,
  formatLondonDay,
} from '../../lib/format'

interface DecisionTimelineProps {
  day: DayResponse
}

interface Step {
  time: string
  title: string
  detail: string
  tone: string
}

function buildSteps(day: DayResponse): Step[] {
  const published = day.forecast_published
  const first = day.points[0]?.t
  const last = day.points[day.points.length - 1]?.t
  return [
    {
      time: published ? formatLondonDateTime(published) : '—',
      title: 'The forecast you can use',
      detail: published
        ? `The ${formatLondonClock(published)} run is the latest one published before gate closure.`
        : 'No forecast was published before gate closure.',
      tone: 'bg-accent-500',
    },
    {
      time: formatLondonDateTime(day.decision_time),
      title: `Gate closes · ${DECISION_CUTOFF_LABEL}`,
      detail: 'Day-ahead bids are locked. Later forecast runs arrive too late to act on.',
      tone: 'bg-amber-500',
    },
    {
      time:
        first && last ? `${formatLondonDay(day.date)} · 00:00 – 24:00` : formatLondonDay(day.date),
      title: 'Delivery day',
      detail: `The forecast covers ${formatHours(CUTOFF_LEAD_RANGE_H.min)} to ${formatHours(CUTOFF_LEAD_RANGE_H.max)} ahead of the hours it is judged on.`,
      tone: 'bg-ink-800',
    },
  ]
}

/** The three moments that define the decision: the usable forecast, gate closure and delivery. */
export function DecisionTimeline({ day }: DecisionTimelineProps) {
  return (
    <ol className="relative grid gap-6 sm:grid-cols-3 sm:gap-8">
      <div
        aria-hidden="true"
        className="absolute bottom-6 left-[1.05rem] top-6 w-px bg-ink-200 sm:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute left-[16.7%] right-[16.7%] top-[1.05rem] hidden h-px bg-ink-200 sm:block"
      />
      {buildSteps(day).map((step, index) => (
        <li key={step.title} className="relative pl-12 sm:pl-0 sm:pt-12">
          <span
            className={`absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-4 ring-white sm:left-1/2 sm:-translate-x-1/2 ${step.tone}`}
          >
            {index + 1}
          </span>
          <div className="sm:text-center">
            <p className="text-sm font-semibold text-accent-700">{step.time}</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-ink-900">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-600">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

import { Link } from 'react-router-dom'
import type { Summary } from '../../api/types'
import { Chapter } from '../../components/ui/Chapter'
import { Reveal } from '../../components/ui/Reveal'
import { DeskTakeaways, type Takeaway } from '../../features/story/DeskTakeaways'
import type { StoryFacts } from '../../features/story/facts'
import { LEAD_TIME_COMPARISON_H, ROUTES } from '../../lib/constants'
import { formatPct, formatSignedGw } from '../../lib/format'

interface DeskChapterProps {
  summary: Summary | undefined
  facts: StoryFacts | null
}

function buildTakeaways(summary: Summary | undefined, facts: StoryFacts | null): Takeaway[] {
  const { from, to } = LEAD_TIME_COMPARISON_H
  const range =
    summary?.p10_signed != null && summary.p90_signed != null
      ? `${formatSignedGw(-summary.p90_signed)} to ${formatSignedGw(-summary.p10_signed)}`
      : null
  return [
    {
      title: 'Plan for a shortfall, not a surprise',
      body: range
        ? `Eight hours in ten, actual wind landed between ${range} of the forecast. Size your safety margin to the downside, and use the day-by-day range in the explorer.`
        : 'Size your safety margin to the downside, using the day-by-day range in the explorer.',
    },
    {
      title: 'Trade closer to delivery where you can',
      body:
        facts?.leadCutPct != null
          ? `A ${to} h forecast misses by ${formatPct(facts.leadCutPct, 0)} less than a ${from} h one. Keep flexibility for intraday, where the better information is.`
          : 'Fresher forecasts are more accurate, so keep flexibility for intraday.',
    },
    {
      title: 'Find out why it runs high',
      body: 'Test the curtailment hypothesis with the data owner before applying any correction. If the gap is predictable, it can be priced into the bid.',
    },
  ]
}

export function DeskChapter({ summary, facts }: DeskChapterProps) {
  return (
    <Chapter
      id="desk"
      number="06"
      kicker="Chapter six · The takeaway"
      title="What this means for your desk"
      lead="One month is a pilot, not a verdict. But the direction is clear enough to act on, and to test further."
      tone="ink"
    >
      <DeskTakeaways items={buildTakeaways(summary, facts)} />
      <Reveal className="mt-12 flex flex-wrap gap-3">
        <Link
          to={ROUTES.explore}
          className="rounded-full bg-accent-400 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-accent-300 focus:outline-none focus:ring-2 focus:ring-white"
        >
          Explore every day yourself →
        </Link>
        <Link
          to={ROUTES.method}
          className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
        >
          How we measured it
        </Link>
      </Reveal>
    </Chapter>
  )
}

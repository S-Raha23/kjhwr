import type { UseQueryResult } from '@tanstack/react-query'
import type { HorizonCurveResponse } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { Chapter } from '../../components/ui/Chapter'
import { QueryState } from '../../components/ui/QueryState'
import { Reveal } from '../../components/ui/Reveal'
import { StatBlock } from '../../components/ui/StatBlock'
import { HorizonCurveChart } from '../../features/horizon/HorizonCurveChart'
import type { StoryFacts } from '../../features/story/facts'
import { CHART_HEIGHT } from '../../lib/chartTheme'
import { LEAD_TIME_COMPARISON_H } from '../../lib/constants'
import { formatGw, formatPct, formatPower } from '../../lib/format'

interface WaitingChapterProps {
  curveQuery: UseQueryResult<HorizonCurveResponse>
  facts: StoryFacts | null
}

function leadText(facts: StoryFacts | null): string {
  if (!facts || facts.leadCutPct === null || facts.bias0 === null) {
    return 'Forecasts improve as delivery approaches. By how much?'
  }
  const { from, to } = LEAD_TIME_COMPARISON_H
  return `Moving from a ${from} h to a ${to} h lead time cuts the average miss by ${formatPct(facts.leadCutPct, 0)}. Useful, but the lean stays: even the freshest forecast (0 h ahead) runs ${formatPower(facts.bias0)} too high.`
}

export function WaitingChapter({ curveQuery, facts }: WaitingChapterProps) {
  const { from, to } = LEAD_TIME_COMPARISON_H
  return (
    <Chapter
      id="waiting"
      number="05"
      kicker="Chapter five · Lead time"
      title="Does waiting for a fresher forecast help?"
      lead={leadText(facts)}
      tone="paper"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card
            title="Accuracy against lead time"
            subtitle="Shaded: the lead times you actually have at the 11:00 decision."
          >
            <QueryState query={curveQuery} skeletonHeight={CHART_HEIGHT}>
              {({ points }) => <HorizonCurveChart points={points} selectedHorizonH={null} />}
            </QueryState>
          </Card>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {facts?.mae24 != null && (
            <Reveal>
              <StatBlock
                value={facts.mae24}
                format={formatGw}
                label={`Miss at ${from} h ahead`}
                note="Roughly where the day-ahead decision sits"
              />
            </Reveal>
          )}
          {facts?.mae4 != null && (
            <Reveal delay={120}>
              <StatBlock
                value={facts.mae4}
                format={formatGw}
                label={`Miss at ${to} h ahead`}
                note="What an intraday trader would see"
              />
            </Reveal>
          )}
          {facts?.leadCutPct != null && (
            <Reveal delay={240}>
              <StatBlock
                value={facts.leadCutPct}
                format={(v) => formatPct(v, 0)}
                label="Reduction in average miss"
                note={`Moving from ${from} h to ${to} h`}
              />
            </Reveal>
          )}
        </div>
      </div>
    </Chapter>
  )
}

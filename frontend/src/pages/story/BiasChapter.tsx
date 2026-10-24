import type { UseQueryResult } from '@tanstack/react-query'
import type { MetricsResponse, SeriesResponse } from '../../api/types'
import { Callout } from '../../components/ui/Callout'
import { Card } from '../../components/ui/Card'
import { Chapter } from '../../components/ui/Chapter'
import { QueryState } from '../../components/ui/QueryState'
import { Reveal } from '../../components/ui/Reveal'
import { ErrorByHourChart } from '../../features/patterns/ErrorByHourChart'
import type { StoryFacts } from '../../features/story/facts'
import { DayStrip } from '../../features/story/DayStrip'
import { ErrorChart } from '../../features/timeseries/ErrorChart'
import { CHART_HEIGHT } from '../../lib/chartTheme'
import { CURTAILMENT_CAVEAT } from '../../lib/constants'
import { formatPct, formatPower } from '../../lib/format'

interface BiasChapterProps {
  metricsQuery: UseQueryResult<MetricsResponse>
  seriesQuery: UseQueryResult<SeriesResponse>
  facts: StoryFacts | null
  onOpenDay: (day: string) => void
}

function leadText(metrics: MetricsResponse | undefined, facts: StoryFacts | null): string {
  const summary = metrics?.summary
  if (!summary || !facts || summary.bias === null || summary.share_over_forecast_pct === null) {
    return 'The errors are not random. They point the same way.'
  }
  return `The forecast was too high in ${formatPct(summary.share_over_forecast_pct, 0)} of hours and on ${facts.daysTooHigh} of ${facts.dayCount} days, by ${formatPower(Math.abs(summary.bias))} on average. That is not noise. It is a lean, and a desk that ignores it under-buys.`
}

export function BiasChapter({ metricsQuery, seriesQuery, facts, onOpenDay }: BiasChapterProps) {
  return (
    <Chapter
      id="bias"
      number="04"
      kicker="Chapter four · The pattern"
      title="The forecast leans one way"
      lead={leadText(metricsQuery.data, facts)}
      tone="white"
    >
      <div className="space-y-6">
        <QueryState query={metricsQuery} skeletonHeight={CHART_HEIGHT}>
          {({ by_day, by_hour }) => (
            <div className="grid gap-6 lg:grid-cols-2">
              <Reveal>
                <Card title="Every day of the month" subtitle="Average bias per delivery day.">
                  <DayStrip rows={by_day} onSelectDay={onOpenDay} />
                </Card>
              </Reveal>
              <Reveal delay={120}>
                <Card
                  title="Worst in the small hours"
                  subtitle="Average miss and bias by UK hour of day."
                >
                  <ErrorByHourChart rows={by_hour} />
                </Card>
              </Reveal>
            </div>
          )}
        </QueryState>
        <Reveal>
          <Card
            title="Forecast minus actual, hour by hour"
            subtitle="Amber above zero: too high. Blue below zero: too low. Mostly amber."
          >
            <QueryState query={seriesQuery} skeletonHeight={CHART_HEIGHT}>
              {(series) => <ErrorChart points={series.points} />}
            </QueryState>
          </Card>
        </Reveal>
        <Reveal>
          <Callout label="A hypothesis to verify, not a finding">
            {CURTAILMENT_CAVEAT} If that is the cause, the gap is structural and can be corrected
            for; if not, it is a question for the forecast provider.
          </Callout>
        </Reveal>
      </div>
    </Chapter>
  )
}

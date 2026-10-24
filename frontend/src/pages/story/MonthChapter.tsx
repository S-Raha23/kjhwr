import type { UseQueryResult } from '@tanstack/react-query'
import type { MetricsResponse, SeriesResponse } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { Chapter } from '../../components/ui/Chapter'
import { QueryState } from '../../components/ui/QueryState'
import { Reveal } from '../../components/ui/Reveal'
import { StatBlock } from '../../components/ui/StatBlock'
import { ErrorHistogram } from '../../features/patterns/ErrorHistogram'
import { ForecastVsActualChart } from '../../features/timeseries/ForecastVsActualChart'
import { CHART_HEIGHT } from '../../lib/chartTheme'
import { formatGw, formatPct } from '../../lib/format'

interface MonthChapterProps {
  seriesQuery: UseQueryResult<SeriesResponse>
  metricsQuery: UseQueryResult<MetricsResponse>
  onOpenDay: (day: string) => void
}

function leadText(metrics: MetricsResponse | undefined): string {
  const summary = metrics?.summary
  if (!summary || summary.mae === null || summary.wape_pct === null) {
    return 'Every hourly decision of the month, side by side.'
  }
  return `Across ${summary.n} hourly decisions the forecast missed by ${formatGw(summary.mae)} on average: ${formatPct(summary.wape_pct)} of all wind energy. Nine hours in ten stayed under ${formatGw(summary.p90_abs ?? 0)}, but the worst single hour was off by ${formatGw(summary.max_abs ?? 0)}.`
}

export function MonthChapter({ seriesQuery, metricsQuery, onOpenDay }: MonthChapterProps) {
  return (
    <Chapter
      id="month"
      number="03"
      kicker="Chapter three · The whole month"
      title="Zoom out: the dotted line rides above the solid one"
      lead={leadText(metricsQuery.data)}
      tone="paper"
    >
      <div className="space-y-6">
        <Reveal>
          <Card
            title="Forecast at decision time vs actual wind"
            subtitle="Click anywhere on the chart to open that delivery day in the explorer."
          >
            <QueryState query={seriesQuery} skeletonHeight={CHART_HEIGHT + 40}>
              {(series) => <ForecastVsActualChart points={series.points} onSelectDay={onOpenDay} />}
            </QueryState>
          </Card>
        </Reveal>
        <QueryState query={metricsQuery} skeletonHeight={CHART_HEIGHT}>
          {({ summary, histogram }) => (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Reveal>
                  <StatBlock
                    value={summary.mae ?? 0}
                    format={formatGw}
                    label="Mean absolute error"
                    note="The typical hourly miss"
                  />
                </Reveal>
                <Reveal delay={100}>
                  <StatBlock
                    value={summary.wape_pct ?? 0}
                    format={(v) => formatPct(v, 2)}
                    label="Of wind energy"
                    note="Error as a share of what was generated"
                  />
                </Reveal>
                <Reveal delay={200}>
                  <StatBlock
                    value={summary.p90_abs ?? 0}
                    format={formatGw}
                    label="Nine hours in ten"
                    note="Stayed below this error"
                  />
                </Reveal>
                <Reveal delay={300}>
                  <StatBlock
                    value={summary.max_abs ?? 0}
                    format={formatGw}
                    label="Worst single hour"
                    note="The tail you must be able to absorb"
                  />
                </Reveal>
              </div>
              <Reveal>
                <Card
                  title="How big were the misses?"
                  subtitle="Hours by size of error. Amber: forecast too high. Blue: too low."
                >
                  <ErrorHistogram histogram={histogram} summary={summary} />
                </Card>
              </Reveal>
            </>
          )}
        </QueryState>
      </div>
    </Chapter>
  )
}

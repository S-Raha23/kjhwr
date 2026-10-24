import { useCallback, useMemo } from 'react'
import type { AnalysisParams } from '../api/types'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { QueryState } from '../components/ui/QueryState'
import { Controls } from '../features/controls/Controls'
import { DailyTable } from '../features/daily-table/DailyTable'
import { DayView } from '../features/day-decision/DayView'
import { HorizonCurveChart } from '../features/horizon/HorizonCurveChart'
import { InsightStrip } from '../features/kpis/InsightStrip'
import { KpiTiles } from '../features/kpis/KpiTiles'
import { ErrorByHourChart } from '../features/patterns/ErrorByHourChart'
import { ErrorHistogram } from '../features/patterns/ErrorHistogram'
import { ErrorChart } from '../features/timeseries/ErrorChart'
import { ForecastVsActualChart } from '../features/timeseries/ForecastVsActualChart'
import { useDay } from '../hooks/useDay'
import { useHorizonCurve } from '../hooks/useHorizonCurve'
import { useMetrics } from '../hooks/useMetrics'
import { useSeries } from '../hooks/useSeries'
import { CHART_HEIGHT } from '../lib/chartTheme'
import { PERIOD_END, PERIOD_START } from '../lib/constants'
import { formatLondonDay } from '../lib/format'
import { worstDays } from '../lib/rank'
import { useFilters } from '../state/useFilters'

const NO_FORECAST_MESSAGE = 'No forecast available before the cutoff for this period.'

export default function ExplorePage() {
  const { filters, update } = useFilters()
  const params = useMemo<AnalysisParams>(
    () => ({
      start: filters.start,
      end: filters.end,
      mode: filters.mode,
      horizonH: filters.horizonH,
    }),
    [filters.start, filters.end, filters.mode, filters.horizonH],
  )
  const series = useSeries(params)
  const metrics = useMetrics(params)
  const curve = useHorizonCurve(filters.start, filters.end)

  const inRange = filters.day !== null && filters.day >= filters.start && filters.day <= filters.end
  const defaultDay = metrics.data ? (worstDays(metrics.data.by_day, 1)[0] ?? null) : null
  const day = inRange ? filters.day : defaultDay
  const dayQuery = useDay(day, filters.start, filters.end)
  const selectDay = useCallback((selected: string) => update({ day: selected }), [update])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10">
      <header>
        <p className="kicker text-accent-600">Explore</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">
          Every day, every hour
        </h1>
        <p className="mt-2 max-w-2xl text-ink-600">
          Change the dates or the lead time and everything below recalculates. The address bar
          always holds the current view, so you can share it.
        </p>
      </header>
      <Controls filters={filters} onChange={update} />
      <QueryState query={metrics} skeletonHeight={96}>
        {(data) =>
          data.summary.n === 0 ? (
            <Card>
              <EmptyState message={NO_FORECAST_MESSAGE} />
            </Card>
          ) : (
            <>
              <KpiTiles summary={data.summary} />
              <InsightStrip metrics={data} curve={curve.data?.points} onSelectDay={selectDay} />
            </>
          )
        }
      </QueryState>
      <Card
        title="Forecast vs actual"
        subtitle="Actual (30-min) against the forecast you had at decision time (hourly). Click the chart to pick a delivery day."
      >
        <QueryState query={series} skeletonHeight={CHART_HEIGHT + 40}>
          {(data) => <ForecastVsActualChart points={data.points} onSelectDay={selectDay} />}
        </QueryState>
      </Card>
      <Card
        title="Forecast error over time"
        subtitle="Forecast − actual. Above zero: forecast too high, you'd be short. Below zero: too low, you'd be long."
      >
        <QueryState query={series} skeletonHeight={CHART_HEIGHT}>
          {(data) => <ErrorChart points={data.points} />}
        </QueryState>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title={day ? `Delivery day: ${formatLondonDay(day)}` : 'Delivery day'}
          subtitle="The forecast available at 11:00 D-1, the actual outcome, and the typical error range."
          action={
            <input
              type="date"
              aria-label="Delivery day"
              className="rounded-md border border-ink-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
              min={PERIOD_START}
              max={PERIOD_END}
              value={day ?? ''}
              onChange={(event) => event.target.value && selectDay(event.target.value)}
            />
          }
        >
          <QueryState query={dayQuery} skeletonHeight={CHART_HEIGHT + 120}>
            {(data) => <DayView data={data} />}
          </QueryState>
        </Card>
        <Card
          title="Accuracy vs lead time"
          subtitle="MAE and bias against how long before delivery the forecast was published. Shaded: lead times of the 11:00 D-1 decision."
        >
          <QueryState query={curve} skeletonHeight={CHART_HEIGHT}>
            {({ points }) => (
              <HorizonCurveChart
                points={points}
                selectedHorizonH={filters.mode === 'horizon' ? filters.horizonH : null}
              />
            )}
          </QueryState>
        </Card>
      </div>
      <QueryState query={metrics} skeletonHeight={CHART_HEIGHT}>
        {(data) => (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card
                title="Error by hour of day"
                subtitle="Average MAE (bars) and bias (line) by UK hour."
              >
                <ErrorByHourChart rows={data.by_hour} />
              </Card>
              <Card
                title="Error distribution"
                subtitle="How often the forecast missed by each amount."
              >
                <ErrorHistogram histogram={data.histogram} summary={data.summary} />
              </Card>
            </div>
            <Card title="Daily accuracy">
              <DailyTable rows={data.by_day} selectedDay={day} onSelectDay={selectDay} />
            </Card>
          </>
        )}
      </QueryState>
    </div>
  )
}

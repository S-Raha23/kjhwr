import { useCallback, useMemo, useState } from 'react'
import type { AnalysisParams } from './api/types'
import { Card } from './components/ui/Card'
import { EmptyState } from './components/ui/EmptyState'
import { QueryState } from './components/ui/QueryState'
import { Controls } from './features/controls/Controls'
import { DailyTable } from './features/daily-table/DailyTable'
import { DayDecisionPanel } from './features/day-decision/DayDecisionPanel'
import { Header } from './features/header/Header'
import { MethodologyDrawer } from './features/header/MethodologyDrawer'
import { HorizonCurveChart } from './features/horizon/HorizonCurveChart'
import { InsightStrip } from './features/kpis/InsightStrip'
import { KpiTiles } from './features/kpis/KpiTiles'
import { ErrorByHourChart } from './features/patterns/ErrorByHourChart'
import { ErrorHistogram } from './features/patterns/ErrorHistogram'
import { ErrorChart } from './features/timeseries/ErrorChart'
import { ForecastVsActualChart } from './features/timeseries/ForecastVsActualChart'
import { useHorizonCurve } from './hooks/useHorizonCurve'
import { useMeta } from './hooks/useMeta'
import { useMetrics } from './hooks/useMetrics'
import { useSeries } from './hooks/useSeries'
import { worstDays } from './lib/rank'
import { useFilters } from './state/useFilters'

const NO_FORECAST_MESSAGE = 'No forecast available before the cutoff for this period.'

export default function App() {
  const { filters, update } = useFilters()
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  const closeMethodology = useCallback(() => setMethodologyOpen(false), [])

  const params = useMemo<AnalysisParams>(
    () => ({
      start: filters.start,
      end: filters.end,
      mode: filters.mode,
      horizonH: filters.horizonH,
    }),
    [filters.start, filters.end, filters.mode, filters.horizonH],
  )
  const meta = useMeta()
  const series = useSeries(params)
  const metrics = useMetrics(params)
  const curve = useHorizonCurve(filters.start, filters.end)

  const inRange = filters.day !== null && filters.day >= filters.start && filters.day <= filters.end
  const defaultDay = metrics.data ? (worstDays(metrics.data.by_day, 1)[0] ?? null) : null
  const day = inRange ? filters.day : defaultDay
  const selectDay = useCallback((selected: string) => update({ day: selected }), [update])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header meta={meta.data} onOpenMethodology={() => setMethodologyOpen(true)} />
      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-4 px-4 py-4">
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
        <QueryState query={series} skeletonHeight={360}>
          {(data) => (
            <>
              <ForecastVsActualChart points={data.points} onSelectDay={selectDay} />
              <ErrorChart points={data.points} />
            </>
          )}
        </QueryState>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <DayDecisionPanel
            day={day}
            start={filters.start}
            end={filters.end}
            onChangeDay={selectDay}
          />
          <HorizonCurveChart
            start={filters.start}
            end={filters.end}
            selectedHorizonH={filters.mode === 'horizon' ? filters.horizonH : null}
          />
        </div>
        <QueryState query={metrics} skeletonHeight={320}>
          {(data) => (
            <>
              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                <ErrorByHourChart rows={data.by_hour} />
                <ErrorHistogram histogram={data.histogram} summary={data.summary} />
              </div>
              <DailyTable rows={data.by_day} selectedDay={day} onSelectDay={selectDay} />
            </>
          )}
        </QueryState>
      </main>
      <MethodologyDrawer open={methodologyOpen} meta={meta.data} onClose={closeMethodology} />
    </div>
  )
}

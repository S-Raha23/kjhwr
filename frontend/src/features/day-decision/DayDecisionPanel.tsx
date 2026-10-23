import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DayResponse } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { QueryState } from '../../components/ui/QueryState'
import { useDay } from '../../hooks/useDay'
import {
  AXIS,
  CHART_HEIGHT,
  COLORS,
  LEGEND_STYLE,
  LINE_WIDTH,
  TOOLTIP_STYLE,
} from '../../lib/chartTheme'
import { PERIOD_END, PERIOD_START } from '../../lib/constants'
import {
  formatGwTick,
  formatLondonClock,
  formatLondonDateTime,
  formatLondonDay,
  formatMw,
  formatMwh,
  formatPct,
  formatSignedMwh,
} from '../../lib/format'

interface DayDecisionPanelProps {
  day: string | null
  start: string
  end: string
  onChangeDay: (day: string) => void
}

function DayChart({ data }: { data: DayResponse }) {
  const rows = useMemo(
    () =>
      data.points.map((p) => ({
        ts: Date.parse(p.t),
        forecast: p.forecast,
        actual: p.actual,
        band: p.band_p10 !== null && p.band_p90 !== null ? [p.band_p10, p.band_p90] : null,
      })),
    [data],
  )
  const { totals } = data

  return (
    <>
      <p className="mb-2 text-xs text-slate-500">
        Decision made {formatLondonDateTime(data.decision_time)} UK time
        {data.forecast_published && (
          <> using the forecast published {formatLondonDateTime(data.forecast_published)}</>
        )}
        .
      </p>
      <div
        role="img"
        aria-label="Chart of the decision-time forecast, 80% band and actual for the day"
      >
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <ComposedChart data={rows}>
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tick={AXIS.tick}
              tickFormatter={formatLondonClock}
              label={{ value: 'UK time', position: 'insideBottomRight', offset: -4, fontSize: 11 }}
            />
            <YAxis tick={AXIS.tick} tickFormatter={formatGwTick} />
            <Tooltip
              {...TOOLTIP_STYLE}
              labelFormatter={(ts) => `${formatLondonDateTime(Number(ts))} UK time`}
              formatter={(value) =>
                Array.isArray(value)
                  ? `${formatMw(value[0])} – ${formatMw(value[1])}`
                  : formatMw(Number(value))
              }
            />
            <Legend verticalAlign="top" wrapperStyle={LEGEND_STYLE} />
            <Area
              name="Typical error range (Jan 2026, 80 %)"
              dataKey="band"
              fill={COLORS.band}
              stroke="none"
              isAnimationActive={false}
            />
            <Line
              name="Forecast at decision time"
              dataKey="forecast"
              stroke={COLORS.forecast}
              strokeWidth={LINE_WIDTH}
              strokeDasharray="5 3"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              name="Actual"
              dataKey="actual"
              stroke={COLORS.actual}
              strokeWidth={LINE_WIDTH}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-slate-500">Forecast energy</dt>
          <dd className="font-semibold">{formatMwh(totals.forecast_mwh)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Actual energy</dt>
          <dd className="font-semibold">{formatMwh(totals.actual_mwh)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Error</dt>
          <dd className="font-semibold">{formatSignedMwh(totals.error_mwh)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Error vs actual</dt>
          <dd className="font-semibold">
            {totals.error_pct === null ? '–' : formatPct(totals.error_pct)}
          </dd>
        </div>
      </dl>
    </>
  )
}

export function DayDecisionPanel({ day, start, end, onChangeDay }: DayDecisionPanelProps) {
  const query = useDay(day, start, end)

  return (
    <Card
      title={day ? `③ Delivery day: ${formatLondonDay(day)}` : '③ Delivery day'}
      subtitle="The forecast available at 11:00 D-1, the actual outcome, and the typical error range."
      action={
        <input
          type="date"
          aria-label="Delivery day"
          className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          min={PERIOD_START}
          max={PERIOD_END}
          value={day ?? ''}
          onChange={(event) => event.target.value && onChangeDay(event.target.value)}
        />
      }
    >
      <QueryState query={query} skeletonHeight={CHART_HEIGHT}>
        {(data) =>
          data.points.length === 0 ? (
            <EmptyState message="No forecast available before the cutoff for this day." />
          ) : (
            <DayChart data={data} />
          )
        }
      </QueryState>
    </Card>
  )
}

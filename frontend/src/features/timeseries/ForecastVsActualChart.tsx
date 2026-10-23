import { useMemo } from 'react'
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SeriesPoint } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { dayTicks } from '../../lib/chartTicks'
import { AXIS, CHART_HEIGHT, COLORS, LEGEND_STYLE, LINE_WIDTH } from '../../lib/chartTheme'
import {
  formatGwTick,
  formatHours,
  formatLondonDateTime,
  formatLondonShortDay,
  formatMw,
  formatSignedMw,
  toLondonDay,
} from '../../lib/format'

interface ForecastVsActualChartProps {
  points: SeriesPoint[]
  onSelectDay: (day: string) => void
}

interface Row extends SeriesPoint {
  ts: number
}

function SeriesTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs shadow">
      <p className="font-semibold">{formatLondonDateTime(row.ts)} UK time</p>
      <p>Actual: {formatMw(row.actual)}</p>
      {row.forecast !== null && row.error !== null && row.forecast_published !== null && (
        <>
          <p>Forecast: {formatMw(row.forecast)}</p>
          <p>Error: {formatSignedMw(row.error)}</p>
          <p>Published: {formatLondonDateTime(row.forecast_published)}</p>
          {row.horizon_h !== null && <p>Lead time: {formatHours(row.horizon_h)}</p>}
        </>
      )}
    </div>
  )
}

export function ForecastVsActualChart({ points, onSelectDay }: ForecastVsActualChartProps) {
  const rows = useMemo<Row[]>(() => points.map((p) => ({ ...p, ts: Date.parse(p.t) })), [points])

  const ticks = useMemo(() => dayTicks(rows.map((r) => r.ts)), [rows])

  return (
    <Card
      title="① Forecast vs actual"
      subtitle="Actual (30-min) against the forecast you had at decision time (hourly). Click the chart to pick a delivery day."
    >
      <div role="img" aria-label="Line chart of forecast against actual wind generation">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT + 40}>
          <LineChart
            data={rows}
            onClick={(state) => {
              if (typeof state?.activeLabel === 'number')
                onSelectDay(toLondonDay(state.activeLabel))
            }}
          >
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              ticks={ticks}
              domain={['dataMin', 'dataMax']}
              tick={AXIS.tick}
              tickFormatter={formatLondonShortDay}
              label={{ value: 'UK time', position: 'insideBottomRight', offset: -4, fontSize: 11 }}
            />
            <YAxis
              tick={AXIS.tick}
              tickFormatter={formatGwTick}
              label={{ value: 'GW', angle: -90, position: 'insideLeft', fontSize: 11 }}
            />
            <Tooltip content={<SeriesTooltip />} />
            <Legend verticalAlign="top" wrapperStyle={LEGEND_STYLE} />
            <Line
              name="Actual (30-min)"
              dataKey="actual"
              stroke={COLORS.actual}
              strokeWidth={LINE_WIDTH}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              name="Forecast used (hourly)"
              dataKey="forecast"
              stroke={COLORS.forecast}
              strokeWidth={LINE_WIDTH}
              strokeDasharray="5 3"
              connectNulls
              dot={false}
              isAnimationActive={false}
            />
            <Brush
              dataKey="ts"
              height={24}
              stroke={COLORS.marker}
              tickFormatter={formatLondonShortDay}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SeriesPoint } from '../../api/types'
import { dayTicks } from '../../lib/chartTicks'
import { AXIS, CHART_HEIGHT, COLORS, LEGEND_STYLE, TOOLTIP_STYLE } from '../../lib/chartTheme'
import {
  formatGwTick,
  formatLondonDateTime,
  formatLondonShortDay,
  formatSignedMw,
} from '../../lib/format'

interface ErrorChartProps {
  points: SeriesPoint[]
}

interface Row {
  ts: number
  over: number | null
  under: number | null
}

function toRows(points: SeriesPoint[]): Row[] {
  return points
    .filter((p) => p.error !== null)
    .map((p) => {
      const error = p.error as number
      return {
        ts: Date.parse(p.t),
        over: error > 0 ? error : null,
        under: error <= 0 ? error : null,
      }
    })
}

export function ErrorChart({ points }: ErrorChartProps) {
  const rows = useMemo(() => toRows(points), [points])
  const ticks = useMemo(() => dayTicks(rows.map((r) => r.ts)), [rows])

  return (
    <div role="img" aria-label="Bar chart of forecast error over time">
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart data={rows} barCategoryGap={0}>
          <CartesianGrid vertical={false} stroke={COLORS.grid} />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            ticks={ticks}
            domain={['dataMin', 'dataMax']}
            tick={AXIS.tick}
            tickFormatter={formatLondonShortDay}
          />
          <YAxis
            tick={AXIS.tick}
            tickFormatter={formatGwTick}
            label={{ value: 'GW', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <ReferenceLine y={0} stroke={COLORS.marker} />
          <Tooltip
            {...TOOLTIP_STYLE}
            labelFormatter={(ts) => `${formatLondonDateTime(Number(ts))} UK time`}
            formatter={(value) => formatSignedMw(Number(value))}
          />
          <Legend verticalAlign="top" wrapperStyle={LEGEND_STYLE} />
          <Bar
            name="Too high (+, short)"
            dataKey="over"
            fill={COLORS.over}
            stackId="error"
            isAnimationActive={false}
          />
          <Bar
            name="Too low (−, long)"
            dataKey="under"
            fill={COLORS.under}
            stackId="error"
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

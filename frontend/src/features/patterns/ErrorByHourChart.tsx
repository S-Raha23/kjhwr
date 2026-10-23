import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ByHourRow } from '../../api/types'
import { Card } from '../../components/ui/Card'
import {
  AXIS,
  CHART_HEIGHT,
  COLORS,
  LEGEND_STYLE,
  LINE_WIDTH,
  TOOLTIP_STYLE,
} from '../../lib/chartTheme'
import { formatGwTick, formatHourOfDay, formatMw, formatSignedMw } from '../../lib/format'

interface ErrorByHourChartProps {
  rows: ByHourRow[]
}

export function ErrorByHourChart({ rows }: ErrorByHourChartProps) {
  return (
    <Card title="⑤ Error by hour of day" subtitle="Average MAE (bars) and bias (line) by UK hour.">
      <div role="img" aria-label="Chart of forecast MAE and bias by hour of day">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <ComposedChart data={rows}>
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis
              dataKey="hour_local"
              tick={AXIS.tick}
              tickFormatter={formatHourOfDay}
              interval={2}
              label={{ value: 'UK time', position: 'insideBottomRight', offset: -4, fontSize: 11 }}
            />
            <YAxis tick={AXIS.tick} tickFormatter={formatGwTick} />
            <ReferenceLine y={0} stroke={COLORS.marker} />
            <Tooltip
              {...TOOLTIP_STYLE}
              labelFormatter={(h) => formatHourOfDay(Number(h))}
              formatter={(value, name) =>
                name === 'Bias' ? formatSignedMw(Number(value)) : formatMw(Number(value))
              }
            />
            <Legend verticalAlign="top" wrapperStyle={LEGEND_STYLE} />
            <Bar name="MAE" dataKey="mae" fill={COLORS.forecast} isAnimationActive={false} />
            <Line
              name="Bias"
              dataKey="bias"
              stroke={COLORS.over}
              strokeWidth={LINE_WIDTH}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

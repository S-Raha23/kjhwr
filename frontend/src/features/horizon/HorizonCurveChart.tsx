import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HorizonPoint } from '../../api/types'
import {
  AXIS,
  CHART_HEIGHT,
  COLORS,
  LEGEND_STYLE,
  LINE_WIDTH,
  TOOLTIP_STYLE,
} from '../../lib/chartTheme'
import { CUTOFF_LEAD_RANGE_H } from '../../lib/constants'
import { formatGwTick, formatHours, formatMw, formatSignedMw } from '../../lib/format'

interface HorizonCurveChartProps {
  points: HorizonPoint[]
  /** Lead time chosen on the slider, marked on the curve when in custom lead-time mode. */
  selectedHorizonH: number | null
}

export function HorizonCurveChart({ points, selectedHorizonH }: HorizonCurveChartProps) {
  return (
    <div role="img" aria-label="Line chart of forecast MAE and bias against lead time">
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={points}>
          <CartesianGrid vertical={false} stroke={COLORS.grid} />
          <XAxis
            dataKey="horizon_h"
            type="number"
            domain={[0, 'dataMax']}
            tick={AXIS.tick}
            label={{
              value: 'Lead time (h)',
              position: 'insideBottomRight',
              offset: -4,
              fontSize: 11,
            }}
          />
          <YAxis
            tick={AXIS.tick}
            tickFormatter={formatGwTick}
            label={{ value: 'GW', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            labelFormatter={(h) => `Lead time ${formatHours(Number(h))}`}
            formatter={(value, name) =>
              name === 'Bias' ? formatSignedMw(Number(value)) : formatMw(Number(value))
            }
          />
          <Legend verticalAlign="top" wrapperStyle={LEGEND_STYLE} />
          <ReferenceArea
            x1={CUTOFF_LEAD_RANGE_H.min}
            x2={CUTOFF_LEAD_RANGE_H.max}
            fill={COLORS.band}
            fillOpacity={0.35}
            ifOverflow="visible"
          />
          {selectedHorizonH !== null && (
            <ReferenceLine x={selectedHorizonH} stroke={COLORS.marker} strokeDasharray="4 2" />
          )}
          <Line
            name="MAE"
            dataKey="mae"
            stroke={COLORS.forecast}
            strokeWidth={LINE_WIDTH}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            name="Bias"
            dataKey="bias"
            stroke={COLORS.over}
            strokeWidth={LINE_WIDTH}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

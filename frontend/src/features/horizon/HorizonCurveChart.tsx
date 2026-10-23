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
import { Card } from '../../components/ui/Card'
import { QueryState } from '../../components/ui/QueryState'
import { useHorizonCurve } from '../../hooks/useHorizonCurve'
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
  start: string
  end: string
  /** Lead time chosen on the slider, marked on the curve when in custom lead-time mode. */
  selectedHorizonH: number | null
}

export function HorizonCurveChart({ start, end, selectedHorizonH }: HorizonCurveChartProps) {
  const query = useHorizonCurve(start, end)

  return (
    <Card
      title="④ Accuracy vs lead time"
      subtitle="MAE and bias against how long before delivery the forecast was published. Shaded: lead times of the 11:00 D-1 decision."
    >
      <QueryState query={query} skeletonHeight={CHART_HEIGHT}>
        {({ points }) => (
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
                <YAxis tick={AXIS.tick} tickFormatter={formatGwTick} />
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
                  fillOpacity={0.4}
                  ifOverflow="visible"
                />
                {selectedHorizonH !== null && (
                  <ReferenceLine
                    x={selectedHorizonH}
                    stroke={COLORS.marker}
                    strokeDasharray="4 2"
                  />
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
        )}
      </QueryState>
    </Card>
  )
}

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
import { EmptyState } from '../../components/ui/EmptyState'
import {
  AXIS,
  CHART_HEIGHT,
  COLORS,
  LEGEND_STYLE,
  LINE_WIDTH,
  TOOLTIP_STYLE,
} from '../../lib/chartTheme'
import {
  formatGwTick,
  formatLondonClock,
  formatLondonDateTime,
  formatMw,
  formatMwh,
  formatPct,
  formatSignedMwh,
} from '../../lib/format'

interface DayViewProps {
  data: DayResponse
}

function DayChart({ data }: DayViewProps) {
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

  return (
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
          <YAxis
            tick={AXIS.tick}
            tickFormatter={formatGwTick}
            label={{ value: 'GW', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
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
            fillOpacity={0.55}
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
  )
}

function DayTotals({ totals }: { totals: DayResponse['totals'] }) {
  const items = [
    { label: 'Forecast energy', value: formatMwh(totals.forecast_mwh) },
    { label: 'Actual energy', value: formatMwh(totals.actual_mwh) },
    { label: 'Error', value: formatSignedMwh(totals.error_mwh) },
    {
      label: 'Error vs actual',
      value: totals.error_pct === null ? '–' : formatPct(totals.error_pct),
    },
  ]
  return (
    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-ink-50 p-3">
          <dt className="text-xs text-ink-500">{item.label}</dt>
          <dd className="mt-0.5 text-lg font-semibold text-ink-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** One delivery day: the forecast held at decision time, its 80 % range, the actual, and totals. */
export function DayView({ data }: DayViewProps) {
  if (data.points.length === 0) {
    return <EmptyState message="No forecast available before the cutoff for this day." />
  }
  return (
    <>
      <p className="mb-2 text-sm text-ink-500">
        Decision made {formatLondonDateTime(data.decision_time)} UK time
        {data.forecast_published && (
          <> using the forecast published {formatLondonDateTime(data.forecast_published)}</>
        )}
        .
      </p>
      <DayChart data={data} />
      <DayTotals totals={data.totals} />
    </>
  )
}

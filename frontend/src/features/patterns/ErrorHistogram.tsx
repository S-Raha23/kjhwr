import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Histogram, Summary } from '../../api/types'
import { AXIS, CHART_HEIGHT, COLORS, TOOLTIP_STYLE } from '../../lib/chartTheme'
import { formatGwTick, formatMw, formatSignedMw } from '../../lib/format'

interface ErrorHistogramProps {
  histogram: Histogram
  summary: Summary
}

interface Bin {
  lower: number
  upper: number
  count: number
}

function toBins({ bin_edges, counts }: Histogram): Bin[] {
  return counts.map((count, i) => ({ lower: bin_edges[i], upper: bin_edges[i + 1], count }))
}

function binContaining(bins: Bin[], value: number | null): number | null {
  if (value === null) return null
  const bin = bins.find((b) => value >= b.lower && value < b.upper) ?? bins[bins.length - 1]
  return bin?.lower ?? null
}

export function ErrorHistogram({ histogram, summary }: ErrorHistogramProps) {
  const bins = useMemo(() => toBins(histogram), [histogram])
  const p10Bin = binContaining(bins, summary.p10_signed)
  const p90Bin = binContaining(bins, summary.p90_signed)

  return (
    <div>
      <div role="img" aria-label="Histogram of signed forecast errors">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={bins} barCategoryGap={1}>
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis dataKey="lower" tick={AXIS.tick} tickFormatter={formatGwTick} interval={1} />
            <YAxis tick={AXIS.tick} allowDecimals={false} />
            <Tooltip
              {...TOOLTIP_STYLE}
              labelFormatter={(lower) => {
                const bin = bins.find((b) => b.lower === Number(lower))
                return bin ? `${formatSignedMw(bin.lower)} to ${formatSignedMw(bin.upper)}` : ''
              }}
              formatter={(count) => [`${count} hours`, 'Count']}
            />
            {p10Bin !== null && (
              <ReferenceLine x={p10Bin} stroke={COLORS.marker} strokeDasharray="4 2" />
            )}
            {p90Bin !== null && (
              <ReferenceLine x={p90Bin} stroke={COLORS.marker} strokeDasharray="4 2" />
            )}
            <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {bins.map((bin) => (
                <Cell key={bin.lower} fill={bin.lower >= 0 ? COLORS.over : COLORS.under} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-ink-500">
        Error in GW (forecast − actual); bars are hours. Dashed lines: P10{' '}
        {summary.p10_signed !== null && formatMw(summary.p10_signed)} and P90{' '}
        {summary.p90_signed !== null && formatMw(summary.p90_signed)}.
      </p>
    </div>
  )
}

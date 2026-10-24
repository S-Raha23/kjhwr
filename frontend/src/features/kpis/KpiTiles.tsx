import type { Summary } from '../../api/types'
import { InfoTooltip } from '../../components/ui/InfoTooltip'
import { CURTAILMENT_CAVEAT } from '../../lib/constants'
import { biasWords, formatGw, formatPct, formatSignedPower } from '../../lib/format'

interface KpiTilesProps {
  summary: Summary
}

interface Tile {
  label: string
  value: string
  note: string
  hint?: string
}

function buildTiles(summary: Summary): Tile[] {
  const { mae, wape_pct, bias, p90_abs, max_abs } = summary
  return [
    { label: 'MAE', value: formatGw(mae ?? 0), note: 'Mean absolute error' },
    { label: 'WAPE', value: formatPct(wape_pct ?? 0, 2), note: 'Error as share of wind energy' },
    {
      label: 'Bias (forecast − actual)',
      value: formatSignedPower(bias ?? 0),
      note: biasWords(bias ?? 0),
      hint: CURTAILMENT_CAVEAT,
    },
    {
      label: 'P90 absolute error',
      value: formatGw(p90_abs ?? 0),
      note: '9 hours in 10 the error was below this',
    },
    { label: 'Max error', value: formatGw(max_abs ?? 0), note: 'Worst single hour' },
  ]
}

export function KpiTiles({ summary }: KpiTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {buildTiles(summary).map((tile) => (
        <div
          key={tile.label}
          className="min-w-0 rounded-2xl border border-ink-100 bg-white p-4 shadow-card"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            {tile.label}
            {tile.hint && <InfoTooltip text={tile.hint} />}
          </p>
          <p className="mt-1 font-display text-3xl font-semibold text-ink-900">{tile.value}</p>
          <p className="mt-1 text-xs text-ink-500">{tile.note}</p>
        </div>
      ))}
    </div>
  )
}

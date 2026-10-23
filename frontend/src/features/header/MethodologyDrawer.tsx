import { useEffect } from 'react'
import type { Meta } from '../../api/types'
import { DATA_SOURCES, DECISION_CUTOFF_LABEL } from '../../lib/constants'
import { formatLondonDateTime } from '../../lib/format'

interface MethodologyDrawerProps {
  open: boolean
  meta: Meta | undefined
  onClose: () => void
}

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'Decision-time rule',
    body: `For every delivery day D (UK local), we use the latest WINDFOR forecast published at or before 11:00 UK time on D-1, the day-ahead auction gate closure. All hours of a day therefore come from one forecast run. The "custom lead time" mode instead uses, for each target time t, the latest forecast published at or before t − h. A forecast is never used if it was published after the decision time.`,
  },
  {
    heading: 'Half-hourly vs hourly',
    body: 'Actuals (FUELHH) are half-hourly; forecasts (WINDFOR) are hourly. Accuracy is measured at the forecast’s hourly timestamps only. Half-hourly actuals at :30 are drawn on the chart but excluded from all metrics.',
  },
  {
    heading: 'Error sign',
    body: 'Error = forecast − actual. Positive means the forecast was too high, so a buyer relying on it would have under-procured and been exposed to imbalance prices. Negative means the forecast was too low and the buyer would have over-bought.',
  },
  {
    heading: 'WAPE, not MAPE',
    body: 'Percentage error is WAPE = Σ|error| ÷ Σ actual: the error as a share of wind energy. Unlike MAPE it does not blow up in low-wind hours.',
  },
  {
    heading: 'Daily energy',
    body: 'Daily MWh totals are approximated from the hourly points (MW × 1 h).',
  },
  {
    heading: 'Typical error range (80 %)',
    body: 'The band on the delivery-day panel is built from the P10 and P90 of past forecast errors at similar lead times, so it shows the plausible range for actual wind, corrected for bias. It is in-sample: it is calibrated on the same month it is drawn on, so it flatters real out-of-sample performance.',
  },
  {
    heading: 'Why is the forecast biased high? (hypothesis)',
    body: 'In January 2026 the decision-time forecast ran well above actuals at every lead time. One possible explanation, to verify with the client: FUELHH reports metered output after curtailment (for example Scottish transmission constraints in high-wind periods), whereas WINDFOR forecasts unconstrained wind availability. Differences in coverage scope may also contribute.',
  },
]

export function MethodologyDrawer({ open, meta, onClose }: MethodologyDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-slate-900/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Methodology"
        className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Methodology</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close methodology"
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            ✕
          </button>
        </div>
        <section className="mb-4 text-sm">
          <h3 className="font-semibold text-slate-900">Data sources</h3>
          <ul className="mt-1 list-disc pl-5 text-indigo-700">
            {DATA_SOURCES.map((source) => (
              <li key={source.href}>
                <a href={source.href} target="_blank" rel="noreferrer" className="underline">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          {meta && (
            <p className="mt-2 text-slate-600">
              Snapshot fetched {formatLondonDateTime(meta.snapshot_fetched_at)} UK time ·{' '}
              {meta.counts.forecast_runs} forecast runs. Default decision point:{' '}
              {DECISION_CUTOFF_LABEL}.
            </p>
          )}
        </section>
        {SECTIONS.map((section) => (
          <section key={section.heading} className="mb-4 text-sm">
            <h3 className="font-semibold text-slate-900">{section.heading}</h3>
            <p className="mt-1 text-slate-600">{section.body}</p>
          </section>
        ))}
      </aside>
    </div>
  )
}

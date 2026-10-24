import { Card } from '../../components/ui/Card'
import { DATA_SOURCES, DECISION_CUTOFF_LABEL } from '../../lib/constants'
import { formatLondonDateTime } from '../../lib/format'

interface MethodContentProps {
  snapshotFetchedAt: string | undefined
  forecastRuns: number | undefined
}

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'The decision-time rule',
    body: 'For every delivery day D (UK local), we use the latest WINDFOR forecast published at or before 11:00 UK time on D-1, the day-ahead auction gate closure. All hours of a day therefore come from one forecast run. The "custom lead time" mode instead uses, for each target time t, the latest forecast published at or before t − h. A forecast is never used if it was published after the decision time.',
  },
  {
    heading: 'Half-hourly versus hourly',
    body: 'Actuals (FUELHH) are half-hourly; forecasts (WINDFOR) are hourly. Accuracy is measured at the forecast’s hourly timestamps only. Half-hourly actuals at :30 are drawn on the charts but excluded from all metrics.',
  },
  {
    heading: 'Sign of the error',
    body: 'Error = forecast − actual. Positive means the forecast was too high, so a buyer relying on it would have under-procured and been exposed to imbalance prices. Negative means the forecast was too low and the buyer would have over-bought.',
  },
  {
    heading: 'WAPE, not MAPE',
    body: 'Percentage error is WAPE = Σ|error| ÷ Σ actual: the error as a share of wind energy. Unlike MAPE it does not blow up in low-wind hours. Daily energy totals are approximated from the hourly points (MW × 1 h).',
  },
  {
    heading: 'The typical error range (80 %)',
    body: 'The band on a delivery-day chart is built from the P10 and P90 of past forecast errors at similar lead times, so it shows the plausible range for actual wind, corrected for bias. It is in-sample: it is calibrated on the same month it is drawn on, so it flatters real out-of-sample performance.',
  },
  {
    heading: 'Why is the forecast biased high? (a hypothesis)',
    body: 'In January 2026 the decision-time forecast ran well above actuals at every lead time. One possible explanation, to verify with the client: FUELHH reports metered output after curtailment (for example Scottish transmission constraints in high-wind periods), whereas WINDFOR forecasts unconstrained wind availability. Differences in coverage scope may also contribute.',
  },
  {
    heading: 'What this pilot does not cover',
    body: 'One month of national-level wind only: no regional detail, other fuels, demand or prices. The numbers describe January 2026 and should not be extrapolated to other seasons without more data.',
  },
]

export function MethodContent({ snapshotFetchedAt, forecastRuns }: MethodContentProps) {
  return (
    <div className="space-y-5">
      <Card title="Data sources">
        <ul className="list-disc space-y-1 pl-5 text-accent-700">
          {DATA_SOURCES.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer" className="underline">
                {source.label}
              </a>
            </li>
          ))}
        </ul>
        {snapshotFetchedAt && (
          <p className="mt-3 text-sm text-ink-500">
            Snapshot fetched {formatLondonDateTime(snapshotFetchedAt)} UK time
            {forecastRuns !== undefined && <> · {forecastRuns} forecast runs</>}. Default decision
            point: {DECISION_CUTOFF_LABEL}.
          </p>
        )}
      </Card>
      {SECTIONS.map((section) => (
        <Card key={section.heading} title={section.heading}>
          <p className="max-w-3xl leading-relaxed text-ink-600">{section.body}</p>
        </Card>
      ))}
    </div>
  )
}

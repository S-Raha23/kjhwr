import type { HorizonPoint, MetricsResponse } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { InfoTooltip } from '../../components/ui/InfoTooltip'
import { DECISION_CUTOFF_LABEL } from '../../lib/constants'
import { formatLondonDay } from '../../lib/format'
import { buildInsights } from './insights'

interface InsightStripProps {
  metrics: MetricsResponse
  curve: HorizonPoint[] | undefined
  onSelectDay: (day: string) => void
}

export function InsightStrip({ metrics, curve, onSelectDay }: InsightStripProps) {
  const insights = buildInsights(metrics, curve, DECISION_CUTOFF_LABEL)
  if (insights.length === 0) return null

  return (
    <Card title="Key insights">
      <ul className="space-y-1.5 text-sm text-slate-800">
        {insights.map((insight) => (
          <li key={insight.id}>
            {insight.text}
            {insight.days?.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => onSelectDay(day)}
                className="ml-2 rounded-full border border-indigo-200 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {formatLondonDay(day)}
              </button>
            ))}
            {insight.hint && <InfoTooltip text={insight.hint} />}
          </li>
        ))}
      </ul>
    </Card>
  )
}

import type { Mode } from '../../api/types'
import { Card } from '../../components/ui/Card'
import { DECISION_CUTOFF_LABEL } from '../../lib/constants'
import type { Filters } from '../../state/useFilters'
import { DateRangePicker } from './DateRangePicker'
import { HorizonSlider } from './HorizonSlider'

interface ControlsProps {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
}

export function Controls({ filters, onChange }: ControlsProps) {
  const setMode = (mode: Mode) => onChange({ mode })
  const horizonMode = filters.mode === 'horizon'

  return (
    <Card className="flex flex-col gap-3">
      <DateRangePicker
        start={filters.start}
        end={filters.end}
        onChange={(range) => onChange({ ...range, day: null })}
      />
      <fieldset className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2">
        <legend className="sr-only">Forecast selection mode</legend>
        <span className="text-sm font-medium text-slate-700">Mode</span>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            checked={!horizonMode}
            onChange={() => setMode('cutoff')}
            className="accent-indigo-600"
          />
          Decision time: {DECISION_CUTOFF_LABEL}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mode"
            checked={horizonMode}
            onChange={() => setMode('horizon')}
            className="accent-indigo-600"
          />
          Custom lead time
        </label>
        <HorizonSlider
          value={filters.horizonH}
          disabled={!horizonMode}
          onChange={(horizonH) => onChange({ horizonH })}
        />
      </fieldset>
      {horizonMode && (
        <p className="text-xs text-slate-500">
          Using latest forecast published ≥ {filters.horizonH} h before each half-hour.
        </p>
      )}
    </Card>
  )
}

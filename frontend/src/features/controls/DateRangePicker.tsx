import { PERIOD_END, PERIOD_START } from '../../lib/constants'
import { rangePresets } from './presets'

interface DateRangePickerProps {
  start: string
  end: string
  onChange: (range: { start: string; end: string }) => void
}

const PRESETS = rangePresets()
const INPUT_CLASS =
  'rounded-md border border-ink-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400'

export function DateRangePicker({ start, end, onChange }: DateRangePickerProps) {
  return (
    <fieldset className="flex min-w-0 flex-wrap items-center gap-2">
      <legend className="sr-only">Delivery date range</legend>
      <span className="text-sm font-medium text-ink-700">Delivery dates</span>
      <input
        type="date"
        aria-label="Start delivery date"
        className={INPUT_CLASS}
        min={PERIOD_START}
        max={end}
        value={start}
        onChange={(event) => event.target.value && onChange({ start: event.target.value, end })}
      />
      <span aria-hidden="true">→</span>
      <input
        type="date"
        aria-label="End delivery date"
        className={INPUT_CLASS}
        min={start}
        max={PERIOD_END}
        value={end}
        onChange={(event) => event.target.value && onChange({ start, end: event.target.value })}
      />
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((preset) => {
          const active = preset.start === start && preset.end === end
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ start: preset.start, end: preset.end })}
              className={`rounded-full border px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent-400 ${
                active
                  ? 'border-accent-600 bg-accent-600 text-white'
                  : 'border-ink-300 text-ink-700 hover:bg-ink-50'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

import { HORIZON_RANGE_H } from '../../lib/constants'

interface HorizonSliderProps {
  value: number
  disabled: boolean
  onChange: (hours: number) => void
}

export function HorizonSlider({ value, disabled, onChange }: HorizonSliderProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        aria-label="Lead time in hours"
        min={HORIZON_RANGE_H.min}
        max={HORIZON_RANGE_H.max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-40 accent-indigo-600 disabled:opacity-40"
      />
      <span className={`w-10 text-sm ${disabled ? 'text-slate-400' : 'text-slate-900'}`}>
        {value} h
      </span>
    </div>
  )
}

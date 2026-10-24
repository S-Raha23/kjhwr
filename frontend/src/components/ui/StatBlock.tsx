import { CountUp } from './CountUp'

interface StatBlockProps {
  value: number
  format: (value: number) => string
  label: string
  note?: string
}

/** A large, counting-up figure with a label, used for the story's headline numbers. */
export function StatBlock({ value, format, label, note }: StatBlockProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <p className="font-display text-4xl font-semibold text-ink-900 sm:text-5xl">
        <CountUp value={value} format={format} />
      </p>
      <p className="mt-2 text-sm font-semibold text-ink-700">{label}</p>
      {note && <p className="mt-1 text-sm text-ink-500">{note}</p>}
    </div>
  )
}

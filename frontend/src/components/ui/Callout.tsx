import type { ReactNode } from 'react'

interface CalloutProps {
  label: string
  children: ReactNode
}

/** A set-apart note: used for hypotheses and caveats the reader should not miss. */
export function Callout({ label, children }: CalloutProps) {
  return (
    <aside className="rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-5 text-ink-800">
      <p className="kicker text-amber-700">{label}</p>
      <div className="mt-2 text-base leading-relaxed">{children}</div>
    </aside>
  )
}

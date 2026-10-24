import type { ReactNode } from 'react'
import { Reveal } from '../../components/ui/Reveal'

export interface Takeaway {
  title: string
  body: ReactNode
}

interface DeskTakeawaysProps {
  items: Takeaway[]
}

/** The "so what for your desk" cards that close the story. */
export function DeskTakeaways({ items }: DeskTakeawaysProps) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((item, index) => (
        <Reveal key={item.title} delay={index * 120}>
          <article className="h-full rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="font-display text-4xl font-semibold text-accent-300">{index + 1}</p>
            <h3 className="mt-3 font-display text-xl font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-base leading-relaxed text-ink-200">{item.body}</p>
          </article>
        </Reveal>
      ))}
    </div>
  )
}

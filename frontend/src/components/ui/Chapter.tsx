import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

type Tone = 'paper' | 'white' | 'ink'

interface ChapterProps {
  id: string
  number: string
  kicker: string
  title: string
  lead?: ReactNode
  tone?: Tone
  children: ReactNode
}

const TONES: Record<Tone, { section: string; number: string; kicker: string; lead: string }> = {
  paper: {
    section: 'bg-paper text-ink-900',
    number: 'text-accent-200',
    kicker: 'text-accent-600',
    lead: 'text-ink-600',
  },
  white: {
    section: 'bg-white text-ink-900',
    number: 'text-accent-100',
    kicker: 'text-accent-600',
    lead: 'text-ink-600',
  },
  ink: {
    section: 'bg-ink-900 text-white',
    number: 'text-ink-700',
    kicker: 'text-accent-300',
    lead: 'text-ink-200',
  },
}

/** One chapter of the story: a numbered, full-width section with a heading and lead paragraph. */
export function Chapter({
  id,
  number,
  kicker,
  title,
  lead,
  tone = 'paper',
  children,
}: ChapterProps) {
  const styles = TONES[tone]
  return (
    <section id={id} className={`${styles.section} py-16 sm:py-24`}>
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p
            aria-hidden="true"
            className={`font-display text-7xl font-semibold leading-none sm:text-8xl ${styles.number}`}
          >
            {number}
          </p>
          <p className={`kicker mt-2 ${styles.kicker}`}>{kicker}</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-5xl">
            {title}
          </h2>
          {lead && (
            <p className={`mt-5 max-w-2xl text-lg leading-relaxed ${styles.lead}`}>{lead}</p>
          )}
        </Reveal>
        <div className="mt-10 sm:mt-14">{children}</div>
      </div>
    </section>
  )
}

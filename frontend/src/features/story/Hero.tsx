import { Link } from 'react-router-dom'
import type { Summary } from '../../api/types'
import { CountUp } from '../../components/ui/CountUp'
import { COLORS } from '../../lib/chartTheme'
import { formatGw, formatPct, formatSignedPower } from '../../lib/format'

interface HeroProps {
  summary: Summary | undefined
  exploreHref: string
}

const FLOW_LINES = [
  { d: 'M-50 120 C 200 40, 400 200, 650 110 S 1000 60, 1300 130', cls: 'animate-wind-slow' },
  { d: 'M-50 200 C 180 140, 420 280, 700 190 S 1020 150, 1300 210', cls: 'animate-wind-mid' },
  { d: 'M-50 290 C 220 230, 440 360, 720 280 S 1040 240, 1300 300', cls: 'animate-wind-fast' },
  { d: 'M-50 370 C 160 330, 460 430, 740 360 S 1060 330, 1300 380', cls: 'animate-wind-slow' },
] as const

/** Decorative flowing wind lines; they stand still for users who prefer reduced motion. */
function WindLines() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1250 440"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 -z-10 h-full w-full opacity-25"
      fill="none"
    >
      {FLOW_LINES.map((line) => (
        <path
          key={line.d}
          d={line.d}
          stroke="url(#wind-gradient)"
          strokeWidth="1.5"
          strokeDasharray="220 380"
          className={`${line.cls} motion-reduce:animate-none`}
        />
      ))}
      <defs>
        <linearGradient id="wind-gradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={COLORS.windEdge} stopOpacity="0" />
          <stop offset="0.5" stopColor={COLORS.windCore} />
          <stop offset="1" stopColor={COLORS.windEdge} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

interface HeroStat {
  value: number | null
  format: (value: number) => string
  label: string
}

function heroStats(summary: Summary): HeroStat[] {
  return [
    { value: summary.mae, format: formatGw, label: 'average miss, hour by hour' },
    { value: summary.wape_pct, format: (v) => formatPct(v), label: 'of all wind energy' },
    {
      value: summary.bias,
      format: formatSignedPower,
      label: 'forecast above reality, on average',
    },
  ]
}

export function Hero({ summary, exploreHref }: HeroProps) {
  const stats = summary ? heroStats(summary) : []

  return (
    <section className="relative isolate overflow-hidden bg-ink-900 text-white">
      <WindLines />
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <p className="kicker text-accent-300">Pilot study · GB national wind · January 2026</p>
        <h1 className="mt-5 max-w-4xl font-display text-4xl font-semibold leading-[1.08] sm:text-6xl">
          At 11:00 you commit to tomorrow. How far can you trust the wind forecast in your hand?
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-200">
          We replayed every day-ahead decision of January 2026: what the forecast said at the moment
          you had to buy, against what the wind actually delivered.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#decision"
            className="rounded-full bg-accent-400 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-accent-300 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Follow the story ↓
          </a>
          <Link
            to={exploreHref}
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Jump to the data
          </Link>
        </div>
        <dl className="mt-14 grid gap-6 border-t border-white/15 pt-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-5xl font-semibold text-white sm:text-6xl">
                {stat.value !== null && <CountUp value={stat.value} format={stat.format} />}
              </dd>
              <p className="mt-1 text-sm text-ink-300">{stat.label}</p>
            </div>
          ))}
          {!summary && <div className="h-24 animate-pulse rounded-lg bg-white/10 sm:col-span-3" />}
        </dl>
      </div>
    </section>
  )
}

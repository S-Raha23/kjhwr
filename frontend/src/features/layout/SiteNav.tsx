import { NavLink } from 'react-router-dom'
import { useScrollProgress } from '../../hooks/useScrollProgress'
import { ROUTES } from '../../lib/constants'

const LINKS = [
  { to: ROUTES.story, label: 'The story', end: true },
  { to: ROUTES.explore, label: 'Explore', end: false },
  { to: ROUTES.method, label: 'Method', end: false },
] as const

function WindMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-accent-500" />
      <path
        d="M6 12h13a3 3 0 1 0-3-3M6 17h18a3 3 0 1 1-3 3M6 22h9"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SiteNav() {
  const progress = useScrollProgress()

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-900/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <NavLink to={ROUTES.story} className="flex items-center gap-2.5 font-display text-lg">
          <WindMark />
          <span className="hidden sm:inline">Wind Forecast Decision Portal</span>
          <span className="sm:hidden">Wind Portal</span>
        </NavLink>
        <nav aria-label="Main" className="flex gap-1 text-sm font-medium">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 transition focus:outline-none focus:ring-2 focus:ring-accent-300 ${
                  isActive ? 'bg-white/15 text-white' : 'text-ink-200 hover:bg-white/10'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div
        aria-hidden="true"
        className="h-0.5 origin-left bg-accent-400"
        style={{ transform: `scaleX(${progress})` }}
      />
    </header>
  )
}

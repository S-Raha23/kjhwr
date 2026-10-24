import { Link } from 'react-router-dom'
import { useMeta } from '../../hooks/useMeta'
import { DATA_SOURCES, ROUTES } from '../../lib/constants'
import { formatLondonDateTime } from '../../lib/format'

export function SiteFooter() {
  const meta = useMeta()

  return (
    <footer className="bg-ink-900 text-ink-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg text-white">Wind Forecast Decision Portal</p>
          <p className="mt-2 text-sm">
            A pilot for GB day-ahead power buying: what the wind forecast said at decision time, and
            how right it was.
          </p>
        </div>
        <div>
          <p className="kicker text-accent-300">Data</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {DATA_SOURCES.map((source) => (
              <li key={source.href}>
                <a href={source.href} target="_blank" rel="noreferrer" className="underline">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          {meta.data && (
            <p className="mt-3 text-xs text-ink-300">
              Snapshot fetched {formatLondonDateTime(meta.data.snapshot_fetched_at)} UK time.
            </p>
          )}
        </div>
        <div>
          <p className="kicker text-accent-300">Go deeper</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link to={ROUTES.explore} className="underline">
                Explore every day
              </Link>
            </li>
            <li>
              <Link to={ROUTES.method} className="underline">
                How we measured it
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}

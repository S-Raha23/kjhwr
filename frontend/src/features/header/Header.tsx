import type { Meta } from '../../api/types'
import { formatLondonDateTime } from '../../lib/format'

interface HeaderProps {
  meta: Meta | undefined
  onOpenMethodology: () => void
}

export function Header({ meta, onOpenMethodology }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Wind Forecast Decision Portal</h1>
          <p className="text-sm text-slate-500">
            GB national wind · Jan 2026 pilot
            {meta && (
              <>
                {' '}
                · {meta.source} · snapshot {formatLondonDateTime(meta.snapshot_fetched_at)} UK time
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenMethodology}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Methodology
        </button>
      </div>
    </header>
  )
}

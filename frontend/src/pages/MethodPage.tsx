import { MethodContent } from '../features/method/MethodContent'
import { useMeta } from '../hooks/useMeta'

export default function MethodPage() {
  const meta = useMeta()

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8">
        <p className="kicker text-accent-600">Method</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">
          How we measured it
        </h1>
        <p className="mt-2 max-w-2xl text-ink-600">
          The rules behind every number in this portal, so each can be checked and challenged.
        </p>
      </header>
      <MethodContent
        snapshotFetchedAt={meta.data?.snapshot_fetched_at}
        forecastRuns={meta.data?.counts.forecast_runs}
      />
    </div>
  )
}

import { Link } from 'react-router-dom'
import { ROUTES } from '../lib/constants'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="kicker text-accent-600">404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">Page not found</h1>
      <p className="mt-3 text-ink-600">That page does not exist in this portal.</p>
      <Link
        to={ROUTES.story}
        className="mt-6 inline-block rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-accent-400"
      >
        Back to the story
      </Link>
    </div>
  )
}

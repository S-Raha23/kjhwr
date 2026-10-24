import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => vi.unstubAllGlobals())

function renderAt(path: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('routing', () => {
  it('opens on the story with the hero question and a nav to the other pages', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/At 11:00 you commit/)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toHaveTextContent('The story')
    expect(nav).toHaveTextContent('Explore')
    expect(nav).toHaveTextContent('Method')
  })

  it('shows the explorer at /explore', () => {
    renderAt('/explore')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Every day, every hour')
  })

  it('shows the methodology at /method', () => {
    renderAt('/method')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('How we measured it')
  })

  it('shows a not-found page for unknown routes', () => {
    renderAt('/nope')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found')
  })
})

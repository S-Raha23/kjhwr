import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CountUp } from './CountUp'
import { Reveal } from './Reveal'

afterEach(() => vi.unstubAllGlobals())

describe('without IntersectionObserver', () => {
  it('CountUp shows the final value immediately', () => {
    render(<CountUp value={1995.6} format={(v) => `${v.toFixed(1)} MW`} />)
    expect(screen.getByText('1995.6 MW')).toBeInTheDocument()
  })

  it('Reveal renders its children visible', () => {
    render(
      <Reveal>
        <p>content</p>
      </Reveal>,
    )
    expect(screen.getByText('content').parentElement).toHaveClass('opacity-100')
  })
})

describe('with IntersectionObserver', () => {
  function stubObserver(isIntersecting: boolean) {
    class FakeObserver {
      private readonly callback: IntersectionObserverCallback
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
      }
      observe() {
        if (isIntersecting) {
          this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
        }
      }
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  }

  it('CountUp starts at zero until it scrolls into view', () => {
    stubObserver(false)
    render(<CountUp value={50} format={(v) => `n=${Math.round(v)}`} />)
    expect(screen.getByText('n=0')).toBeInTheDocument()
  })

  it('Reveal stays hidden until it scrolls into view, then shows', () => {
    stubObserver(false)
    const { unmount } = render(
      <Reveal>
        <p>content</p>
      </Reveal>,
    )
    expect(screen.getByText('content').parentElement).toHaveClass('opacity-0')
    unmount()

    stubObserver(true)
    render(
      <Reveal>
        <p>content</p>
      </Reveal>,
    )
    expect(screen.getByText('content').parentElement).toHaveClass('opacity-100')
  })
})

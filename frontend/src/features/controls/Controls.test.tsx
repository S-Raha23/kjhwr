import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useFilters } from '../../state/useFilters'
import { Controls } from './Controls'

function Harness() {
  const { filters, update } = useFilters()
  return <Controls filters={filters} onChange={update} />
}

describe('Controls', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'))

  it('disables the slider in cutoff mode and enables it in custom lead-time mode', async () => {
    render(<Harness />)
    const slider = screen.getByLabelText('Lead time in hours')
    expect(slider).toBeDisabled()
    await userEvent.click(screen.getByLabelText('Custom lead time'))
    expect(slider).toBeEnabled()
  })

  it('reflects the mode and horizon in the URL', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByLabelText('Custom lead time'))
    expect(window.location.search).toBe('?mode=horizon&horizon=24')
    await userEvent.click(screen.getByLabelText(/Decision time/))
    expect(window.location.search).toBe('')
  })

  it('applies a range preset', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Week 2' }))
    expect(window.location.search).toBe('?start=2026-01-09&end=2026-01-15')
  })
})

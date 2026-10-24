import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ByDayRow } from '../../api/types'
import { DayStrip } from './DayStrip'

const row = (day: string, bias: number): ByDayRow => ({
  day,
  mae: Math.abs(bias),
  bias,
  wape_pct: 10,
  forecast_published: '2026-01-01T09:30:00Z',
  actual_mwh: 1,
  forecast_mwh: 2,
})

// 2 Jan 2026 is a Friday
const ROWS = [row('2026-01-02', 3000), row('2026-01-03', -1000), row('2026-01-04', 500)]

describe('DayStrip', () => {
  it('renders one labelled button per delivery day', () => {
    render(<DayStrip rows={ROWS} onSelectDay={() => undefined} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('button', { name: /Fri 2 Jan.*too high by 3.00 GW/ })).toBeVisible()
    expect(screen.getByRole('button', { name: /Sat 3 Jan.*too low by 1.00 GW/ })).toBeVisible()
  })

  it('offsets the first day to its weekday column', () => {
    const { container } = render(<DayStrip rows={ROWS} onSelectDay={() => undefined} />)
    const gaps = container.querySelectorAll('[role="list"] > span')
    expect(gaps).toHaveLength(4)
  })

  it('reports the clicked day', async () => {
    const onSelectDay = vi.fn()
    render(<DayStrip rows={ROWS} onSelectDay={onSelectDay} />)
    await userEvent.click(screen.getByRole('button', { name: /Sun 4 Jan/ }))
    expect(onSelectDay).toHaveBeenCalledWith('2026-01-04')
  })

  it('renders nothing for an empty month', () => {
    const { container } = render(<DayStrip rows={[]} onSelectDay={() => undefined} />)
    expect(container).toBeEmptyDOMElement()
  })
})

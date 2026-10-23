import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Summary } from '../../api/types'
import { KpiTiles } from './KpiTiles'

const summary: Summary = {
  n: 744,
  mae: 1995.6,
  rmse: 2498.8,
  bias: 1728,
  wape_pct: 17.68,
  p50_abs: 1625.5,
  p90_abs: 4183.9,
  max_abs: 6857,
  p10_signed: -502.7,
  p90_signed: 4183.9,
  mean_actual: 11285.5,
  share_over_forecast_pct: 84.3,
}

describe('KpiTiles', () => {
  it('renders the headline values', () => {
    render(<KpiTiles summary={summary} />)
    expect(screen.getByText('2.00 GW')).toBeInTheDocument()
    expect(screen.getByText('17.68%')).toBeInTheDocument()
    expect(screen.getByText('4.18 GW')).toBeInTheDocument()
    expect(screen.getByText('6.86 GW')).toBeInTheDocument()
  })

  it('words a positive bias as a too-high forecast', () => {
    render(<KpiTiles summary={summary} />)
    expect(screen.getByText('+1.73 GW')).toBeInTheDocument()
    expect(screen.getByText(/Forecast too high by 1.73 GW/)).toBeInTheDocument()
  })

  it('words a negative bias as a too-low forecast', () => {
    render(<KpiTiles summary={{ ...summary, bias: -800 }} />)
    expect(screen.getByText('−800 MW')).toBeInTheDocument()
    expect(screen.getByText(/Forecast too low by 800 MW/)).toBeInTheDocument()
  })
})

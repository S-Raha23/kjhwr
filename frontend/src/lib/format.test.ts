import { describe, expect, it } from 'vitest'
import {
  biasWords,
  formatGw,
  formatLondonDateTime,
  formatLondonDay,
  formatMw,
  formatPower,
  formatSignedMw,
  toLondonDay,
} from './format'

describe('power formatting', () => {
  it('formats MW with thousands separators', () => {
    expect(formatMw(1995.6)).toBe('1,996 MW')
  })

  it('formats GW with two decimals', () => {
    expect(formatGw(1727.98)).toBe('1.73 GW')
  })

  it('switches to GW from 1,000 MW', () => {
    expect(formatPower(999)).toBe('999 MW')
    expect(formatPower(1000)).toBe('1.00 GW')
  })

  it('signs values with + and a true minus', () => {
    expect(formatSignedMw(250)).toBe('+250 MW')
    expect(formatSignedMw(-250)).toBe('−250 MW')
  })

  it('words the bias direction', () => {
    expect(biasWords(1728)).toContain('too high by 1.73 GW')
    expect(biasWords(-500)).toContain('too low by 500 MW')
  })
})

describe('London time formatting', () => {
  it('shows winter time as UTC', () => {
    expect(formatLondonDateTime('2026-01-15T14:00:00Z')).toBe('Thu 15 Jan 14:00')
  })

  it('shifts an hour in British Summer Time', () => {
    expect(formatLondonDateTime('2026-07-10T10:00:00Z')).toBe('Fri 10 Jul 11:00')
  })

  it('formats a delivery day and finds the London date of an instant', () => {
    expect(formatLondonDay('2026-01-15')).toBe('Thu 15 Jan')
    expect(toLondonDay('2026-07-09T23:30:00Z')).toBe('2026-07-10')
  })
})

import { formatInTimeZone } from 'date-fns-tz'
import { DISPLAY_TIMEZONE, GW_THRESHOLD_MW } from './constants'

const integer = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
const MW_PER_GW = 1000
const MINUS = '−'

function signed(value: number, text: string): string {
  if (value > 0) return `+${text}`
  if (value < 0) return `${MINUS}${text}`
  return text
}

export function formatMw(mw: number): string {
  return `${integer.format(mw)} MW`
}

export function formatSignedMw(mw: number): string {
  return signed(mw, formatMw(Math.abs(mw)))
}

export function formatGw(mw: number): string {
  return `${(mw / MW_PER_GW).toFixed(2)} GW`
}

/** GW (2 dp) for values of 1,000 MW and above, MW otherwise. */
export function formatPower(mw: number): string {
  return Math.abs(mw) >= GW_THRESHOLD_MW ? formatGw(mw) : formatMw(mw)
}

export function formatSignedPower(mw: number): string {
  return signed(mw, formatPower(Math.abs(mw)))
}

export function formatMwh(mwh: number): string {
  return `${integer.format(mwh)} MWh`
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`
}

export function biasWords(biasMw: number): string {
  if (biasMw > 0) return `Forecast too high by ${formatPower(biasMw)} — you'd be short`
  if (biasMw < 0) return `Forecast too low by ${formatPower(-biasMw)} — you'd be long`
  return 'No average bias'
}

const DATE_TIME = 'EEE d MMM HH:mm'
const DAY = 'EEE d MMM'
const SHORT_DAY = 'd MMM'

export function formatLondonDateTime(iso: string | number): string {
  return formatInTimeZone(iso, DISPLAY_TIMEZONE, DATE_TIME)
}

export function formatLondonDay(isoDate: string): string {
  return formatInTimeZone(`${isoDate}T12:00:00Z`, DISPLAY_TIMEZONE, DAY)
}

export function formatLondonShortDay(iso: string | number): string {
  return formatInTimeZone(iso, DISPLAY_TIMEZONE, SHORT_DAY)
}

export function formatLondonClock(iso: string | number): string {
  return formatInTimeZone(iso, DISPLAY_TIMEZONE, 'HH:mm')
}

export function formatHourOfDay(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

export function formatGwTick(mw: number): string {
  return String(mw / MW_PER_GW)
}

/** London calendar date (yyyy-MM-dd) of an instant. */
export function toLondonDay(instant: string | number): string {
  return formatInTimeZone(instant, DISPLAY_TIMEZONE, 'yyyy-MM-dd')
}

export function formatSignedMwh(mwh: number): string {
  return signed(mwh, formatMwh(Math.abs(mwh)))
}

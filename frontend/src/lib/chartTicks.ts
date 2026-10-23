import { toLondonDay } from './format'

const MAX_DAY_TICKS = 10

/** One tick per London day (at its first data point), thinned to at most ~MAX_DAY_TICKS. */
export function dayTicks(timestamps: number[]): number[] {
  const firstOfDay: number[] = []
  let previousDay = ''
  for (const ts of timestamps) {
    const day = toLondonDay(ts)
    if (day !== previousDay) firstOfDay.push(ts)
    previousDay = day
  }
  const step = Math.max(1, Math.ceil(firstOfDay.length / MAX_DAY_TICKS))
  return firstOfDay.filter((_, index) => index % step === 0)
}

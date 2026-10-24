import { useEffect, useState } from 'react'
import { useInView } from '../../hooks/useInView'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface CountUpProps {
  value: number
  format: (value: number) => string
  durationMs?: number
}

const DEFAULT_DURATION_MS = 1400

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/** A number that counts up from zero when it scrolls into view (static where motion is off). */
export function CountUp({ value, format, durationMs = DEFAULT_DURATION_MS }: CountUpProps) {
  const { ref, inView, supported } = useInView<HTMLSpanElement>()
  const reducedMotion = useReducedMotion()
  const animate = supported && !reducedMotion
  const [shown, setShown] = useState<number | null>(null)

  useEffect(() => {
    if (!animate || !inView) return
    let frame = 0
    const started = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / durationMs)
      setShown(progress < 1 ? value * easeOutCubic(progress) : null)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animate, inView, value, durationMs])

  const waiting = animate && !inView
  return <span ref={ref}>{format(shown ?? (waiting ? 0 : value))}</span>
}

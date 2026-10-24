import { useEffect, useRef, useState } from 'react'

const VISIBLE_FRACTION = 0.15

/**
 * Becomes true (and stays true) once the element scrolls into view.
 * `supported` is false where IntersectionObserver is missing; callers should then skip animation.
 */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const supported = typeof IntersectionObserver !== 'undefined'
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!supported || !element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold: VISIBLE_FRACTION },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [supported])

  return { ref, inView: seen || !supported, supported }
}

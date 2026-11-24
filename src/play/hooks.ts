import { useEffect, useRef, useState } from 'react'

/** Counts a number up from zero, for the score on a results card. Jumps straight there under reduced motion. */
export function useCountUp(target: number, reduced: boolean, ms = 1100) {
  const [v, setV] = useState(reduced ? target : 0)
  useEffect(() => {
    if (reduced) {
      setV(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      // Ease out: quick at first, then settling on the number.
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, reduced, ms])
  return v
}

/** A countdown in seconds. rAF stops in a hidden tab and the step is capped, so a background tab never loses time. */
export function useClock(limit: number, running: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(limit)
  const leftRef = useRef(limit)
  const end = useRef(onEnd)
  end.current = onEnd

  useEffect(() => {
    leftRef.current = limit
    setLeft(limit)
  }, [limit])

  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000)
      last = t
      leftRef.current = Math.max(0, leftRef.current - dt)
      setLeft(leftRef.current)
      if (leftRef.current <= 0) {
        end.current()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running])

  return {
    left,
    /** Takes time off, as the cluster game's Step button does. */
    spend(s: number) {
      leftRef.current = Math.max(0.001, leftRef.current - s)
      setLeft(leftRef.current)
    },
    reset(to: number) {
      leftRef.current = to
      setLeft(to)
    },
  }
}

/** The pixel size of an element, kept current. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

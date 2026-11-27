import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Grows its child from 90% to full width as it rises into view, tied to the scroll position (so it moves at the
 * reader's pace, slowly, and reverses when they scroll back). Off under reduced motion.
 */
export function ScrollGrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 when its top is at the bottom of the screen, 1 when its top reaches 20% from the top.
      const t = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.8)))
      const e = 1 - Math.pow(1 - t, 3)
      el.style.transform = `scale(${0.9 + 0.1 * e})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return (
    <div ref={ref} className={`origin-top will-change-transform ${className}`}>
      {children}
    </div>
  )
}

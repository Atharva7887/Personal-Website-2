import { useEffect, useRef, useState } from 'react'

/** Read after mount so prerendered HTML and first client render match. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** Adds `is-in` to every `.reveal` inside the returned ref once it scrolls into view. */
export function useReveals<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const host = ref.current
    if (!host) return
    const els = Array.from(host.querySelectorAll<HTMLElement>('.reveal'))
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -10% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return ref
}

/** Magnetic pull toward the pointer for primary buttons (bigger effective hit area). */
export function useMagnet<T extends HTMLElement>(strength = 0.3) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let settle = 0
    // Entering at the edge used to snap the button ~40px in one frame; a short ease-in carries it there instead,
    // and leaving mid-way (or coming straight back) retargets from wherever it currently is.
    const enter = () => {
      window.clearTimeout(settle)
      el.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)'
      settle = window.setTimeout(() => (el.style.transition = ''), 200)
    }
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`
    }
    const leave = () => {
      window.clearTimeout(settle)
      el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1.4)'
      el.style.transform = ''
      settle = window.setTimeout(() => (el.style.transition = ''), 500)
    }
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      window.clearTimeout(settle)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [strength])
  return ref
}

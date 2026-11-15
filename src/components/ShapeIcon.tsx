import { useEffect, useRef } from 'react'
import { shape, type ShapeName } from '../three/shapes'

/**
 * A small 2D-canvas rendering of the same point clouds as the hero (one
 * visual system, no extra WebGL contexts). Turns slowly while `active`.
 */
export function ShapeIcon({ name, active, size = 72 }: { name: ShapeName; active: boolean; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const angle = useRef(0.6)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = Math.min(window.devicePixelRatio, 2)
    c.width = size * dpr
    c.height = size * dpr
    const ctx = c.getContext('2d')
    if (!ctx) return
    const pts = shape(name, 700)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = performance.now()
    const draw = () => {
      const now = performance.now()
      if (active && !reduced) angle.current += ((now - last) / 1000) * 0.9
      last = now
      const ca = Math.cos(angle.current)
      const sa = Math.sin(angle.current)
      ctx.clearRect(0, 0, c.width, c.height)
      const s = (c.width / 2) * 0.36
      for (let i = 0; i < pts.length; i += 3) {
        const x = pts[i] * ca + pts[i + 2] * sa
        const z = -pts[i] * sa + pts[i + 2] * ca
        const y = pts[i + 1]
        ctx.fillStyle = i % 21 === 0 ? '#2f45ff' : 'rgba(12,15,20,' + (0.45 + z * 0.12).toFixed(2) + ')'
        ctx.fillRect(c.width / 2 + x * s, c.height / 2 - y * s, 1.4 * dpr, 1.4 * dpr)
      }
      if (active && !reduced) raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [name, active, size])

  return <canvas ref={ref} aria-hidden="true" style={{ width: size, height: size }} />
}

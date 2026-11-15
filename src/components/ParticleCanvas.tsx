import { useEffect, useRef } from 'react'
import type { ParticleHandle, ParticleOptions } from '../three/particleScene'
import type { ShapeName } from '../three/shapes'
import { useReducedMotion } from './motion'

interface Props {
  shapes: ShapeName[]
  /** Controlled shape (Work panel, case pages). */
  shape?: ShapeName
  autoplay?: boolean
  colors: ParticleOptions['colors']
  layout?: ParticleOptions['layout']
  density?: number
  className?: string
}

/** three.js is loaded only in the browser, after first paint, in its own chunk. */
export function ParticleCanvas({ shapes, shape, autoplay, colors, layout, density, className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const handle = useRef<ParticleHandle | null>(null)
  const reduced = useReducedMotion()
  const shapeRef = useRef(shape)
  shapeRef.current = shape

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let cancelled = false
    import('../three/particleScene').then(({ mountParticles }) => {
      if (cancelled) return
      try {
        handle.current = mountParticles(canvas, {
          shapes: shapeRef.current ? [shapeRef.current, ...shapes] : shapes,
          autoplay,
          colors,
          layout,
          density,
          reduced,
        })
        canvas.style.opacity = '1'
      } catch {
        /* No WebGL: the page reads fine without the particles. */
      }
    })
    return () => {
      cancelled = true
      handle.current?.dispose()
      handle.current = null
    }
    // Remount only when motion preference changes; other props are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  useEffect(() => {
    if (shape) handle.current?.setShape(shape)
  }, [shape])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={'pointer-events-none opacity-0 transition-opacity duration-1000 ' + className}
    />
  )
}

import { useEffect, useRef, useState } from 'react'

// 5 x 7 dot-matrix glyphs for "4" and "0".
const GLYPHS: Record<string, string[]> = {
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
}

interface Dot {
  hx: number // home position, in grid units
  hy: number
  x: number
  y: number
  vx: number
  vy: number
  outlier?: boolean
}

/** Builds "404" out of dots, plus one stray dot well away from the rest: the visitor. */
function buildDots(): Dot[] {
  const dots: Dot[] = []
  '404'.split('').forEach((ch, i) => {
    GLYPHS[ch].forEach((row, y) =>
      row.split('').forEach((c, x) => {
        if (c !== '#') return
        // Two dots per cell (a finer matrix reads better at this size).
        for (const [dx, dy] of [[0, 0], [0.5, 0], [0, 0.5], [0.5, 0.5]]) {
          const hx = i * 6.4 + x + dx
          const hy = y + dy
          dots.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0 })
        }
      }),
    )
  })
  dots.push({ hx: 21.6, hy: -1.6, x: 21.6, y: -1.6, vx: 0, vy: 0, outlier: true })
  return dots
}

const COLS = 18.4 // width of "404" in grid units
const ROWS = 7

export function NotFound() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [drawn, setDrawn] = useState(false)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dots = buildDots()
    const pointer = { x: -1e4, y: -1e4, down: false }
    let unit = 10
    let ox = 0
    let oy = 0
    let raf = 0
    let burst = 0

    const resize = () => {
      const r = c.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio, 2)
      c.width = r.width * dpr
      c.height = r.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Wide screens: the stray dot floats off to the right. Narrow ones: above the last 4.
      const narrow = r.width / r.height < 1.6
      const out = dots[dots.length - 1]
      out.hx = narrow ? COLS - 1.2 : 21.6
      out.hy = narrow ? -2.6 : -1.6
      unit = Math.min(r.width / (COLS + (narrow ? 2.5 : 6)), r.height / (ROWS + 5))
      ox = (r.width - COLS * unit) / 2
      oy = (r.height - ROWS * unit) / 2 + unit * 1.2
    }
    resize()

    const draw = () => {
      const r = c.getBoundingClientRect()
      ctx.clearRect(0, 0, r.width, r.height)
      const out = dots[dots.length - 1]
      // A dashed line from the stray dot back to the pack: how far off it is.
      ctx.setLineDash([4, 6])
      ctx.strokeStyle = 'rgba(47,69,255,.45)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(ox + out.x * unit, oy + out.y * unit)
      ctx.lineTo(ox + (COLS - 0.5) * unit, oy + 0.5 * unit)
      ctx.stroke()
      ctx.setLineDash([])
      for (const d of dots) {
        const speed = Math.min(1, Math.hypot(d.vx, d.vy) * 4)
        const rad = unit * (d.outlier ? 0.34 : 0.2)
        ctx.fillStyle = d.outlier ? '#2f45ff' : '#0c0f14'
        ctx.beginPath()
        // Stretch a little in the direction of travel.
        const ang = Math.atan2(d.vy, d.vx)
        ctx.ellipse(ox + d.x * unit, oy + d.y * unit, rad * (1 + speed * 0.6), rad * (1 - speed * 0.3), ang, 0, Math.PI * 2)
        ctx.fill()
      }
      // The label follows the stray dot (set directly: this runs every frame).
      const lx = ox + out.x * unit
      const el = label.current
      if (el) {
        const left = lx + 14 + el.offsetWidth > r.width ? lx - 14 - el.offsetWidth : lx + 14
        el.style.transform = `translate(${left}px, ${oy + out.y * unit - 34}px)`
      }
    }

    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const px = (pointer.x - ox) / unit
      const py = (pointer.y - oy) / unit
      for (const d of dots) {
        // Spring home…
        let ax = (d.hx - d.x) * 60
        let ay = (d.hy - d.y) * 60
        // …and get out of the pointer's way.
        const dx = d.x - px
        const dy = d.y - py
        const dist = Math.hypot(dx, dy)
        const reach = d.outlier ? 1.4 : 2.6
        if (dist < reach && dist > 0.0001) {
          const f = (1 - dist / reach) * (d.outlier ? 260 : 520)
          ax += (dx / dist) * f
          ay += (dy / dist) * f
        }
        d.vx = (d.vx + ax * dt) * Math.pow(0.0009, dt)
        d.vy = (d.vy + ay * dt) * Math.pow(0.0009, dt)
        d.x += d.vx * dt
        d.y += d.vy * dt
      }
      if (burst > 0) burst -= dt
      draw()
      raf = requestAnimationFrame(tick)
    }

    const toLocal = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
    }
    const onMove = (e: PointerEvent) => toLocal(e)
    const onLeave = () => {
      pointer.x = pointer.y = -1e4
    }
    // A click scatters every dot; they find their way back.
    const onDown = (e: PointerEvent) => {
      toLocal(e)
      if (reduced) return
      const px = (pointer.x - ox) / unit
      const py = (pointer.y - oy) / unit
      for (const d of dots) {
        const a = Math.atan2(d.y - py, d.x - px) + (Math.random() - 0.5) * 0.8
        const s = 18 + Math.random() * 22
        d.vx += Math.cos(a) * s
        d.vy += Math.sin(a) * s
      }
      burst = 1
    }

    const onResize = () => {
      resize()
      if (reduced) draw()
    }
    window.addEventListener('resize', onResize)
    if (reduced) {
      raf = requestAnimationFrame(draw) // after the label has mounted
    } else {
      c.addEventListener('pointermove', onMove)
      c.addEventListener('pointerleave', onLeave)
      c.addEventListener('pointerdown', onDown)
      // Arrive scattered, then assemble.
      for (const d of dots) {
        d.x = d.hx + (Math.random() - 0.5) * 30
        d.y = d.hy + (Math.random() - 0.5) * 14
      }
      raf = requestAnimationFrame(tick)
    }
    setDrawn(true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      c.removeEventListener('pointermove', onMove)
      c.removeEventListener('pointerleave', onLeave)
      c.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return (
    <main id="main" className="relative flex min-h-[100svh] flex-col bg-fog text-ink">
      <header className="flex items-center justify-between p-5 sm:p-7">
        <a href="/" className="flex min-h-[44px] items-center font-display text-lg font-semibold">
          AS<span className="text-volt">.</span>
        </a>
        <p className="text-sm tabular-nums text-slate">Error 404</p>
      </header>

      <div className="relative h-[34svh] min-h-[220px] w-full sm:h-[44svh]">
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full cursor-crosshair touch-none" />
        {/* Before the script runs (or without it), a plain 404. */}
        {!drawn && (
          <p aria-hidden="true" className="absolute inset-0 grid place-items-center font-display text-[clamp(6rem,22vw,16rem)] font-semibold leading-none tracking-[-0.06em]">
            404
          </p>
        )}
        {drawn && (
          <span
            ref={label}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full bg-volt px-3 py-1 text-xs font-medium text-white"
          >
            you are here
          </span>
        )}
      </div>

      <section className="mx-auto w-full max-w-3xl px-5 pb-12 pt-4 text-center sm:px-8">
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]">This page is an outlier.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate">
          It sits about 4.04 standard deviations from anything on this site. The link may be old, or the address mistyped. Nudge the dots while you’re here, or head back.
        </p>
        <nav aria-label="Ways back" className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/" className="btn btn-ink px-7">
            Back to the home page
          </a>
          <a href="/#work" className="btn btn-ghost bg-white/60">
            See my work
          </a>
          <a href="/studio/" className="btn btn-ghost bg-white/60">
            Visit the studio
          </a>
          <a href="/play/" className="btn btn-ghost bg-white/60">
            Play a game
          </a>
        </nav>
        <p className="mt-8 text-sm text-slate">p = 0.404. Not significant. Probably just noise.</p>
      </section>
    </main>
  )
}

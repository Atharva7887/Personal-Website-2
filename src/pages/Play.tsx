import { useCallback, useEffect, useRef, useState } from 'react'
import { SubpageHeader } from '../components/SubpageHeader'

type V = { x: number; y: number }
interface Level {
  name: string
  hint: string
  f: (x: number, y: number) => number
  start: V
  hole: V
  par: number
  lr: number
  mom: number
}

const g = (x: number, y: number, cx: number, cy: number, s: number) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / s)

const LEVELS: Level[] = [
  {
    name: 'The bowl',
    hint: 'A smooth bowl. Almost any learning rate gets there.',
    f: (x, y) => 0.5 * (x * x + y * y),
    start: { x: -2.3, y: 2.0 },
    hole: { x: 0, y: 0 },
    par: 1,
    lr: 0.3,
    mom: 0,
  },
  {
    name: 'The long valley',
    hint: 'Steep walls, a gentle floor. Too big a step bounces off the walls; too small crawls. Try momentum.',
    f: (x, y) => 0.5 * (0.12 * x * x + 3.5 * y * y),
    start: { x: -2.6, y: 1.3 },
    hole: { x: 0, y: 0 },
    par: 2,
    lr: 0.1,
    mom: 0,
  },
  {
    name: 'The trap',
    hint: 'A shallow pit sits between you and the deep hole. Momentum can carry you over the lip.',
    f: (x, y) => -1.25 * g(x, y, 1.3, -0.5, 0.7) - 0.6 * g(x, y, -1.2, 0.7, 0.45) + 0.04 * (x * x + y * y),
    start: { x: -2.3, y: 1.5 },
    hole: { x: 1.3, y: -0.5 },
    par: 2,
    lr: 0.5,
    mom: 0,
  },
  {
    name: 'The banana',
    hint: 'The Rosenbrock valley, a classic optimiser test. Curved, flat, and slow.',
    f: (x, y) => 0.12 * ((1 - x) ** 2 + 6 * (y - x * x) ** 2),
    start: { x: -1.8, y: 2.4 },
    hole: { x: 1, y: 1 },
    par: 3,
    lr: 0.15,
    mom: 0.5,
  },
]

const RANGE = 3
const STEPS = 60
const HOLE_R = 0.2

function grad(f: Level['f'], x: number, y: number): V {
  const h = 1e-3
  return { x: (f(x + h, y) - f(x - h, y)) / (2 * h), y: (f(x, y + h) - f(x, y - h)) / (2 * h) }
}

function loadBest(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('gd-golf-best') || '{}')
  } catch {
    return {}
  }
}
function saveBest(b: Record<string, number>) {
  try {
    localStorage.setItem('gd-golf-best', JSON.stringify(b))
  } catch {
    /* private mode: scores just aren't kept */
  }
}

export function Play() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const field = useRef<HTMLCanvasElement | null>(null)
  const [level, setLevel] = useState(0)
  const L = LEVELS[level]
  const [lr, setLr] = useState(L.lr)
  const [mom, setMom] = useState(L.mom)
  const [ball, setBall] = useState<V>(L.start)
  const [trail, setTrail] = useState<V[]>([])
  const [strokes, setStrokes] = useState(0)
  const [state, setState] = useState<'ready' | 'rolling' | 'sunk' | 'off'>('ready')
  const [best, setBest] = useState<Record<string, number>>({})
  const anim = useRef(0)

  useEffect(() => setBest(loadBest()), [])

  const reset = useCallback(
    (idx = level) => {
      cancelAnimationFrame(anim.current)
      const lv = LEVELS[idx]
      setLevel(idx)
      setLr(lv.lr)
      setMom(lv.mom)
      setBall(lv.start)
      setTrail([])
      setStrokes(0)
      setState('ready')
      field.current = null
    },
    [level],
  )

  // Draw the loss landscape once per level into an offscreen canvas.
  const paintField = (size: number) => {
    const off = document.createElement('canvas')
    off.width = off.height = size
    const ctx = off.getContext('2d')!
    const img = ctx.createImageData(size, size)
    let min = Infinity
    let max = -Infinity
    const vals = new Float32Array(size * size)
    for (let j = 0; j < size; j++)
      for (let i = 0; i < size; i++) {
        const x = (i / size) * 2 * RANGE - RANGE
        const y = RANGE - (j / size) * 2 * RANGE
        const v = L.f(x, y)
        vals[j * size + i] = v
        if (v < min) min = v
        if (v > max) max = v
      }
    for (let k = 0; k < vals.length; k++) {
      const t = Math.pow((vals[k] - min) / (max - min || 1), 0.45)
      const band = Math.floor(t * 14) % 2 === 0 ? 0 : 10
      // Low = deep blue, high = pale fog.
      img.data[k * 4] = 47 + (228 - 47) * t - band
      img.data[k * 4 + 1] = 69 + (231 - 69) * t - band
      img.data[k * 4 + 2] = 255 + (236 - 255) * t - band
      img.data[k * 4 + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    return off
  }

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const dpr = Math.min(window.devicePixelRatio, 2)
    const css = c.clientWidth
    c.width = c.height = Math.round(css * dpr)
    if (!field.current) field.current = paintField(220)
    const ctx = c.getContext('2d')!
    const S = c.width
    const toPx = (p: V) => ({ x: ((p.x + RANGE) / (2 * RANGE)) * S, y: ((RANGE - p.y) / (2 * RANGE)) * S })
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(field.current, 0, 0, S, S)
    // hole + flag
    const h = toPx(L.hole)
    ctx.fillStyle = '#0c0f14'
    ctx.beginPath()
    ctx.arc(h.x, h.y, (HOLE_R / (2 * RANGE)) * S, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#0c0f14'
    ctx.lineWidth = 2 * dpr
    ctx.beginPath()
    ctx.moveTo(h.x, h.y)
    ctx.lineTo(h.x, h.y - 40 * dpr)
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(h.x, h.y - 40 * dpr)
    ctx.lineTo(h.x + 18 * dpr, h.y - 33 * dpr)
    ctx.lineTo(h.x, h.y - 26 * dpr)
    ctx.fill()
    // trail
    if (trail.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,.85)'
      ctx.lineWidth = 2 * dpr
      ctx.setLineDash([4 * dpr, 4 * dpr])
      ctx.beginPath()
      trail.forEach((p, i) => {
        const q = toPx(p)
        if (i) ctx.lineTo(q.x, q.y)
        else ctx.moveTo(q.x, q.y)
      })
      ctx.stroke()
      ctx.setLineDash([])
    }
    // ball
    if (state !== 'sunk') {
      const b = toPx(ball)
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#0c0f14'
      ctx.lineWidth = 2 * dpr
      ctx.beginPath()
      ctx.arc(b.x, b.y, 8 * dpr, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }, [ball, trail, state, level, L])

  const shoot = () => {
    if (state === 'rolling' || state === 'sunk') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const shot = strokes + 1
    setStrokes(shot)
    setState('rolling')
    let p = { ...ball }
    let v = { x: 0, y: 0 }
    const path: V[] = [p]
    let i = 0
    let outcome: 'ready' | 'sunk' | 'off' = 'ready'
    const step = () => {
      const gr = grad(L.f, p.x, p.y)
      v = { x: mom * v.x - lr * gr.x, y: mom * v.y - lr * gr.y }
      p = { x: p.x + v.x, y: p.y + v.y }
      path.push(p)
      i++
      if (Math.hypot(p.x - L.hole.x, p.y - L.hole.y) < HOLE_R) outcome = 'sunk'
      else if (Math.abs(p.x) > RANGE || Math.abs(p.y) > RANGE || !Number.isFinite(p.x)) outcome = 'off'
      return outcome !== 'ready' || i >= STEPS || Math.hypot(v.x, v.y) < 1e-4
    }
    const finish = () => {
      if (outcome === 'off') {
        setState('off')
        setTrail(path.slice(0, -1))
        setBall(path[0]) // back to where the shot started
        return
      }
      setBall(p)
      setTrail(path)
      setState(outcome === 'sunk' ? 'sunk' : 'ready')
      if (outcome === 'sunk') {
        const b = loadBest()
        if (!b[L.name] || shot < b[L.name]) {
          b[L.name] = shot
          saveBest(b)
          setBest(b)
        }
      }
    }
    if (reduced) {
      while (!step()) {
        /* run instantly */
      }
      finish()
      return
    }
    let lastT = 0
    const tick = (t: number) => {
      if (t - lastT > 28) {
        lastT = t
        const done = step()
        setBall(p)
        setTrail([...path])
        if (done) return finish()
      }
      anim.current = requestAnimationFrame(tick)
    }
    anim.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => cancelAnimationFrame(anim.current), [])

  const message =
    state === 'sunk'
      ? `In the hole in ${strokes} ${strokes === 1 ? 'shot' : 'shots'}${strokes <= L.par ? '. Under or on par.' : '.'}`
      : state === 'off'
        ? 'Diverged: the step was too big and the ball flew off the landscape. One stroke penalty. Try a smaller learning rate.'
        : state === 'rolling'
          ? 'Rolling…'
          : L.hint

  return (
    <>
      <SubpageHeader />
      <main id="main" className="page pb-24 pt-12 sm:pt-16">
        <h1 className="text-[clamp(2.8rem,8vw,7rem)] font-semibold leading-[0.9] tracking-[-0.045em]">Gradient descent golf</h1>
        <p className="mt-5 max-w-2xl text-lg text-slate">
          Machine learning models learn by rolling downhill on a loss landscape. Here you are the optimiser: set the
          learning rate (step size) and momentum, then take a shot. Darker blue is lower. Sink the ball in as few shots as
          you can.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <canvas
              ref={canvas}
              role="img"
              aria-label={`${L.name}: loss landscape with the ball and the hole`}
              className="aspect-square w-full max-w-[640px] rounded-3xl border border-ink/10"
            />
          </div>

          <div>
            <div role="tablist" aria-label="Levels" className="flex flex-wrap gap-2">
              {LEVELS.map((lv, i) => (
                <button
                  key={lv.name}
                  role="tab"
                  aria-selected={i === level}
                  onClick={() => reset(i)}
                  className={'btn min-h-[44px] px-4 text-sm ' + (i === level ? 'btn-ink' : 'btn-ghost')}
                >
                  {i + 1}. {lv.name}
                </button>
              ))}
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-ink/15 text-center">
              {[
                ['Shots', strokes],
                ['Par', L.par],
                ['Best', best[L.name] ?? '–'],
              ].map(([k, v]) => (
                <div key={k} className="bg-fog p-4">
                  <dt className="text-sm text-slate">{k}</dt>
                  <dd className="font-display text-3xl font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>

            <label className="mt-8 block">
              <span className="flex justify-between font-medium">
                Learning rate <span className="tabular-nums">{lr.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0.01}
                max={1.6}
                step={0.01}
                value={lr}
                onChange={(e) => setLr(Number(e.target.value))}
                className="mt-2 w-full accent-[#2f45ff]"
              />
            </label>
            <label className="mt-6 block">
              <span className="flex justify-between font-medium">
                Momentum <span className="tabular-nums">{mom.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={0.95}
                step={0.01}
                value={mom}
                onChange={(e) => setMom(Number(e.target.value))}
                className="mt-2 w-full accent-[#2f45ff]"
              />
            </label>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={shoot} disabled={state === 'rolling' || state === 'sunk'} className="btn btn-ink disabled:opacity-50">
                Take a shot
              </button>
              <button onClick={() => (state === 'sunk' && level < LEVELS.length - 1 ? reset(level + 1) : reset())} className="btn btn-ghost">
                {state === 'sunk' && level < LEVELS.length - 1 ? 'Next level' : 'Restart level'}
              </button>
            </div>

            <p
              aria-live="polite"
              key={state + strokes}
              className={
                'mt-6 min-h-[4.5rem] rounded-2xl p-4 ' +
                (state === 'sunk' ? 'animate-[pop_.45s_cubic-bezier(.2,.8,.2,1.4)] bg-volt text-white' : state === 'off' ? 'bg-ink text-fog' : 'bg-white/70')
              }
            >
              {message}
            </p>
          </div>
        </div>
      </main>
    </>
  )
}

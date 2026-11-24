import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../../components/motion'
import { gameById } from '../../play/games'
import { useClock, useSize } from '../../play/hooks'
import { clamp, fmtScore, rng } from '../../play/math'
import { sfx } from '../../play/sound'
import { loadBest, saveBest } from '../../play/storage'
import { Bar, GameIntro, PauseCard, PlayBar, ResultsCard, usePause } from '../../play/ui'

const game = gameById('overfit')

// ---- The data ----
interface Pt {
  x: number
  y: number
}
interface Round {
  train: Pt[]
  valid: Pt[]
  truth: (x: number) => number
  noise: number
  limit: number
  name: string
  hint: string
}

const ROUNDS = 3
const LIMITS = [40, 40, 45] // seconds per round
const YMAX = 1.7
const GAP = 0.018 // how close two knots may be in x

/** Three rounds that get harder: more wiggle in the truth, more noise in the measurements. */
function makeRound(i: number, seed: number): Round {
  const r = rng(seed + i * 977)
  const phase = r.next()
  const specs = [
    { n: 12, noise: 0.17, limit: LIMITS[0], name: 'A gentle wave', hint: 'Easy. Not much noise, so trust the trend.', f: (x: number) => 0.8 * Math.sin(2 * Math.PI * (x + phase)) },
    { n: 15, noise: 0.24, limit: LIMITS[1], name: 'Wave with a tilt', hint: 'More noise. A few dots are lying to you.', f: (x: number) => 0.65 * Math.sin(2 * Math.PI * (1.25 * x + phase)) + 0.5 * (x - 0.5) },
    { n: 18, noise: 0.32, limit: LIMITS[2], name: 'Two humps in the fog', hint: 'Loud noise. The truth is simpler than the dots.', f: (x: number) => 0.55 * Math.sin(2 * Math.PI * (1.6 * x + phase)) + 0.25 * Math.cos(2 * Math.PI * 0.7 * x) },
  ][i]
  const train: Pt[] = []
  for (let k = 0; k < specs.n; k++) {
    // Jittered grid, so there is always a gap or two that invites overfitting.
    const x = clamp((k + 0.5 + (r.next() - 0.5) * 0.7) / specs.n, 0.02, 0.98)
    train.push({ x, y: specs.f(x) + r.gauss() * specs.noise })
  }
  const valid: Pt[] = []
  for (let k = 0; k < 26; k++) {
    const x = 0.02 + r.next() * 0.96
    valid.push({ x, y: specs.f(x) + r.gauss() * specs.noise })
  }
  valid.sort((a, b) => a.x - b.x)
  return { train, valid, truth: specs.f, noise: specs.noise, limit: specs.limit, name: specs.name, hint: specs.hint }
}

// ---- The model: a smooth curve through the player's knots ----
interface Knot extends Pt {
  id: number
}

/** Cubic Hermite through the knots, flat beyond the ends. More knots means a more flexible (and more overfit-prone) model. */
function predict(knots: Knot[], x: number): number {
  const n = knots.length
  if (n === 0) return 0
  if (n === 1 || x <= knots[0].x) return knots[0].y
  if (x >= knots[n - 1].x) return knots[n - 1].y
  let i = 0
  while (i < n - 2 && x > knots[i + 1].x) i++
  const a = knots[i]
  const b = knots[i + 1]
  const slope = (j: number) => {
    const p = knots[Math.max(0, j - 1)]
    const q = knots[Math.min(n - 1, j + 1)]
    return (q.y - p.y) / Math.max(1e-3, q.x - p.x)
  }
  const h = Math.max(1e-3, b.x - a.x)
  const t = (x - a.x) / h
  const t2 = t * t
  const t3 = t2 * t
  return (2 * t3 - 3 * t2 + 1) * a.y + (t3 - 2 * t2 + t) * h * slope(i) + (-2 * t3 + 3 * t2) * b.y + (t3 - t2) * h * slope(i + 1)
}

const mse = (knots: Knot[], pts: Pt[]) => pts.reduce((s, p) => s + (predict(knots, p.x) - p.y) ** 2, 0) / pts.length

/** R squared on the validation points: 1 is perfect, 0 is no better than the average, below 0 is worse. */
function r2(knots: Knot[], pts: Pt[]) {
  const mean = pts.reduce((s, p) => s + p.y, 0) / pts.length
  const tot = pts.reduce((s, p) => s + (p.y - mean) ** 2, 0)
  const res = pts.reduce((s, p) => s + (predict(knots, p.x) - p.y) ** 2, 0)
  return 1 - res / tot
}

type Phase = 'intro' | 'fit' | 'reveal' | 'done'
interface Result {
  round: number
  score: number
  val: number
  train: number
  r2: number
  knots: number
  timeUp: boolean
}

function roundPun(r: Result, noise: number) {
  if (r.knots < 3) return 'Underfit. The model is a ruler.'
  // A training loss under the noise floor is the tell: no honest model can fit noise that well.
  if (r.train < noise * noise * 0.45) return 'Overfit. Training loss below the noise floor means it memorised the noise.'
  if (r.val > r.train * 4 + noise * noise) return 'Overfit. It memorised the noise and called it a pattern.'
  if (r.r2 > 0.8) return 'Just right. The bias and the variance shook hands.'
  if (r.r2 < 0.45) return 'Missed the pattern. The dashed line shows what the data was really doing.'
  return 'Decent. A smoother curve would have generalised better.'
}

function finalPun(total: number) {
  if (total >= 2400) return 'Your validation loss is lower than most papers’. Please do not tune on the test set.'
  if (total >= 1700) return 'Generalises well. Would regularise again.'
  if (total >= 900) return 'Somewhere between underfit and overfit, which is where most models live.'
  return 'Perfect training loss, terrible validation loss. A classic.'
}

const PAD = 18

export default function Overfit() {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('intro')
  const [paused, setPaused] = useState(false)
  const [roundIx, setRoundIx] = useState(0)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const round = useMemo(() => makeRound(roundIx, seed), [roundIx, seed])
  const [knots, setKnots] = useState<Knot[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [shown, setShown] = useState(0) // validation points revealed so far
  const [held, setHeld] = useState<number | null>(null)
  const [cursor, setCursor] = useState<Pt | null>(null) // keyboard cursor
  const [best, setBest] = useState<number | null>(null)
  const [bestRun, setBestRun] = useState<{ best: number; isNew: boolean } | null>(null)
  const nextId = useRef(1)
  const drag = useRef<{ id: number; moved: boolean; sx: number; sy: number } | null>(null)
  const [wrap, size] = useSize<HTMLDivElement>()
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => setBest(loadBest(game.id)), [])

  const fitting = phase === 'fit'
  const [timedOut, setTimedOut] = useState(false)
  const submit = useCallback((timeUp: boolean) => {
    setPhase((p) => (p === 'fit' ? 'reveal' : p))
    setTimedOut(timeUp)
  }, [])
  const clock = useClock(round.limit, fitting && !paused, () => submit(true))

  // Data to pixels. y runs up the page.
  const W = Math.max(1, size.w)
  const H = Math.max(1, size.h)
  const sx = (x: number) => PAD + x * (W - PAD * 2)
  const sy = (y: number) => H / 2 - (y / YMAX) * (H / 2 - PAD)
  const ux = (px: number) => clamp((px - PAD) / (W - PAD * 2), 0, 1)
  const uy = (py: number) => clamp(((H / 2 - py) / (H / 2 - PAD)) * YMAX, -YMAX, YMAX)

  const sorted = useMemo(() => [...knots].sort((a, b) => a.x - b.x), [knots])
  const trainLoss = mse(sorted, round.train)

  const path = useMemo(() => {
    if (sorted.length === 0 || W < 2) return ''
    const steps = 180
    let d = ''
    for (let i = 0; i <= steps; i++) {
      const x = i / steps
      d += `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(predict(sorted, x)).toFixed(1)}`
    }
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, W, H])
  const truthPath = useMemo(() => {
    if (W < 2) return ''
    let d = ''
    for (let i = 0; i <= 120; i++) d += `${i ? 'L' : 'M'}${sx(i / 120).toFixed(1)} ${sy(round.truth(i / 120)).toFixed(1)}`
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, W, H])

  // ---- Placing, moving and removing points ----
  const addKnot = (x: number, y: number) => {
    if (knots.length >= round.train.length) return
    if (knots.some((k) => Math.abs(k.x - x) < GAP)) return
    sfx.place((y + YMAX) / (2 * YMAX))
    setKnots((k) => [...k, { id: nextId.current++, x, y }])
  }
  const localPoint = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onPlotDown = (e: React.PointerEvent) => {
    if (!fitting || paused) return
    setCursor(null)
    const p = localPoint(e)
    addKnot(ux(p.x), uy(p.y))
  }
  const onKnotDown = (e: React.PointerEvent, k: Knot) => {
    if (!fitting || paused) return
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    drag.current = { id: k.id, moved: false, sx: e.clientX, sy: e.clientY }
    setHeld(k.id)
    sfx.grab()
  }
  const onKnotMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return
    d.moved = true
    const p = localPoint(e)
    setKnots((all) => {
      const s = [...all].sort((a, b) => a.x - b.x)
      const i = s.findIndex((k) => k.id === d.id)
      // A knot may not pass its neighbours, so the curve stays a function of x.
      const lo = i > 0 ? s[i - 1].x + GAP : 0
      const hi = i < s.length - 1 ? s[i + 1].x - GAP : 1
      return all.map((k) => (k.id === d.id ? { ...k, x: clamp(ux(p.x), lo, Math.max(lo, hi)), y: uy(p.y) } : k))
    })
  }
  const onKnotUp = () => {
    const d = drag.current
    drag.current = null
    setHeld(null)
    // A tap without a drag takes the point away again.
    if (d && !d.moved) {
      sfx.remove()
      setKnots((all) => all.filter((k) => k.id !== d.id))
    }
  }
  const undo = () => {
    if (!fitting || knots.length === 0) return
    sfx.remove()
    setKnots((all) => all.filter((k) => k.id !== Math.max(...all.map((x) => x.id))))
  }
  const clear = () => {
    if (!fitting || knots.length === 0) return
    sfx.remove()
    setKnots([])
  }

  // Keyboard: a cursor moves with the arrows, Enter drops or lifts a point, Backspace undoes, Ctrl+Enter checks.
  const onPlotKey = (e: React.KeyboardEvent) => {
    if (!fitting || paused) return
    const big = e.shiftKey ? 4 : 1
    const c = cursor ?? { x: 0.5, y: 0 }
    const move = (dx: number, dy: number) => {
      e.preventDefault()
      setCursor({ x: clamp(c.x + dx * 0.02 * big, 0, 1), y: clamp(c.y + dy * 0.06 * big, -YMAX, YMAX) })
    }
    if (e.key === 'ArrowLeft') move(-1, 0)
    else if (e.key === 'ArrowRight') move(1, 0)
    else if (e.key === 'ArrowUp') move(0, 1)
    else if (e.key === 'ArrowDown') move(0, -1)
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      submit(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const near = knots.find((k) => Math.abs(k.x - c.x) < 0.03)
      if (near) {
        sfx.remove()
        setKnots((all) => all.filter((k) => k.id !== near.id))
      } else addKnot(c.x, c.y)
      setCursor(c)
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      undo()
    }
  }

  // ---- Judging ----
  const result: Result | null = useMemo(() => {
    if (phase !== 'reveal' && phase !== 'done') return null
    const v = mse(sorted, round.valid)
    const rr = r2(sorted, round.valid)
    return { round: roundIx, score: Math.round(clamp(rr, 0, 1) * 1000), val: v, train: trainLoss, r2: rr, knots: sorted.length, timeUp: timedOut }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // The reveal: validation points drop in one at a time, each with a note that climbs.
  useEffect(() => {
    if (phase !== 'reveal') return
    if (reduced) {
      setShown(round.valid.length)
      return
    }
    setShown(0)
    let i = 0
    const id = window.setInterval(() => {
      i++
      sfx.reveal(i)
      setShown(i)
      if (i >= round.valid.length) window.clearInterval(id)
    }, 70)
    return () => window.clearInterval(id)
  }, [phase, reduced, round])

  const revealed = phase === 'reveal' && shown >= round.valid.length
  useEffect(() => {
    if (revealed && result) sfx.verdict(result.r2 > 0.6)
  }, [revealed, result])

  const startRound = (ix: number, nextSeed = seed) => {
    setRoundIx(ix)
    setSeed(nextSeed)
    setKnots([])
    setShown(0)
    setCursor(null)
    setTimedOut(false)
    clock.reset(LIMITS[ix])
    setPhase('fit')
  }
  const nextRound = () => {
    if (!result) return
    const all = [...results, result]
    setResults(all)
    if (roundIx + 1 < ROUNDS) startRound(roundIx + 1)
    else {
      const total = all.reduce((s, r) => s + r.score, 0)
      setBestRun(saveBest(game.id, total))
      setBest(loadBest(game.id))
      setPhase('done')
    }
  }
  const again = () => {
    setResults([])
    setBestRun(null)
    startRound(0, Math.floor(Math.random() * 1e9))
  }

  const pause = useCallback(() => setPaused(true), [])
  usePause(fitting && !paused, pause)

  // Tick sounds for the last five seconds.
  const secondsLeft = Math.ceil(clock.left)
  const lastTick = useRef(99)
  useEffect(() => {
    if (!fitting || paused) return
    if (secondsLeft !== lastTick.current && secondsLeft <= 5 && secondsLeft > 0) sfx.tick()
    lastTick.current = secondsLeft
  }, [secondsLeft, fitting, paused])

  const total = results.reduce((s, r) => s + r.score, 0)
  const urgent = fitting && clock.left <= 8

  return (
    <main id="main" className="dark relative flex h-[100svh] flex-col overflow-hidden bg-[#0b0d1a] text-fog">
      <PlayBar>
        {fitting && (
          <button type="button" onClick={pause} aria-label="Pause" className="play-btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 text-fog hover:border-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        )}
      </PlayBar>

      {/* Round, clock and the temptation: training loss falls the more you chase the dots */}
      <div className="grid shrink-0 grid-cols-[1fr_auto] items-end gap-x-6 gap-y-2 px-4 sm:px-6">
        <div>
          <p className="text-sm text-mist">
            Round {roundIx + 1} of {ROUNDS} · {round.name}
          </p>
          <p className="mt-0.5 hidden text-fog/85 sm:block">{phase === 'fit' ? round.hint : phase === 'reveal' ? 'The hidden validation data, revealed.' : 'Drop points to bend the curve through the dots.'}</p>
        </div>
        <div className="text-right font-display tabular-nums">
          <p className="text-4xl font-semibold leading-none sm:text-5xl" style={urgent && !reduced ? { animation: 'play-blink 1s infinite', color: '#ffd29a' } : undefined}>
            {Math.ceil(clock.left)}
            <span className="text-lg font-normal text-mist"> s</span>
          </p>
        </div>
        <Bar value={clock.left / round.limit} danger={urgent} className="col-span-2" />
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-3 px-4 py-3 text-sm sm:px-6">
        <p>
          <span className="block text-mist">Train loss</span>
          <span className="font-display text-xl tabular-nums">{knots.length ? trainLoss.toFixed(3) : '—'}</span>
        </p>
        <p>
          <span className="block text-mist">Points</span>
          <span className="font-display text-xl tabular-nums">
            {knots.length}
            <span className="text-mist"> / {round.train.length}</span>
          </span>
        </p>
        <p>
          <span className="block text-mist">Validation loss</span>
          <span className="font-display text-xl tabular-nums">{phase === 'reveal' || phase === 'done' ? (result?.val ?? 0).toFixed(3) : 'hidden'}</span>
        </p>
      </div>

      {/* The plot */}
      <div ref={wrap} className="relative mx-4 min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] sm:mx-6">
        <svg
          ref={svg}
          width={W}
          height={H}
          tabIndex={fitting ? 0 : -1}
          role="application"
          aria-label="Plot of noisy training points. Press Enter to drop a point at the cursor, arrow keys to move the cursor, Backspace to undo, Control and Enter to check your fit."
          onPointerDown={onPlotDown}
          onKeyDown={onPlotKey}
          onBlur={() => setCursor(null)}
          className="absolute inset-0 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
          style={{ cursor: fitting ? 'crosshair' : 'default' }}
        >
          {/* grid */}
          {[-1, -0.5, 0, 0.5, 1].map((v) => (
            <line key={v} x1={0} x2={W} y1={sy(v)} y2={sy(v)} stroke="#fff" strokeOpacity={v === 0 ? 0.14 : 0.06} />
          ))}
          {[0.25, 0.5, 0.75].map((v) => (
            <line key={v} y1={0} y2={H} x1={sx(v)} x2={sx(v)} stroke="#fff" strokeOpacity={0.06} />
          ))}

          {/* the truth, shown at the end */}
          {(phase === 'reveal' || phase === 'done') && revealed && (
            <path d={truthPath} fill="none" stroke="#ffd29a" strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" style={{ animation: 'fade-in .8s ease-out both' }} />
          )}

          {/* residuals on validation points */}
          {phase === 'reveal' &&
            round.valid.slice(0, shown).map((p, i) => (
              <line key={`r${i}`} x1={sx(p.x)} x2={sx(p.x)} y1={sy(p.y)} y2={sy(predict(sorted, p.x))} stroke="#ffd29a" strokeOpacity={0.55} strokeWidth={1.5} />
            ))}

          {/* the model */}
          {path && <path d={path} fill="none" stroke="#8c99ff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgb(140 153 255 / .6))' }} />}

          {/* training points */}
          {round.train.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5} fill="#fff" fillOpacity={0.92} />
          ))}

          {/* validation points */}
          {phase === 'reveal' &&
            round.valid.slice(0, shown).map((p, i) => (
              <circle key={`v${i}`} className="play-dot" cx={sx(p.x)} cy={sy(p.y)} r={5.5} fill="#0b0d1a" stroke="#ffd29a" strokeWidth={2.5} />
            ))}

          {/* keyboard cursor */}
          {fitting && cursor && (
            <g pointerEvents="none">
              <line x1={sx(cursor.x)} x2={sx(cursor.x)} y1={0} y2={H} stroke="#fff" strokeOpacity={0.25} strokeDasharray="4 4" />
              <circle cx={sx(cursor.x)} cy={sy(cursor.y)} r={11} fill="none" stroke="#fff" strokeWidth={2} />
            </g>
          )}

          {/* the player's points: a big invisible target under a small visible one */}
          {fitting &&
            sorted.map((k) => (
              <g
                key={k.id}
                className={`play-grab ${held === k.id ? 'is-held' : ''}`}
                onPointerDown={(e) => onKnotDown(e, k)}
                onPointerMove={onKnotMove}
                onPointerUp={onKnotUp}
                onPointerCancel={onKnotUp}
                style={{ cursor: 'grab', touchAction: 'none' }}
              >
                <circle cx={sx(k.x)} cy={sy(k.y)} r={24} fill="transparent" />
                <circle className="play-dot play-ring" cx={sx(k.x)} cy={sy(k.y)} r={9} fill="#8c99ff" stroke="#fff" strokeWidth={2.5} />
              </g>
            ))}
        </svg>

        {fitting && knots.length === 0 && (
          <p className="pointer-events-none absolute inset-x-0 top-5 mx-auto w-max max-w-[calc(100%-2rem)] rounded-full bg-voltsoft px-5 py-2.5 text-center font-medium text-ink" style={{ animation: 'play-pop .5s cubic-bezier(.2,.8,.2,1.3) .2s both' }}>
            <span className="sm:hidden">Tap to drop a point</span>
            <span className="hidden sm:inline">Click to drop a point. Drag it to bend the curve.</span>
          </p>
        )}

        {/* Round verdict: compact and low, over the part of the plot where there is rarely any data */}
        {phase === 'reveal' && revealed && result && (
          <div className="absolute inset-x-3 bottom-3 mx-auto max-w-2xl rounded-3xl bg-white p-4 text-ink shadow-2xl sm:bottom-4 sm:p-5" style={{ animation: 'play-rise .5s cubic-bezier(.2,.8,.2,1.2) both' }} role="status">
            <div className="flex items-center justify-between gap-x-4 sm:gap-x-5">
              <p className="font-display text-4xl font-semibold tabular-nums tracking-[-0.03em] sm:text-5xl">+{fmtScore(result.score)}</p>
              <p className="hidden text-sm text-slate sm:block">
                validation R² <span className="font-semibold tabular-nums text-ink">{result.r2.toFixed(2)}</span>
                <br />
                train {result.train.toFixed(3)} · validation {result.val.toFixed(3)}
                {result.timeUp ? ' · time up' : ''}
              </p>
              <button type="button" autoFocus onClick={nextRound} className="btn play-btn-press ml-auto bg-ink text-fog hover:bg-volt">
                {roundIx + 1 < ROUNDS ? 'Next round' : 'See my total'}
              </button>
            </div>
            <p className="mt-2 hidden font-display text-base leading-snug sm:block sm:text-lg">{roundPun(result, round.noise)}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 p-4 sm:p-6">
        <button type="button" onClick={undo} disabled={!fitting || knots.length === 0} className="btn play-btn-press border border-white/40 text-white hover:border-white disabled:opacity-35">
          Undo
        </button>
        <button type="button" onClick={clear} disabled={!fitting || knots.length === 0} className="btn play-btn-press border border-white/40 text-white hover:border-white disabled:opacity-35">
          Clear
        </button>
        <button type="button" onClick={() => submit(false)} disabled={!fitting || knots.length === 0} className="btn play-btn-press ml-auto bg-white px-7 text-ink hover:bg-voltsoft disabled:opacity-35">
          Check on validation data
        </button>
      </div>

      {phase === 'intro' && <GameIntro game={game} best={best} onStart={() => startRound(0)} />}
      {paused && fitting && <PauseCard onResume={() => setPaused(false)} onRestart={() => { setPaused(false); startRound(roundIx) }} />}

      {phase === 'done' && bestRun && (
        <ResultsCard
          game={game}
          verdict="Training complete."
          score={total}
          best={bestRun.best}
          isNew={bestRun.isNew}
          rows={results.map((r, i): [string, string] => [`Round ${i + 1}`, `${fmtScore(r.score)} · R² ${r.r2.toFixed(2)}`])}
          pun={finalPun(total)}
          shareText={`I scored ${fmtScore(total)} out of 3,000 on Overfit (validation R² ${(results.reduce((s, r) => s + r.r2, 0) / results.length).toFixed(2)}). Can you generalise better?`}
          onAgain={again}
        />
      )}
    </main>
  )
}

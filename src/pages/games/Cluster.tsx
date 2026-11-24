import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../../components/motion'
import { gameById } from '../../play/games'
import { useClock, useSize } from '../../play/hooks'
import { clamp, fmtScore, rng } from '../../play/math'
import { sfx } from '../../play/sound'
import { loadBest, saveBest } from '../../play/storage'
import { Bar, GameIntro, PauseCard, PlayBar, ResultsCard, usePause } from '../../play/ui'

const game = gameById('cluster')

interface P {
  x: number
  y: number
}
const COLOURS = ['#8c99ff', '#ffd29a', '#7ee2c0', '#ff9ab5', '#6cc7ff']
const ROUNDS = 3
const LIMITS = [30, 35, 40]
const STEP_COST = 2 // seconds, because compute is not free
const CONVERGED = 0.93 // fit at which k-means would call it done

interface Round {
  k: number
  pts: P[]
  /** The best SSE a thorough k-means run found: the target. */
  opt: number
  optCentres: P[]
  W: number
  H: number
  name: string
  hint: string
}

const d2 = (a: P, b: P) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2

function nearest(c: P[], p: P) {
  let bi = 0
  let bd = Infinity
  for (let i = 0; i < c.length; i++) {
    const d = d2(c[i], p)
    if (d < bd) {
      bd = d
      bi = i
    }
  }
  return { i: bi, d: bd }
}

function sse(c: P[], pts: P[]) {
  return pts.reduce((s, p) => s + nearest(c, p).d, 0)
}

/** Real k-means (k-means++ start, Lloyd steps, several restarts) to find what the player is aiming for. */
function solve(pts: P[], k: number, next: () => number) {
  let best = { cost: Infinity, c: [] as P[] }
  for (let rep = 0; rep < 14; rep++) {
    const c: P[] = [pts[Math.floor(next() * pts.length)]]
    while (c.length < k) {
      const ds = pts.map((p) => nearest(c, p).d)
      const sum = ds.reduce((a, b) => a + b, 0)
      let r = next() * sum
      let j = 0
      while (j < ds.length - 1 && (r -= ds[j]) > 0) j++
      c.push(pts[j])
    }
    let cur = c.map((p) => ({ ...p }))
    for (let it = 0; it < 30; it++) cur = lloyd(cur, pts)
    const cost = sse(cur, pts)
    if (cost < best.cost) best = { cost, c: cur }
  }
  return best
}

/** One k-means iteration: every centroid moves to the mean of the points it owns. */
function lloyd(c: P[], pts: P[]): P[] {
  const sum = c.map(() => ({ x: 0, y: 0, n: 0 }))
  for (const p of pts) {
    const s = sum[nearest(c, p).i]
    s.x += p.x
    s.y += p.y
    s.n++
  }
  return c.map((q, i) => (sum[i].n ? { x: sum[i].x / sum[i].n, y: sum[i].y / sum[i].n } : q))
}

/** Three rounds: more clusters, more overlap, then outliers that drag the means about. */
function makeRound(i: number, seed: number, portrait: boolean): Round {
  const r = rng(seed + i * 131)
  const W = portrait ? 1 : 1.6
  const H = portrait ? 1.3 : 1
  const spec = [
    { k: 3, sd: 0.055, n: 20, strays: 0, name: 'Three tidy blobs', hint: 'Easy. One centroid for each blob.' },
    { k: 4, sd: 0.075, n: 18, strays: 0, name: 'Four, and two touch', hint: 'Where one cluster ends is a matter of opinion.' },
    { k: 5, sd: 0.07, n: 16, strays: 8, name: 'Five, plus strays', hint: 'Outliers drag the mean. Park on the crowd, not the strays.' },
  ][i]
  const centres: P[] = []
  let minGap = (Math.min(W, H) * (i === 1 ? 0.3 : 0.34)) / (spec.k > 4 ? 1.15 : 1)
  // Keep the clusters in the upper part of the plot: the verdict card sits low and must not hide any of them.
  const span = portrait ? 0.5 : 0.62
  for (let tries = 1; centres.length < spec.k; tries++) {
    const c = { x: 0.15 * W + r.next() * 0.7 * W, y: 0.1 * H + r.next() * span * H }
    if (centres.every((o) => Math.sqrt(d2(o, c)) > minGap)) centres.push(c)
    if (tries % 300 === 0) minGap *= 0.92 // a crowded round relaxes the gap rather than failing
  }
  const pts: P[] = []
  for (const c of centres)
    for (let j = 0; j < spec.n; j++) pts.push({ x: clamp(c.x + r.gauss() * spec.sd, 0.03, W - 0.03), y: clamp(c.y + r.gauss() * spec.sd, 0.03, H - 0.03) })
  for (let j = 0; j < spec.strays; j++) pts.push({ x: 0.04 + r.next() * (W - 0.08), y: 0.04 + r.next() * (H - 0.08) })
  const sol = solve(pts, spec.k, r.next)
  return { k: spec.k, pts, opt: sol.cost, optCentres: sol.c, W, H, name: spec.name, hint: spec.hint }
}

type Phase = 'intro' | 'play' | 'judged' | 'done'
interface Result {
  score: number
  fit: number
  converged: boolean
  left: number
  steps: number
}

const fitOf = (round: Round, c: P[]) => clamp(round.opt / Math.max(1e-9, sse(c, round.pts)), 0, 1)

function roundPun(r: Result) {
  if (r.converged && r.steps === 0) return 'Converged by hand, no iterations. Lloyd would be proud, or jealous.'
  if (r.converged) return 'Converged. The assignments stopped changing, and so did your mood.'
  if (r.fit > 0.8) return 'Close, but local. A different initialisation might have saved you.'
  return 'A poor fit. The centroids landed in a local optimum, as k-means loves to.'
}

function finalPun(total: number) {
  if (total >= 2400) return 'Silhouette score: excellent. Elbow method: unnecessary.'
  if (total >= 1600) return 'Solid clustering. You may have outperformed random initialisation.'
  if (total >= 900) return 'Clusters found, mostly. Try restarting with a different seed.'
  return 'Everything is one cluster if you squint. Try squinting less.'
}

export default function Cluster() {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('intro')
  const [paused, setPaused] = useState(false)
  const [roundIx, setRoundIx] = useState(0)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const [portrait, setPortrait] = useState(false)
  const round = useMemo(() => makeRound(roundIx, seed, portrait), [roundIx, seed, portrait])
  const [cent, setCent] = useState<P[]>([])
  const [held, setHeld] = useState<number | null>(null)
  const [stepping, setStepping] = useState(false)
  const [steps, setSteps] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [best, setBest] = useState<number | null>(null)
  const [bestRun, setBestRun] = useState<{ best: number; isNew: boolean } | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [wrap, size] = useSize<HTMLDivElement>()
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => setBest(loadBest(game.id)), [])

  const playing = phase === 'play'
  const judge = useCallback((converged: boolean) => {
    setPhase((p) => (p === 'play' ? 'judged' : p))
    setConvergedFlag(converged)
  }, [])
  const [convergedFlag, setConvergedFlag] = useState(false)
  const clock = useClock(LIMITS[roundIx], playing && !paused, () => judge(false))

  // Logical space to pixels, fitted inside the plot area and centred.
  const scale = size.w > 0 ? Math.min(size.w / round.W, size.h / round.H) : 1
  const ox = (size.w - round.W * scale) / 2
  const oy = (size.h - round.H * scale) / 2
  const X = (x: number) => ox + x * scale
  const Y = (y: number) => oy + y * scale

  const owner = useMemo(() => round.pts.map((p) => (cent.length ? nearest(cent, p).i : -1)), [round, cent])
  const fit = cent.length ? fitOf(round, cent) : 0

  const startRound = (ix: number, nextSeed = seed, port = portrait) => {
    const rd = makeRound(ix, nextSeed, port)
    setRoundIx(ix)
    setSeed(nextSeed)
    setPortrait(port)
    // The centroids start in a tidy, wrong row along the bottom, so the first drag is obviously progress.
    setCent(Array.from({ length: rd.k }, (_, i) => ({ x: ((i + 1) / (rd.k + 1)) * rd.W, y: rd.H * 0.94 })))
    setSteps(0)
    setConvergedFlag(false)
    setFlash(null)
    clock.reset(LIMITS[ix])
    setPhase('play')
  }
  const begin = () => startRound(0, Math.floor(Math.random() * 1e9), window.innerHeight > window.innerWidth * 1.05)

  // Converged: close enough to the optimum, and the hand is off the centroid.
  useEffect(() => {
    if (playing && held === null && !stepping && fit >= CONVERGED && !paused) {
      setFlash('Converged')
      sfx.collect(5)
      const id = window.setTimeout(() => judge(true), reduced ? 0 : 650)
      return () => {
        window.clearTimeout(id)
        setFlash(null)
      }
    }
  }, [playing, held, stepping, fit, paused, judge, reduced])

  const result: Result | null = useMemo(() => {
    if (phase !== 'judged' && phase !== 'done') return null
    const left = clock.left
    const score = Math.round(Math.pow(fit, 3) * 700 + (convergedFlag ? 300 * (left / LIMITS[roundIx]) : 0))
    return { score, fit, converged: convergedFlag, left, steps }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'judged'])

  useEffect(() => {
    if (phase === 'judged' && result) sfx.verdict(result.fit > 0.85)
  }, [phase, result])

  // ---- Controls ----
  const toLogical = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    return { x: clamp((e.clientX - r.left - ox) / scale, 0, round.W), y: clamp((e.clientY - r.top - oy) / scale, 0, round.H) }
  }
  const onDown = (e: React.PointerEvent, i: number) => {
    if (!playing || paused) return
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    setHeld(i)
    sfx.grab()
  }
  const onMove = (e: React.PointerEvent, i: number) => {
    if (held !== i) return
    const p = toLogical(e)
    setCent((c) => c.map((q, j) => (j === i ? p : q)))
  }
  const onUp = () => setHeld(null)
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (!playing || paused) return
    const s = (e.shiftKey ? 0.04 : 0.012) * Math.min(round.W, round.H)
    const d = e.key === 'ArrowLeft' ? [-s, 0] : e.key === 'ArrowRight' ? [s, 0] : e.key === 'ArrowUp' ? [0, -s] : e.key === 'ArrowDown' ? [0, s] : null
    if (!d) return
    e.preventDefault()
    setCent((c) => c.map((q, j) => (j === i ? { x: clamp(q.x + d[0], 0, round.W), y: clamp(q.y + d[1], 0, round.H) } : q)))
  }

  const step = useCallback(() => {
    if (!playing || paused || clock.left <= STEP_COST + 0.5 || stepping) return
    sfx.place(0.4)
    clock.spend(STEP_COST)
    setSteps((n) => n + 1)
    setStepping(true)
    setCent((c) => lloyd(c, round.pts))
    window.setTimeout(() => setStepping(false), reduced ? 0 : 420)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, paused, clock.left, stepping, round, reduced])

  useEffect(() => {
    if (!playing) return
    const on = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && !e.repeat) step()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [playing, step])

  const pause = useCallback(() => setPaused(true), [])
  usePause(playing && !paused, pause)

  const next = () => {
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
    begin()
  }

  const secondsLeft = Math.ceil(clock.left)
  const lastTick = useRef(99)
  useEffect(() => {
    if (!playing || paused) return
    if (secondsLeft !== lastTick.current && secondsLeft <= 5 && secondsLeft > 0) sfx.tick()
    lastTick.current = secondsLeft
  }, [secondsLeft, playing, paused])

  const total = results.reduce((s, r) => s + r.score, 0)
  const urgent = playing && clock.left <= 8
  const judgedView = phase === 'judged' || phase === 'done'

  return (
    <main id="main" className="dark relative flex h-[100svh] flex-col overflow-hidden bg-[#0b0d1a] text-fog">
      <PlayBar>
        {playing && (
          <button type="button" onClick={pause} aria-label="Pause" className="play-btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 text-fog hover:border-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        )}
      </PlayBar>

      <div className="grid shrink-0 grid-cols-[1fr_auto] items-end gap-x-6 gap-y-2 px-4 sm:px-6">
        <div>
          <p className="text-sm text-mist">
            Round {roundIx + 1} of {ROUNDS} · {round.name}
          </p>
          <p className="mt-0.5 hidden text-fog/85 sm:block">{playing ? round.hint : 'Drag each centroid to the middle of a group.'}</p>
        </div>
        <p className="text-right font-display text-4xl font-semibold leading-none tabular-nums sm:text-5xl" style={urgent && !reduced ? { animation: 'play-blink 1s infinite', color: '#ffd29a' } : undefined}>
          {Math.ceil(clock.left)}
          <span className="text-lg font-normal text-mist"> s</span>
        </p>
        <Bar value={clock.left / LIMITS[roundIx]} danger={urgent} className="col-span-2" />
      </div>

      {/* The fit meter: how close the centroids are to what a thorough k-means found. The tick marks "converged". */}
      <div className="shrink-0 px-4 py-3 sm:px-6">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-mist">Fit to the optimum</span>
          <span className="font-display text-xl tabular-nums">{Math.round(fit * 100)}%</span>
        </div>
        <div className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${fit * 100}%`, background: fit >= CONVERGED ? '#ffd29a' : '#8c99ff' }} />
          <span className="absolute inset-y-0 w-0.5 bg-white/70" style={{ left: `${CONVERGED * 100}%` }} />
        </div>
      </div>

      <div ref={wrap} className="relative mx-4 min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] sm:mx-6">
        <svg ref={svg} width={Math.max(1, size.w)} height={Math.max(1, size.h)} className="absolute inset-0 touch-none select-none" role="group" aria-label={`${round.pts.length} points in ${round.k} clusters, with ${round.k} centroids to place. Tab to a centroid and use the arrow keys to move it.`}>
          {/* the pull: each point tied to its centroid */}
          {playing &&
            round.pts.map((p, i) =>
              owner[i] >= 0 && cent[owner[i]] ? <line key={`l${i}`} x1={X(p.x)} y1={Y(p.y)} x2={X(cent[owner[i]].x)} y2={Y(cent[owner[i]].y)} stroke={COLOURS[owner[i]]} strokeOpacity={0.16} strokeWidth={1} /> : null,
            )}

          {round.pts.map((p, i) => (
            <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={Math.max(3.5, scale * 0.012)} fill={owner[i] >= 0 ? COLOURS[owner[i]] : '#fff'} fillOpacity={0.95} style={{ transition: 'fill .2s' }} />
          ))}

          {/* what a thorough k-means found, shown when judged */}
          {judgedView &&
            round.optCentres.map((c, i) => (
              <g key={`o${i}`} style={{ animation: reduced ? undefined : 'play-pop .5s cubic-bezier(.2,.8,.2,1.3) both', animationDelay: `${i * 80}ms` }}>
                <circle cx={X(c.x)} cy={Y(c.y)} r={15} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="3 5" />
                <circle cx={X(c.x)} cy={Y(c.y)} r={2.5} fill="#fff" />
              </g>
            ))}

          {cent.map((c, i) => (
            <g
              key={i}
              role="button"
              tabIndex={playing ? 0 : -1}
              aria-label={`Centroid ${i + 1} of ${round.k}. Arrow keys move it.`}
              className={`play-grab ${held === i ? 'is-held' : ''}`}
              onPointerDown={(e) => onDown(e, i)}
              onPointerMove={(e) => onMove(e, i)}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onKeyDown={(e) => onKey(e, i)}
              style={{ cursor: playing ? 'grab' : 'default', touchAction: 'none', pointerEvents: playing ? 'auto' : 'none' }}
            >
              <g style={{ transform: `translate(${X(c.x)}px, ${Y(c.y)}px)`, transition: stepping && !reduced ? 'transform .4s cubic-bezier(.2,.8,.2,1.25)' : 'none' }}>
                <circle r={28} fill="transparent" />
                <g className="play-dot" style={{ animationDelay: `${i * 90}ms` }}>
                  <circle className="play-ring" r={15} fill={COLOURS[i]} stroke="#fff" strokeWidth={3} />
                  <path d="M-6 0h12M0 -6v12" stroke="#0b0d1a" strokeWidth={2.5} strokeLinecap="round" />
                </g>
              </g>
            </g>
          ))}
        </svg>

        {playing && steps === 0 && !flash && held === null && fit < 0.3 && (
          <p className="pointer-events-none absolute inset-x-0 top-5 mx-auto w-max max-w-[calc(100%-2rem)] rounded-full bg-voltsoft px-5 py-2.5 text-center font-medium text-ink" style={{ animation: 'play-pop .5s cubic-bezier(.2,.8,.2,1.3) .3s both' }}>
            Drag the dots up into the groups
          </p>
        )}
        {flash && (
          <p className="pointer-events-none absolute inset-x-0 top-5 mx-auto w-max rounded-full bg-[#ffd29a] px-6 py-2.5 font-display text-xl font-semibold text-ink" style={{ animation: 'play-pop .45s cubic-bezier(.2,.8,.2,1.4) both' }} role="status">
            {flash}
          </p>
        )}

        {phase === 'judged' && result && (
          <div className="absolute inset-x-3 bottom-3 mx-auto max-w-2xl rounded-3xl bg-white p-4 text-ink shadow-2xl sm:bottom-4 sm:p-5" style={{ animation: 'play-rise .5s cubic-bezier(.2,.8,.2,1.2) both' }} role="status">
            <div className="flex items-center justify-between gap-x-4 sm:gap-x-5">
              <p className="font-display text-4xl font-semibold tabular-nums tracking-[-0.03em] sm:text-5xl">+{fmtScore(result.score)}</p>
              <p className="hidden text-sm text-slate sm:block">
                fit <span className="font-semibold tabular-nums text-ink">{Math.round(result.fit * 100)}%</span>
                {result.converged ? ` · ${result.steps} step${result.steps === 1 ? '' : 's'}` : ''}
                <br />
                dashed rings: the thorough k-means
              </p>
              <button type="button" autoFocus onClick={next} className="btn play-btn-press ml-auto bg-ink text-fog hover:bg-volt">
                {roundIx + 1 < ROUNDS ? 'Next round' : 'See my total'}
              </button>
            </div>
            <p className="mt-2 hidden font-display text-base leading-snug sm:block sm:text-lg">{roundPun(result)}</p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 p-4 sm:p-6">
        <button type="button" onClick={step} disabled={!playing || clock.left <= STEP_COST + 0.5} className="btn play-btn-press border border-white/40 text-white hover:border-white disabled:opacity-35">
          Step <span className="text-mist">−{STEP_COST} s · K</span>
        </button>
        <button type="button" onClick={() => judge(false)} disabled={!playing} className="btn play-btn-press ml-auto bg-white px-7 text-ink hover:bg-voltsoft disabled:opacity-35">
          Lock in
        </button>
      </div>

      {phase === 'intro' && <GameIntro game={game} best={best} onStart={begin} />}
      {paused && playing && <PauseCard onResume={() => setPaused(false)} onRestart={() => { setPaused(false); startRound(roundIx) }} />}

      {phase === 'done' && bestRun && (
        <ResultsCard
          game={game}
          verdict="Clustering complete."
          score={total}
          best={bestRun.best}
          isNew={bestRun.isNew}
          rows={results.map((r, i): [string, string] => [`Round ${i + 1}`, `${fmtScore(r.score)} · fit ${Math.round(r.fit * 100)}%`])}
          pun={finalPun(total)}
          shareText={`I scored ${fmtScore(total)} out of 3,000 on Cluster, k-means by hand. Can you out-converge me?`}
          onAgain={again}
        />
      )}
    </main>
  )
}

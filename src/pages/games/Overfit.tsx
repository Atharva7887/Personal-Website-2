import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../../components/motion'
import { gameById } from '../../play/games'
import { useClock, useSize } from '../../play/hooks'
import { clamp, fmtScore, rng } from '../../play/math'
import { sfx } from '../../play/sound'
import { loadBest, saveBest } from '../../play/storage'
import { Bar, GameIntro, PauseCard, PlayBar, ResultsCard, usePause } from '../../play/ui'

const game = gameById('overfit')
const BEST_KEY = game.bestKey ?? game.id

// One decision per round: how wiggly should the curve be? The curve fits itself to the dots (least squares);
// the player only picks its flexibility (the polynomial degree). Too stiff misses the shape, too wiggly
// threads every dot and falls apart on new data.

interface Pt {
  x: number
  y: number
}
interface Shape {
  name: string
  reveal: string
  noise: number
  f: (x: number) => number
}

const ROUNDS = 5
const LIMIT = 15 // seconds per round
const MAX_DEG = 10
const N_TRAIN = 14
const YMAX = 1.6
const PER_ROUND = 200

/** The shapes hiding in the dots. The first round is always the line; the rest come in a random order. */
function shapes(phase: number): Shape[] {
  return [
    { name: 'A straight line', reveal: 'It was a straight line all along.', noise: 0.24, f: (x) => 0.7 * x + 0.1 },
    { name: 'A bowl', reveal: 'It was a bowl.', noise: 0.22, f: (x) => 1.15 * x * x - 0.45 },
    { name: 'An S-bend', reveal: 'It was an S-bend.', noise: 0.2, f: (x) => 1.4 * x * x * x - 0.75 * x },
    { name: 'A wave', reveal: 'It was a wave.', noise: 0.2, f: (x) => 0.8 * Math.sin(2.6 * x + phase) },
    { name: 'Pure noise', reveal: 'There was no pattern. Just noise around a flat line.', noise: 0.3, f: () => 0.1 },
  ]
}

interface Round {
  shape: Shape
  train: Pt[]
  test: Pt[]
  /** Coefficients of the best fit at every degree, 0..MAX_DEG. */
  fits: number[][]
  /** How well each degree fits the dots on screen (R squared, 0..1). */
  trainFit: number[]
  /** How far each degree is from the real shape: the error it would make on new data, minus the noise. */
  newErr: number[]
  best: number
}

// Legendre polynomials keep the least-squares system well behaved up to degree 10 on [-1, 1].
function basis(x: number, d: number): number[] {
  const p = [1, x]
  for (let n = 1; n < d; n++) p.push(((2 * n + 1) * x * p[n] - n * p[n - 1]) / (n + 1))
  return p.slice(0, d + 1)
}
const evalFit = (c: number[], x: number) => basis(x, c.length - 1).reduce((s, b, i) => s + b * c[i], 0)

/** Least squares for one degree, by the normal equations with a whisper of ridge and partial pivoting. */
function fit(pts: Pt[], d: number): number[] {
  const m = d + 1
  const A = Array.from({ length: m }, () => new Array(m + 1).fill(0))
  for (const p of pts) {
    const b = basis(p.x, d)
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) A[i][j] += b[i] * b[j]
      A[i][m] += b[i] * p.y
    }
  }
  for (let i = 0; i < m; i++) A[i][i] += 1e-9
  for (let c = 0; c < m; c++) {
    let piv = c
    for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r
    ;[A[c], A[piv]] = [A[piv], A[c]]
    for (let r = 0; r < m; r++) {
      if (r === c) continue
      const k = A[r][c] / A[c][c]
      for (let j = c; j <= m; j++) A[r][j] -= k * A[c][j]
    }
  }
  return A.map((row, i) => row[m] / row[i])
}

function r2(c: number[], pts: Pt[]) {
  const mean = pts.reduce((s, p) => s + p.y, 0) / pts.length
  const tot = pts.reduce((s, p) => s + (p.y - mean) ** 2, 0)
  const res = pts.reduce((s, p) => s + (evalFit(c, p.x) - p.y) ** 2, 0)
  return clamp(1 - res / Math.max(1e-9, tot), 0, 1)
}

function makeRound(shape: Shape, seed: number): Round {
  const r = rng(seed)
  const train: Pt[] = []
  for (let k = 0; k < N_TRAIN; k++) {
    const x = clamp(-0.95 + ((k + 0.5 + (r.next() - 0.5) * 0.8) / N_TRAIN) * 1.9, -0.97, 0.97)
    train.push({ x, y: shape.f(x) + r.gauss() * shape.noise })
  }
  const test: Pt[] = []
  for (let k = 0; k < 24; k++) {
    const x = -0.97 + r.next() * 1.94
    test.push({ x, y: shape.f(x) + r.gauss() * shape.noise })
  }
  const fits: number[][] = []
  const trainFit: number[] = []
  const newErr: number[] = []
  for (let d = 0; d <= MAX_DEG; d++) {
    const c = fit(train, d)
    fits.push(c)
    trainFit.push(r2(c, train))
    // Judged against the real shape on a fine grid, so the score is fair and not down to which test dots fell where.
    let e = 0
    for (let i = 0; i <= 200; i++) {
      const x = -0.97 + (i / 200) * 1.94
      e += (evalFit(c, x) - shape.f(x)) ** 2
    }
    newErr.push(e / 201)
  }
  const best = newErr.indexOf(Math.min(...newErr))
  return { shape, train, test, fits, trainFit, newErr, best }
}

/** Full marks for the best degree, falling off with the extra error a worse pick makes on new data. */
const scoreFor = (rd: Round, d: number) => Math.round(PER_ROUND * Math.exp(-(rd.newErr[d] - rd.newErr[rd.best]) / (rd.shape.noise ** 2 * 0.8)))

/** The wiggliness labels under the slider. */
function feel(d: number) {
  if (d === 0) return 'Flat'
  if (d === 1) return 'Straight'
  if (d <= 3) return 'Gentle'
  if (d <= 6) return 'Bendy'
  return 'Wild'
}

function roundPun(rd: Round, d: number) {
  if (d === rd.best) return 'Spot on. The bias and the variance shook hands.'
  if (d < rd.best - 1) return 'Too stiff. It missed the shape. That’s underfitting.'
  if (d > rd.best + 2 && rd.trainFit[d] > 0.9) return 'Too wiggly. It fit the dots you saw and fell apart on new ones. That’s overfitting.'
  if (d > rd.best) return 'A little too wiggly. Close, but it started chasing noise.'
  return 'A little too stiff. Close.'
}

function finalPun(total: number) {
  if (total >= 900) return 'Your models generalise. Please do not tune on the test set.'
  if (total >= 700) return 'Mostly well judged. Would regularise again.'
  if (total >= 450) return 'Somewhere between underfit and overfit, which is where most models live.'
  return 'Perfect on the dots you saw, lost on the ones you didn’t. A classic.'
}

type Phase = 'intro' | 'fit' | 'reveal' | 'done'
interface Result {
  shape: string
  deg: number
  best: number
  score: number
}

const PAD = 18

/** A small chart of the lesson: fit on seen dots keeps rising with wiggliness; fit on new dots peaks and falls. */
function Lesson({ rd, deg }: { rd: Round; deg: number }) {
  const w = 260
  const h = 84
  const x = (d: number) => 8 + (d / MAX_DEG) * (w - 16)
  const worst = Math.max(...rd.newErr.map((e) => Math.min(e, rd.shape.noise ** 2 * 6)))
  const newFit = rd.newErr.map((e) => 1 - Math.min(e, rd.shape.noise ** 2 * 6) / Math.max(1e-9, worst))
  const y = (v: number) => h - 14 - v * (h - 24)
  const line = (vals: number[]) => vals.map((v, d) => `${d ? 'L' : 'M'}${x(d).toFixed(1)} ${y(v).toFixed(1)}`).join('')
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="max-w-[260px]" role="img" aria-label={`Chart: fit on the dots you saw keeps rising as the curve gets wigglier, but fit on new dots peaks at wiggliness ${rd.best}. You picked ${deg}.`}>
      <line x1={x(rd.best)} x2={x(rd.best)} y1={6} y2={h - 14} stroke="#0c0f14" strokeOpacity={0.18} strokeDasharray="3 3" />
      <path d={line(rd.trainFit)} fill="none" stroke="#2f45ff" strokeWidth={2.5} strokeLinecap="round" />
      <path d={line(newFit)} fill="none" stroke="#d98a2b" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={x(deg)} cy={y(newFit[deg])} r={5} fill="#d98a2b" stroke="#fff" strokeWidth={2} />
      <text x={x(0)} y={h - 2} fontSize={10} fill="#5b6270">
        stiff
      </text>
      <text x={x(MAX_DEG)} y={h - 2} fontSize={10} fill="#5b6270" textAnchor="end">
        wiggly
      </text>
    </svg>
  )
}

export default function Overfit() {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('intro')
  const [paused, setPaused] = useState(false)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const [roundIx, setRoundIx] = useState(0)
  const [deg, setDeg] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [shown, setShown] = useState(0)
  const [best, setBest] = useState<number | null>(null)
  const [bestRun, setBestRun] = useState<{ best: number; isNew: boolean } | null>(null)
  const [wrap, size] = useSize<HTMLDivElement>()

  useEffect(() => setBest(loadBest(BEST_KEY)), [])

  // The order of shapes for this run: the line first, then the rest shuffled by the seed.
  const order = useMemo(() => {
    const r = rng(seed)
    const all = shapes(r.next() * Math.PI * 2)
    const rest = all.slice(1)
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(r.next() * (i + 1))
      ;[rest[i], rest[j]] = [rest[j], rest[i]]
    }
    return [all[0], ...rest]
  }, [seed])
  const round = useMemo(() => makeRound(order[roundIx], seed + roundIx * 7919), [order, roundIx, seed])

  const fitting = phase === 'fit'
  const judged = phase === 'reveal' || phase === 'done'
  const lockIn = useCallback(() => setPhase((p) => (p === 'fit' ? 'reveal' : p)), [])
  const clock = useClock(LIMIT, fitting && !paused, lockIn)

  const setDegree = useCallback(
    (d: number) => {
      const v = clamp(Math.round(d), 0, MAX_DEG)
      setDeg((old) => {
        if (old !== v) sfx.place(v / MAX_DEG)
        return v
      })
    },
    [],
  )

  // Keyboard anywhere on the page: arrows or - and + to change the wiggliness, Enter to lock in.
  useEffect(() => {
    if (!fitting || paused) return
    const onKey = (e: KeyboardEvent) => {
      const onSlider = (e.target as HTMLElement)?.getAttribute?.('type') === 'range'
      if (!onSlider && (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === '-')) {
        e.preventDefault()
        setDegree(deg - 1)
      } else if (!onSlider && (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === '+' || e.key === '=')) {
        e.preventDefault()
        setDegree(deg + 1)
      } else if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault()
        lockIn()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fitting, paused, deg, setDegree, lockIn])

  // Data to pixels.
  const W = Math.max(1, size.w)
  const H = Math.max(1, size.h)
  const sx = (x: number) => PAD + ((x + 1) / 2) * (W - PAD * 2)
  const sy = (y: number) => H / 2 - (y / YMAX) * (H / 2 - PAD)

  const curve = useMemo(() => {
    if (W < 2) return ''
    const c = round.fits[deg]
    let d = ''
    for (let i = 0; i <= 240; i++) {
      const x = -1 + (i / 240) * 2
      d += `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(clamp(evalFit(c, x), -YMAX * 3, YMAX * 3)).toFixed(1)}`
    }
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, deg, W, H])
  const truthPath = useMemo(() => {
    if (W < 2) return ''
    let d = ''
    for (let i = 0; i <= 120; i++) {
      const x = -1 + (i / 120) * 2
      d += `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(round.shape.f(x)).toFixed(1)}`
    }
    return d
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, W, H])

  const score = judged ? scoreFor(round, deg) : 0
  const seenFit = round.trainFit[deg]
  // How close the pick came to the best possible on new data (pure noise has nothing to fit, so not R squared).
  const newFit = score / PER_ROUND

  // The reveal: new dots drop in one at a time.
  useEffect(() => {
    if (phase !== 'reveal') return
    if (reduced) {
      setShown(round.test.length)
      return
    }
    setShown(0)
    let i = 0
    const id = window.setInterval(() => {
      i++
      sfx.reveal(i)
      setShown(i)
      if (i >= round.test.length) window.clearInterval(id)
    }, 55)
    return () => window.clearInterval(id)
  }, [phase, reduced, round])
  const revealed = phase === 'reveal' && shown >= round.test.length
  useEffect(() => {
    if (revealed) sfx.verdict(score >= PER_ROUND * 0.7)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed])

  const startRound = (ix: number) => {
    setRoundIx(ix)
    setDeg(0)
    setShown(0)
    clock.reset(LIMIT)
    setPhase('fit')
  }
  const nextRound = () => {
    const all = [...results, { shape: round.shape.name, deg, best: round.best, score }]
    setResults(all)
    if (roundIx + 1 < ROUNDS) startRound(roundIx + 1)
    else {
      const total = all.reduce((s, r) => s + r.score, 0)
      setBestRun(saveBest(BEST_KEY, total))
      setBest(loadBest(BEST_KEY))
      setPhase('done')
    }
  }
  const again = () => {
    setResults([])
    setBestRun(null)
    setSeed(Math.floor(Math.random() * 1e9))
    startRound(0)
  }

  const pause = useCallback(() => setPaused(true), [])
  usePause(fitting && !paused, pause)

  const secondsLeft = Math.ceil(clock.left)
  const lastTick = useRef(99)
  useEffect(() => {
    if (!fitting || paused) return
    if (secondsLeft !== lastTick.current && secondsLeft <= 5 && secondsLeft > 0) sfx.tick()
    lastTick.current = secondsLeft
  }, [secondsLeft, fitting, paused])

  const total = results.reduce((s, r) => s + r.score, 0)
  const urgent = fitting && clock.left <= 5

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

      {/* Round, task and clock */}
      <div className="grid shrink-0 grid-cols-[1fr_auto] items-end gap-x-6 gap-y-2 px-4 sm:px-6">
        <div>
          <p className="text-sm text-mist">
            Round {roundIx + 1} of {ROUNDS} · Score {fmtScore(total)}
          </p>
          <p className="mt-0.5 text-fog/90">{judged ? round.shape.reveal : 'Slide until the curve follows the trend, not every dot.'}</p>
        </div>
        <p className="text-right font-display text-4xl font-semibold leading-none tabular-nums sm:text-5xl" style={urgent && !reduced ? { animation: 'play-blink 1s infinite', color: '#ffd29a' } : undefined}>
          {secondsLeft}
          <span className="text-lg font-normal text-mist"> s</span>
        </p>
        <Bar value={clock.left / LIMIT} danger={urgent} className="col-span-2" />
      </div>

      {/* Two meters: the temptation and the truth */}
      <div className="grid shrink-0 grid-cols-2 gap-4 px-4 py-3 text-sm sm:px-6">
        <div>
          <p className="flex justify-between text-mist">
            <span>Fits the dots you see</span>
            <span className="font-display tabular-nums text-fog">{Math.round(seenFit * 100)}%</span>
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-[#8c99ff] transition-[width] duration-200" style={{ width: `${seenFit * 100}%` }} />
          </div>
        </div>
        <div>
          <p className="flex justify-between text-mist">
            <span>Fits new dots</span>
            <span className="font-display tabular-nums text-fog">{judged && revealed ? `${Math.round(newFit * 100)}%` : '?'}</span>
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-[#ffd29a] transition-[width] duration-500" style={{ width: `${judged && revealed ? newFit * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* The plot */}
      <div ref={wrap} className="relative mx-4 min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] sm:mx-6">
        <svg width={W} height={H} className="absolute inset-0 select-none" aria-label={`Plot of ${N_TRAIN} noisy dots with a fitted curve at wiggliness ${deg}.`} role="img">
          <defs>
            <clipPath id="overfit-clip">
              <rect x={0} y={0} width={W} height={H} />
            </clipPath>
          </defs>
          {[-1, -0.5, 0, 0.5, 1].map((v) => (
            <line key={v} x1={0} x2={W} y1={sy(v)} y2={sy(v)} stroke="#fff" strokeOpacity={v === 0 ? 0.14 : 0.06} />
          ))}

          {judged && revealed && <path d={truthPath} fill="none" stroke="#ffd29a" strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" style={{ animation: 'fade-in .8s ease-out both' }} />}

          {phase === 'reveal' &&
            round.test.slice(0, shown).map((p, i) => (
              <line key={`r${i}`} x1={sx(p.x)} x2={sx(p.x)} y1={sy(p.y)} y2={sy(clamp(evalFit(round.fits[deg], p.x), -YMAX * 2, YMAX * 2))} stroke="#ffd29a" strokeOpacity={0.5} strokeWidth={1.5} />
            ))}

          <path d={curve} clipPath="url(#overfit-clip)" fill="none" stroke="#8c99ff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgb(140 153 255 / .6))', transition: reduced ? undefined : 'd .18s ease-out' }} />

          {round.train.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5.5} fill="#fff" fillOpacity={0.95} />
          ))}

          {phase === 'reveal' &&
            round.test.slice(0, shown).map((p, i) => <circle key={`v${i}`} className="play-dot" cx={sx(p.x)} cy={sy(p.y)} r={5.5} fill="#0b0d1a" stroke="#ffd29a" strokeWidth={2.5} />)}
        </svg>

        {fitting && roundIx === 0 && deg === 0 && (
          <p className="pointer-events-none absolute inset-x-0 top-5 mx-auto w-max max-w-[calc(100%-2rem)] rounded-full bg-voltsoft px-5 py-2.5 text-center font-medium text-ink" style={{ animation: 'play-pop .5s cubic-bezier(.2,.8,.2,1.3) .2s both' }}>
            Drag the slider below to bend the curve
          </p>
        )}

        {/* Round verdict */}
        {revealed && (
          <div className="absolute inset-x-3 bottom-3 mx-auto max-w-2xl rounded-3xl bg-white p-4 text-ink shadow-2xl sm:bottom-4 sm:p-5" style={{ animation: 'play-rise .5s cubic-bezier(.2,.8,.2,1.2) both' }} role="status">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <div>
                <p className="font-display text-4xl font-semibold tabular-nums tracking-[-0.03em] sm:text-5xl">+{fmtScore(score)}</p>
                <p className="mt-1 text-sm text-slate">
                  You picked <span className="font-semibold text-ink">{deg}</span>. Best was <span className="font-semibold text-ink">{round.best}</span>.
                </p>
              </div>
              <div className="hidden sm:block">
                <Lesson rd={round} deg={deg} />
                <p className="flex gap-3 text-xs text-slate">
                  <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-volt" />dots you saw</span>
                  <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#d98a2b]" />new dots</span>
                </p>
              </div>
              <button type="button" autoFocus onClick={nextRound} className="btn play-btn-press ml-auto bg-ink text-fog hover:bg-volt">
                {roundIx + 1 < ROUNDS ? 'Next round' : 'See my total'}
              </button>
            </div>
            <p className="mt-2 font-display text-base leading-snug sm:text-lg">{roundPun(round, deg)}</p>
          </div>
        )}
      </div>

      {/* The one control */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 p-4 sm:gap-4 sm:p-6">
        <button type="button" onClick={() => setDegree(deg - 1)} disabled={!fitting || deg === 0} aria-label="Less wiggly" className="btn play-btn-press min-w-[48px] border border-white/40 px-0 text-xl text-white hover:border-white disabled:opacity-35">
          −
        </button>
        <label className="flex min-w-[180px] flex-1 flex-col gap-1">
          <span className="flex justify-between text-sm text-mist">
            <span>Wiggliness</span>
            <span className="font-display tabular-nums text-fog">
              {deg} · {feel(deg)}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={MAX_DEG}
            step={1}
            value={deg}
            disabled={!fitting}
            onChange={(e) => setDegree(Number(e.target.value))}
            className="h-11 w-full cursor-pointer accent-[#8c99ff] disabled:cursor-default"
            aria-valuetext={`${deg}, ${feel(deg)}`}
          />
        </label>
        <button type="button" onClick={() => setDegree(deg + 1)} disabled={!fitting || deg === MAX_DEG} aria-label="More wiggly" className="btn play-btn-press min-w-[48px] border border-white/40 px-0 text-xl text-white hover:border-white disabled:opacity-35">
          +
        </button>
        <button type="button" onClick={lockIn} disabled={!fitting} className="btn play-btn-press w-full bg-white px-7 text-ink hover:bg-voltsoft disabled:opacity-35 sm:w-auto">
          Lock it in
        </button>
      </div>

      {phase === 'intro' && <GameIntro game={game} best={best} onStart={() => startRound(0)} />}
      {paused && fitting && (
        <PauseCard
          onResume={() => setPaused(false)}
          onRestart={() => {
            setPaused(false)
            startRound(roundIx)
          }}
        />
      )}

      {phase === 'done' && bestRun && (
        <ResultsCard
          game={game}
          verdict="Training complete."
          score={total}
          best={bestRun.best}
          isNew={bestRun.isNew}
          rows={results.map((r): [string, string] => [r.shape, `${fmtScore(r.score)} · picked ${r.deg}, best ${r.best}`])}
          pun={finalPun(total)}
          shareText={`I scored ${fmtScore(total)} out of 1,000 on Overfit. Can you tell signal from noise?`}
          onAgain={again}
        />
      )}
    </main>
  )
}

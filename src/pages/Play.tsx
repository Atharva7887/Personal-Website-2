import { useEffect, useRef, useState } from 'react'
import { hasPage, projects } from '../data/projects'
import type { Orb, WorldHandle } from '../three/playWorld'
import { useReducedMotion } from '../components/motion'

// One orb per case study, scattered across valleys, ridges and the two traps.
const SPOTS = [
  [-12, 22],
  [-15, -12],
  [-14, 16],
  [2, 8],
  [24, 18],
  [-4, -22],
  [22, -24],
]
const ORBS: Orb[] = projects.filter(hasPage).map((p, i) => ({ id: p.slug, label: p.name, x: SPOTS[i][0], z: SPOTS[i][1] }))

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function loadBest(): number | null {
  try {
    const v = Number(localStorage.getItem('minimum-best'))
    return v > 0 ? v : null
  } catch {
    return null
  }
}

export function Play() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const world = useRef<WorldHandle | null>(null)
  const reduced = useReducedMotion()
  const [started, setStarted] = useState(false)
  const [failed, setFailed] = useState(false)
  const [found, setFound] = useState<string[]>([])
  const [card, setCard] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [time, setTime] = useState(0)
  const [won, setWon] = useState<number | null>(null)
  const [best, setBest] = useState<number | null>(null)
  const [stick, setStick] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null)

  useEffect(() => setBest(loadBest()), [])

  useEffect(() => {
    if (!started) return
    const c = canvas.current
    if (!c) return
    let cancelled = false
    import('../three/playWorld').then(({ mountWorld }) => {
      if (cancelled) return
      try {
        world.current = mountWorld(
          c,
          ORBS,
          {
            onCollect: (id) => {
              setFound((f) => [...f, id])
              setCard(id)
            },
            onUnlock: () => setUnlocked(true),
            onTick: (s) => setTime(s),
            onWin: (s) => {
              setWon(s)
              const b = loadBest()
              if (!b || s < b) {
                try {
                  localStorage.setItem('minimum-best', String(s))
                } catch {
                  /* private mode */
                }
                setBest(s)
              }
            },
          },
          { reduced },
        )
        c.focus()
      } catch {
        setFailed(true)
      }
    })
    return () => {
      cancelled = true
      world.current?.dispose()
      world.current = null
    }
  }, [started, reduced])

  // Auto-hide the project card after a few seconds.
  useEffect(() => {
    if (!card) return
    const id = setTimeout(() => setCard(null), 4200)
    return () => clearTimeout(id)
  }, [card])

  const restart = () => {
    world.current?.restart()
    setFound([])
    setUnlocked(false)
    setWon(null)
    setTime(0)
    setCard(null)
    canvas.current?.focus()
  }

  // Touch / pen: drag anywhere to steer (a virtual joystick).
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setStick({ x: e.clientX, y: e.clientY, dx: 0, dy: 0 })
  }
  const onMove = (e: React.PointerEvent) => {
    if (!stick) return
    const dx = Math.max(-1, Math.min(1, (e.clientX - stick.x) / 60))
    const dy = Math.max(-1, Math.min(1, (e.clientY - stick.y) / 60))
    setStick({ ...stick, dx, dy })
    world.current?.setInput(dx, dy)
  }
  const onUp = () => {
    setStick(null)
    world.current?.setInput(0, 0)
  }

  const cardProject = projects.find((p) => p.slug === card)

  return (
    <main id="main" className="dark relative h-[100svh] overflow-hidden bg-[#0b0d1a] text-fog">
      <canvas
        ref={canvas}
        tabIndex={0}
        aria-label="3D loss landscape. Use the arrow keys or WASD to roll the ball."
        className="absolute inset-0 h-full w-full touch-none outline-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-7">
        <a href="/" className="pointer-events-auto flex min-h-[44px] items-center font-display text-lg font-semibold">
          AS<span className="text-voltsoft">.</span>
        </a>
        {started && !won && (
          <div className="text-right font-display tabular-nums">
            <p className="text-4xl font-semibold leading-none sm:text-5xl">
              {found.length}
              <span className="text-mist">/{ORBS.length}</span>
            </p>
            <p className="mt-1 text-mist">{fmt(time)}</p>
          </div>
        )}
      </div>

      {/* Start screen */}
      {!started && (
        <div className="absolute inset-0 flex flex-col justify-end bg-[radial-gradient(120%_80%_at_80%_10%,#2f45ff_0%,#0b0d1a_55%)] p-5 sm:p-10">
          <p className="max-w-md text-lg text-fog/85">A small 3D game about how machine learning learns.</p>
          <h1 className="mt-4 font-display text-[clamp(3.6rem,15vw,15rem)] font-semibold leading-[0.82] tracking-[-0.05em]">
            Find the
            <br />
            minimum.
          </h1>
          <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <p className="max-w-xl text-fog/85">
              You’re the optimiser: a ball on a loss landscape. Gravity pulls you downhill, but the obvious valleys are
              traps. Roll over {ORBS.length} orbs, one for each of my projects, then find the global minimum. Arrow keys or
              WASD on a keyboard; drag to steer on a phone.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setStarted(true)} className="btn bg-white px-8 text-lg text-ink hover:bg-voltsoft">
                Start rolling
              </button>
              <a href="/" className="btn border border-white/40 text-white hover:border-white">
                Back to the site
              </a>
            </div>
          </div>
          {best && <p className="mt-6 text-sm text-mist">Your best: {fmt(best)}</p>}
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <p className="max-w-md">
            This game needs WebGL, which your browser has turned off.{' '}
            <a href="/#work" className="link">
              See the projects instead
            </a>
            .
          </p>
        </div>
      )}

      {/* Project card on pickup */}
      {cardProject && !won && (
        <div
          role="status"
          className="absolute bottom-24 left-1/2 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 animate-[pop_.45s_cubic-bezier(.2,.8,.2,1.4)] rounded-3xl bg-white p-6 text-ink shadow-2xl"
        >
          <p className="text-sm text-slate">
            Found {found.length} of {ORBS.length}
          </p>
          <p className="mt-1 font-display text-3xl font-semibold tracking-[-0.02em]">{cardProject.name}</p>
          <p className="mt-2 text-slate">{cardProject.tagline}</p>
          <a href={`/work/${cardProject.slug}/`} className="link mt-3 inline-flex min-h-[44px] items-center font-medium">
            Read the case study
          </a>
        </div>
      )}

      {/* Unlock hint */}
      {unlocked && !won && !cardProject && (
        <p role="status" className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-voltsoft px-5 py-3 text-center font-medium text-ink">
          All found. Follow the beam of light to the global minimum.
        </p>
      )}

      {/* Controls hint */}
      {started && !won && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-mist">
          <span className="hidden sm:inline">Arrow keys or WASD to roll</span>
          <span className="sm:hidden">Drag anywhere to steer</span>
        </p>
      )}

      {/* Touch joystick */}
      {stick && (
        <div aria-hidden="true" className="pointer-events-none fixed h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" style={{ left: stick.x, top: stick.y }}>
          <div className="absolute left-1/2 top-1/2 h-10 w-10 rounded-full bg-white/80" style={{ transform: `translate(calc(-50% + ${stick.dx * 30}px), calc(-50% + ${stick.dy * 30}px))` }} />
        </div>
      )}

      {/* Win */}
      {won !== null && (
        <div className="absolute inset-0 flex flex-col justify-end bg-[#0b0d1a]/70 p-5 backdrop-blur-sm sm:p-10">
          <p className="text-lg text-fog/85">Converged.</p>
          <h2 className="mt-3 font-display text-[clamp(3.6rem,14vw,13rem)] font-semibold leading-[0.85] tracking-[-0.05em]">{fmt(won)}</h2>
          <p className="mt-4 text-fog/85">
            {best !== null && won <= best ? 'A new best time.' : best !== null ? `Your best is ${fmt(best)}.` : ''} You found
            all {ORBS.length} projects and reached the global minimum.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={restart} className="btn bg-white text-ink hover:bg-voltsoft">
              Play again
            </button>
            <a href="/#work" className="btn border border-white/40 text-white hover:border-white">
              See the projects
            </a>
            <a href="/#contact" className="btn border border-white/40 text-white hover:border-white">
              Get in touch
            </a>
          </div>
        </div>
      )}
    </main>
  )
}

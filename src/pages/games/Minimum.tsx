import { useCallback, useEffect, useRef, useState } from 'react'
import { hasPage, projects } from '../../data/projects'
import type { Hud, Orb, WorldHandle } from '../../three/playWorld'
import { useReducedMotion } from '../../components/motion'
import { gameById } from '../../play/games'
import { loadBest, saveBest } from '../../play/storage'
import { sfx } from '../../play/sound'
import { fmtScore } from '../../play/math'
import { Bar, GameIntro, PauseCard, PlayBar, ResultsCard, usePause } from '../../play/ui'

const game = gameById('minimum')

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

const START_HUD: Hud = { left: 60, score: 0, combo: 0, comboLeft: 0, boost: 1, boosting: false, noise: 0 }

type Phase = 'intro' | 'playing' | 'won' | 'lost'
interface Ending {
  score: number
  left: number
  bonus: number
  collected: number
}

function pun(win: boolean, e: Ending) {
  if (win) {
    if (e.left > 25) return 'Converged with time to spare. Check for data leakage.'
    if (e.left > 10) return 'Global minimum found. Training loss: 0.000. Validation loss: untested.'
    return 'Converged on the last epoch. Early stopping would have been too early.'
  }
  if (e.collected === 0) return 'Zero orbs. The model learned to predict the mean.'
  if (e.collected < ORBS.length - 2) return 'Stuck in a local minimum. It happens to the best optimisers.'
  if (e.collected < ORBS.length) return 'Nearly there. Try a smaller learning rate, or a bigger compute budget.'
  return 'Every orb, no minimum. Classic overfit to the training set.'
}

export default function Minimum() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const world = useRef<WorldHandle | null>(null)
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('intro')
  const [paused, setPaused] = useState(false)
  const [failed, setFailed] = useState(false)
  const [found, setFound] = useState<string[]>([])
  const [toast, setToast] = useState<{ key: number; name: string; text: string } | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [hud, setHud] = useState<Hud>(START_HUD)
  const [ending, setEnding] = useState<Ending | null>(null)
  const [bestRun, setBestRun] = useState<{ best: number; isNew: boolean } | null>(null)
  const [best, setBest] = useState<number | null>(null)
  const maxCombo = useRef(0)
  const lastSecond = useRef(60)
  const soundDone = useRef(false)
  // dx/dy steer (clamped to the rim); sx/sy only draw the knob, which stretches a little past the rim.
  const [stick, setStick] = useState<{ x: number; y: number; dx: number; dy: number; sx: number; sy: number } | null>(null)

  useEffect(() => setBest(loadBest(game.id)), [])

  const started = phase !== 'intro'
  useEffect(() => {
    if (!started) return
    const c = canvas.current
    if (!c) return
    let cancelled = false
    import('../../three/playWorld').then(({ mountWorld }) => {
      if (cancelled) return
      try {
        world.current = mountWorld(
          c,
          ORBS,
          {
            onCollect: (id, info) => {
              const p = projects.find((x) => x.slug === id)
              maxCombo.current = Math.max(maxCombo.current, info.combo)
              setFound((f) => [...f, id])
              setToast({ key: info.collected, name: p?.name ?? '', text: `+${info.points}${info.combo > 1 ? `  ×${info.combo} streak` : ''}  +${info.bonus} s` })
              sfx.collect(info.combo - 1)
            },
            onUnlock: () => setUnlocked(true),
            onTick: (h) => {
              setHud(h)
              // A tick for each of the last ten seconds.
              const s = Math.ceil(h.left)
              if (s !== lastSecond.current) {
                lastSecond.current = s
                if (s <= 10 && s > 0) sfx.tick()
              }
            },
            onBump: () => sfx.bump(),
            onBoost: () => sfx.boost(),
            onWin: (r) => {
              if (soundDone.current) return
              soundDone.current = true
              sfx.win()
              finish('won', { score: r.score, left: r.left, bonus: r.bonus, collected: ORBS.length })
            },
            onLose: (r) => {
              if (soundDone.current) return
              soundDone.current = true
              sfx.lose()
              finish('lost', { score: r.score, left: 0, bonus: 0, collected: r.collected })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, reduced])

  // A beat after the ball lands in the minimum (or the clock stops) so the player sees the burst before the card arrives.
  const finish = (p: 'won' | 'lost', e: Ending) => {
    setEnding(e)
    setBestRun(saveBest(game.id, e.score))
    setBest(loadBest(game.id))
    window.setTimeout(() => setPhase(p), reduced ? 0 : 900)
  }

  // Auto-hide the pickup toast.
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2300)
    return () => clearTimeout(id)
  }, [toast])

  const pause = useCallback(() => {
    setPaused(true)
    setStick(null)
    world.current?.setInput(0, 0)
    world.current?.setPaused(true)
  }, [])
  const resume = () => {
    setPaused(false)
    world.current?.setPaused(false)
    canvas.current?.focus()
  }
  usePause(phase === 'playing' && !paused && !ending, pause)

  const restart = () => {
    world.current?.restart()
    world.current?.setPaused(false)
    setPaused(false)
    setFound([])
    setUnlocked(false)
    setEnding(null)
    setBestRun(null)
    setToast(null)
    setHud(START_HUD)
    maxCombo.current = 0
    lastSecond.current = 60
    soundDone.current = false
    setPhase('playing')
    canvas.current?.focus()
  }

  // Touch, pen and mouse: drag anywhere to steer (a virtual joystick).
  const onDown = (e: React.PointerEvent) => {
    if (phase !== 'playing' || paused) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setStick({ x: e.clientX, y: e.clientY, dx: 0, dy: 0, sx: 0, sy: 0 })
  }
  const onMove = (e: React.PointerEvent) => {
    if (!stick) return
    const rx = (e.clientX - stick.x) / 60
    const ry = (e.clientY - stick.y) / 60
    const dx = Math.max(-1, Math.min(1, rx))
    const dy = Math.max(-1, Math.min(1, ry))
    const m = Math.hypot(rx, ry)
    const show = m > 1 ? (1 + 0.28 * (1 - Math.exp(-(m - 1) * 2.5))) / m : 1
    setStick({ ...stick, dx, dy, sx: rx * show, sy: ry * show })
    world.current?.setInput(dx, dy)
  }
  const onUp = () => {
    setStick(null)
    world.current?.setInput(0, 0)
  }

  const playing = phase === 'playing'
  const urgent = hud.left < 10
  const toastProject = toast
  const foundProjects = found.map((id) => projects.find((p) => p.slug === id)!).filter(Boolean)

  return (
    <main id="main" className="dark relative h-[100svh] overflow-hidden bg-[#0b0d1a] text-fog">
      <canvas
        ref={canvas}
        tabIndex={0}
        aria-label="3D loss landscape. Use the arrow keys or WASD to roll the ball and Space to boost, or drag to steer."
        className="absolute inset-0 h-full w-full touch-none outline-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      <PlayBar overlay>
        {playing && (
          <button
            type="button"
            onClick={pause}
            aria-label="Pause"
            className="play-btn-press flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/30 text-fog hover:border-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        )}
      </PlayBar>

      {/* Heads-up display */}
      {playing && !ending && (
        <>
          <div className="pointer-events-none absolute left-4 top-[4.6rem] w-[min(15rem,calc(100%-2rem))] font-display tabular-nums sm:left-6 sm:top-20">
            <p className="text-5xl font-semibold leading-none sm:text-6xl">
              <ScoreDigits value={hud.score} />
            </p>
            <p className="mt-1.5 text-mist">
              {found.length}/{ORBS.length} orbs
            </p>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-semibold ${urgent ? 'text-[#ffd29a]' : ''}`} style={urgent && !reduced ? { animation: 'play-blink 1s infinite' } : undefined}>
                  {Math.ceil(hud.left)}
                  <span className="text-base font-normal text-mist"> s</span>
                </span>
                <span className="text-sm text-mist">epochs left</span>
              </div>
              <Bar value={hud.left / 60} danger={urgent} className="mt-1" />
            </div>
            {hud.combo > 1 && (
              <div className="mt-3">
                <p key={hud.combo} className="inline-block origin-left rounded-full bg-[#ffd29a] px-3 py-1 text-sm font-semibold text-ink" style={{ animation: 'play-pop .35s cubic-bezier(.2,.8,.2,1.4)' }}>
                  ×{hud.combo} streak
                </p>
                <Bar value={hud.comboLeft} className="mt-1.5 w-28" />
              </div>
            )}
          </div>
          {hud.noise > 0 && (
            <p className="pointer-events-none absolute right-4 top-[4.6rem] text-right text-sm text-mist sm:right-6 sm:top-20">
              gradient noise
              <span className="mt-1.5 block h-1.5 w-24 overflow-hidden rounded-full bg-white/15">
                <span className="block h-full rounded-full bg-[#ffd29a]" style={{ width: `${Math.min(1, hud.noise / 15) * 100}%` }} />
              </span>
            </p>
          )}
        </>
      )}

      {/* Boost: raise the learning rate. A ring fills while it recharges. */}
      {playing && !ending && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault()
            world.current?.boost()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') world.current?.boost()
          }}
          aria-label="Boost: raise the learning rate (Space)"
          className="play-btn-press absolute bottom-6 right-4 z-10 grid h-[76px] w-[76px] touch-none place-items-center rounded-full text-ink sm:bottom-8 sm:right-8 sm:h-[88px] sm:w-[88px]"
          style={{ background: `conic-gradient(${hud.boost >= 1 ? '#ffffff' : '#8c99ff'} ${hud.boost * 360}deg, rgba(255,255,255,.18) 0)`, animation: hud.boost >= 1 && !reduced ? 'play-pop .3s cubic-bezier(.2,.8,.2,1.4)' : undefined }}
        >
          <span className={`grid h-[66px] w-[66px] place-items-center rounded-full text-center font-display text-sm font-semibold leading-tight sm:h-[78px] sm:w-[78px] ${hud.boost >= 1 ? 'bg-white' : 'bg-[#1a1f3a] text-fog/70'}`}>
            Boost
            <span className="hidden text-[0.7rem] font-normal opacity-70 sm:block">Space</span>
          </span>
        </button>
      )}

      {/* Controls hint */}
      {playing && !ending && (
        <p className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 text-center text-sm text-mist sm:block">Arrow keys or WASD to roll · Space to boost · Esc to pause</p>
      )}
      {playing && !ending && !stick && found.length === 0 && (
        <p className="pointer-events-none absolute bottom-10 left-4 text-sm text-mist sm:hidden">Drag anywhere to steer</p>
      )}

      {/* Pickup toast: small and quick, so the flow never stops */}
      {playing && !ending && toastProject && (
        <div
          key={toastProject.key}
          role="status"
          style={{ animation: 'play-toast 2.3s cubic-bezier(.2,.8,.2,1.2) both' }}
          className="pointer-events-none absolute inset-x-0 bottom-28 mx-auto w-max max-w-[calc(100%-7rem)] origin-bottom rounded-2xl bg-white px-5 py-3 text-ink shadow-2xl sm:bottom-24"
        >
          <p className="font-display text-xl font-semibold tracking-[-0.02em]">{toastProject.name}</p>
          <p className="text-sm text-slate">{toastProject.text}</p>
        </div>
      )}
      {playing && !ending && unlocked && !toastProject && (
        <p role="status" style={{ animation: 'play-pop .45s cubic-bezier(.2,.8,.2,1.4)' }} className="absolute inset-x-0 bottom-28 mx-auto w-max max-w-[calc(100%-7rem)] origin-bottom rounded-full bg-voltsoft px-5 py-3 text-center font-medium text-ink sm:bottom-24">
          All found. Follow the beam to the global minimum.
        </p>
      )}

      {/* Touch joystick */}
      {stick && (
        <div aria-hidden="true" className="pointer-events-none fixed h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" style={{ left: stick.x, top: stick.y }}>
          <div className="absolute left-1/2 top-1/2 h-10 w-10 rounded-full bg-white/80" style={{ transform: `translate(calc(-50% + ${stick.sx * 30}px), calc(-50% + ${stick.sy * 30}px))` }} />
        </div>
      )}

      {phase === 'intro' && <GameIntro game={game} best={best} onStart={() => setPhase('playing')} />}

      {failed && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#0b0d1a] p-6 text-center">
          <p className="max-w-md">
            This game needs WebGL, which your browser has turned off.{' '}
            <a href="/play/" className="link">
              Try one of the other games
            </a>
            .
          </p>
        </div>
      )}

      {paused && playing && <PauseCard onResume={resume} onRestart={restart} />}

      {(phase === 'won' || phase === 'lost') && ending && bestRun && (
        <ResultsCard
          game={game}
          verdict={phase === 'won' ? 'Converged.' : 'Diverged. The clock ran out.'}
          score={ending.score}
          best={bestRun.best}
          isNew={bestRun.isNew}
          rows={[
            ['Orbs found', `${ending.collected} of ${ORBS.length}`],
            ['Best streak', maxCombo.current > 0 ? `×${maxCombo.current}` : 'none'],
            phase === 'won' ? ['Time bonus', `+${fmtScore(ending.bonus - 500)}`] : ['Global minimum', 'not reached'],
          ]}
          pun={pun(phase === 'won', ending)}
          shareText={`I scored ${fmtScore(ending.score)} on Find the minimum (${ending.collected}/${ORBS.length} orbs, best streak ×${maxCombo.current || 0}${phase === 'won' ? ', converged' : ''}). Can you beat it?`}
          onAgain={restart}
        >
          {foundProjects.length > 0 && (
            <div className="play-rise mt-5" style={{ ['--i' as string]: 10 }}>
              <p className="text-sm text-mist">Projects you found</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {foundProjects.map((p) => (
                  <li key={p.slug}>
                    <a href={`/work/${p.slug}/`} className="play-btn-press inline-flex min-h-[44px] items-center rounded-full border border-white/30 px-4 text-[0.9375rem] hover:border-white">
                      {p.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ResultsCard>
      )}
    </main>
  )
}

/** The score, with the last digit popping each time it changes: the counter's secondary action. */
function ScoreDigits({ value }: { value: number }) {
  return (
    <span key={value} className="inline-block origin-bottom-left" style={{ animation: value ? 'play-bump .3s cubic-bezier(.2,.8,.2,1.4)' : undefined }}>
      {fmtScore(value)}
    </span>
  )
}

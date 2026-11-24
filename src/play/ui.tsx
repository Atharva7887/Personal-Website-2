import { useEffect, useState, type ReactNode } from 'react'
import { SITE_URL } from '../data/site'
import { useReducedMotion } from '../components/motion'
import { useCountUp } from './hooks'
import { fmtScore } from './math'
import { sfx, useSound } from './sound'
import type { GameInfo } from './games'
import './play.css'

/** Shared by every game: the logo, a way back to the hub and the sound switch. */
export function PlayBar({ overlay = false, hub = false, children }: { overlay?: boolean; hub?: boolean; children?: ReactNode }) {
  return (
    <div className={`${overlay ? 'pointer-events-none absolute inset-x-0 top-0 z-20' : 'relative z-20 shrink-0'} flex items-start justify-between gap-3 p-4 sm:p-6`}>
      <div className="pointer-events-auto flex items-center">
        <a href="/" aria-label="Atharva Shirke, home" className="flex min-h-[44px] min-w-[44px] items-center font-display text-lg font-semibold">
          AS<span className="text-voltsoft">.</span>
        </a>
        {!hub && (
          <a href="/play/" className="play-btn-press flex min-h-[44px] items-center rounded-full px-3 text-[0.9375rem] text-fog/80 hover:text-white">
            <span aria-hidden="true" className="mr-1.5">←</span>All games
          </a>
        )}
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        {children}
        <SoundToggle />
      </div>
    </div>
  )
}

/** Muted by default. The icon shows the state, and the label says it in words for anyone who can't see the icon. */
export function SoundToggle() {
  const [on, toggle] = useSound()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Sound on. Turn off' : 'Sound off. Turn on'}
      className="play-btn-press flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full border border-white/30 px-3 text-[0.9375rem] text-fog hover:border-white sm:px-4"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" fillOpacity={on ? 0.9 : 0.25} />
        {on ? (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        ) : (
          <path d="m16 9 5 6m0-6-5 6" />
        )}
      </svg>
      <span className="hidden sm:inline">{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}

/** The screen before a game: what it is, how to play, one big button. Also the placeholder while a game's code loads. */
export function GameIntro({ game, onStart, best }: { game: GameInfo; onStart?: () => void; best?: number | null }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end overflow-y-auto p-5 pt-24 sm:p-10 sm:pt-24" style={{ background: game.glow, backgroundColor: '#0b0d1a' }}>
      <p className="play-rise max-w-md text-lg text-fog/85">{game.kicker}</p>
      <h1 className="play-rise mt-4 font-display text-[clamp(3.4rem,13vw,13rem)] font-semibold leading-[0.84] tracking-[-0.05em]" style={{ ['--i' as string]: 1 }}>
        {game.title}
        <span className="text-voltsoft">.</span>
      </h1>
      <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="play-rise max-w-xl" style={{ ['--i' as string]: 2 }}>
          <p className="text-fog/85">{game.how}</p>
          <p className="mt-3 text-sm text-mist">
            {game.time} · {game.controls}
          </p>
        </div>
        <div className="play-rise flex flex-wrap gap-3" style={{ ['--i' as string]: 3 }}>
          {onStart && (
            <button
              type="button"
              autoFocus
              onClick={() => {
                sfx.click()
                onStart()
              }}
              className="btn play-btn-press bg-white px-8 text-lg text-ink hover:bg-voltsoft"
            >
              {game.startLabel}
            </button>
          )}
          <a href="/play/" className="btn play-btn-press border border-white/40 text-white hover:border-white">
            All games
          </a>
        </div>
      </div>
      {best ? <p className="mt-6 text-sm text-mist">Your best: {fmtScore(best)}</p> : <p className="mt-6 text-sm text-mist">No score yet. Set the bar.</p>}
    </div>
  )
}

function ShareButton({ text, path }: { text: string; path: string }) {
  const [done, setDone] = useState(false)
  const url = SITE_URL + path
  const share = async () => {
    try {
      const coarse = window.matchMedia('(pointer: coarse)').matches
      if (coarse && typeof navigator.share === 'function') {
        await navigator.share({ text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      sfx.click()
      setDone(true)
      window.setTimeout(() => setDone(false), 2200)
    } catch {
      /* the visitor dismissed the share sheet, or clipboard access was refused */
    }
  }
  return (
    <button type="button" onClick={share} className="btn play-btn-press border border-white/40 text-white hover:border-white" aria-live="polite">
      {done ? (
        <span key="d" style={{ animation: 'play-pop .35s cubic-bezier(.2,.8,.2,1.4)' }}>
          Copied. Dare a friend
        </span>
      ) : (
        'Share my score'
      )}
    </button>
  )
}

export interface ResultsProps {
  game: GameInfo
  verdict: string
  score: number
  /** Short facts under the score: label and value. */
  rows: [string, string][]
  /** The data-science one-liner. */
  pun: string
  best: number
  isNew: boolean
  shareText: string
  onAgain: () => void
  children?: ReactNode
}

/** The ending, shared by all three games: verdict, a big counted-up score, the facts, a pun, then what to do next. */
export function ResultsCard({ game, verdict, score, rows, pun, best, isNew, shareText, onAgain, children }: ResultsProps) {
  const reduced = useReducedMotion()
  const shown = useCountUp(score, reduced)
  return (
    <div role="dialog" aria-modal="true" aria-label={`${game.title} results`} className="absolute inset-0 z-30 overflow-y-auto bg-[#0b0d1a]/80 backdrop-blur-md" style={{ animation: 'fade-in .5s ease-out both' }}>
      <div className="flex min-h-full w-full max-w-5xl flex-col justify-end p-5 pt-20 sm:p-10 sm:pt-24">
        <p className="play-rise text-lg text-fog/85">{verdict}</p>
        <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
          <h2 className="origin-bottom-left font-display text-[clamp(4.2rem,17vw,12rem)] font-semibold leading-[0.85] tracking-[-0.05em] tabular-nums" style={{ animation: 'play-pop .7s cubic-bezier(.2,.8,.2,1.3) .1s both' }}>
            {fmtScore(shown)}
          </h2>
          {isNew ? (
            <span className="play-pop mb-2 rounded-full bg-[#ffd29a] px-4 py-1.5 text-sm font-semibold text-ink" style={{ ['--i' as string]: 12 }}>
              New best
            </span>
          ) : (
            <span className="play-rise mb-2 text-mist" style={{ ['--i' as string]: 10 }}>
              Best {fmtScore(best)}
            </span>
          )}
        </div>
        <dl className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(([k, v], i) => (
            <div key={k} className="play-rise flex items-baseline justify-between gap-4 border-t border-white/15 py-2.5" style={{ ['--i' as string]: 3 + i }}>
              <dt className="text-mist">{k}</dt>
              <dd className="font-display text-lg tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="play-rise mt-5 max-w-2xl font-display text-xl text-fog sm:text-2xl" style={{ ['--i' as string]: 9 }}>
          {pun}
        </p>
        <div className="play-rise mt-7 flex flex-wrap gap-3" style={{ ['--i' as string]: 11 }}>
          <button type="button" autoFocus onClick={onAgain} className="btn play-btn-press bg-white px-8 text-ink hover:bg-voltsoft">
            Play again
          </button>
          <ShareButton text={shareText} path={game.path} />
          <a href="/play/" className="btn play-btn-press border border-white/40 text-white hover:border-white">
            More games
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Lets a held key, such as Escape, pause a game; and pauses when the tab is hidden. */
export function usePause(active: boolean, onPause: () => void) {
  useEffect(() => {
    if (!active) return
    const hidden = () => document.hidden && onPause()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') onPause()
    }
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('keydown', key)
    }
  }, [active, onPause])
}

export function PauseCard({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Paused" className="absolute inset-0 z-30 grid place-items-center bg-[#0b0d1a]/80 p-5 backdrop-blur-md" style={{ animation: 'fade-in .25s ease-out both' }}>
      <div className="play-pop w-full max-w-sm rounded-3xl bg-white p-7 text-ink shadow-2xl">
        <h2 className="font-display text-4xl font-semibold tracking-[-0.03em]">Paused</h2>
        <p className="mt-2 text-slate">The clock is stopped. Take your time.</p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" autoFocus onClick={onResume} className="btn play-btn-press bg-ink text-fog hover:bg-volt">
            Resume
          </button>
          <button type="button" onClick={onRestart} className="btn play-btn-press border border-ink/25 hover:border-volt hover:text-volt">
            Restart
          </button>
          <a href="/play/" className="btn play-btn-press border border-ink/25 hover:border-volt hover:text-volt">
            All games
          </a>
        </div>
      </div>
    </div>
  )
}

/** A thin draining bar, for time and streaks. */
export function Bar({ value, danger = false, className = '' }: { value: number; danger?: boolean; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-white/15 ${className}`}>
      <div className={`h-full rounded-full ${danger ? 'bg-[#ffd29a]' : 'bg-voltsoft'}`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

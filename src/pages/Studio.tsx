import { useEffect, useRef, useState } from 'react'
import { EMAIL, RESUME_URL } from '../data/site'
import { useReducedMotion } from '../components/motion'
import type { RoomHandle, StopId } from '../three/room'

interface Stop {
  id: Exclude<StopId, 'overview'>
  label: string
  title: string
  body: string
  link?: { label: string; href: string }
}

// The tour, in story order. Every stop points at real work.
const STOPS: Stop[] = [
  {
    id: 'window',
    label: 'Window',
    title: 'Pune, India',
    body: 'This is where I work from. The window follows the real time in Pune, so if it’s dark outside, it’s late here too.',
  },
  {
    id: 'desk',
    label: 'Desk',
    title: 'Where the work happens',
    body: 'Apps, machine-learning pipelines and websites. The monitor shows what I’ve shipped lately.',
    link: { label: 'See all my work', href: '/#work' },
  },
  {
    id: 'gpu',
    label: 'GPU tower',
    title: 'Pipelines on GPUs',
    body: 'At IndiskaAI I build deep-learning pipelines that predict and compare antibody structures, running on rented GPUs that survive restarts.',
    link: { label: 'Read the case study', href: '/work/protein-ml-pipelines/' },
  },
  {
    id: 'poster',
    label: 'Poster',
    title: 'The antibody',
    body: 'The Y-shaped molecule I spend my days with. I built an offline desktop app that shows how one binds its target.',
    link: { label: 'Read the case study', href: '/work/interaction-analysis-app/' },
  },
  {
    id: 'phone',
    label: 'Phone',
    title: 'Unhaze',
    body: 'My Android app: a gentle pause before distracting apps, with a little cloud called Puff. Coming soon to Google Play.',
    link: { label: 'Read the case study', href: '/work/unhaze/' },
  },
  {
    id: 'plant',
    label: 'Plant',
    title: 'Still alive',
    body: 'Partly thanks to a small web app I made that works out water, soil and compost for a plant from its name and height.',
    link: { label: 'Read the case study', href: '/work/plant-cultivation-helper/' },
  },
  {
    id: 'shelf',
    label: 'Bookshelf',
    title: 'Research and learning',
    body: 'A computer engineering degree, a first-author manuscript on antibody structure prediction in progress, and a co-authored review under submission.',
    link: RESUME_URL ? { label: 'Download my résumé', href: RESUME_URL } : { label: 'About me', href: '/#about' },
  },
  {
    id: 'arcade',
    label: 'Arcade',
    title: 'Take a break',
    body: 'A small 3D game about how machine learning learns: roll down a loss landscape and find the global minimum.',
    link: { label: 'Play Find the minimum', href: '/play/' },
  },
  {
    id: 'mug',
    label: 'Coffee',
    title: 'Let’s grab a coffee',
    body: 'Have a project in mind, a role, or just want to talk about models and apps? I’d like to hear about it.',
    link: { label: 'Email me', href: `mailto:${EMAIL}` },
  },
]

function puneIsNight() {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }).format(new Date()))
  return h < 6 || h >= 19
}

export function Studio() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const room = useRef<RoomHandle | null>(null)
  const reduced = useReducedMotion()
  const [entered, setEntered] = useState(false)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState<Stop['id'] | null>(null)
  const [hover, setHover] = useState<StopId | null>(null)
  const [touring, setTouring] = useState(false)
  const [night, setNight] = useState(false)
  const [seen, setSeen] = useState<Set<string>>(new Set())

  const open = (id: Stop['id']) => {
    setActive(id)
    setSeen((s) => new Set(s).add(id))
    room.current?.focus(id)
  }
  const openRef = useRef(open)
  openRef.current = open

  useEffect(() => setNight(puneIsNight()), [])

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    let cancelled = false
    import('../three/room').then(({ mountRoom }) => {
      if (cancelled) return
      try {
        room.current = mountRoom(
          c,
          {
            onHover: setHover,
            onSelect: (id) => {
              if (id === 'overview') return
              setEntered(true)
              setTouring(false)
              openRef.current(id)
            },
          },
          { reduced, night: puneIsNight() },
        )
      } catch {
        setFailed(true)
      }
    })
    return () => {
      cancelled = true
      room.current?.dispose()
      room.current = null
    }
  }, [reduced])

  useEffect(() => room.current?.setNight(night), [night])

  const overview = () => {
    setActive(null)
    setTouring(false)
    room.current?.focus('overview')
  }
  const tourIndex = active ? STOPS.findIndex((s) => s.id === active) : -1
  const startTour = () => {
    setEntered(true)
    setTouring(true)
    open(STOPS[0].id)
  }
  const step = (d: number) => {
    const i = tourIndex + d
    if (i < 0 || i >= STOPS.length) return overview()
    open(STOPS[i].id)
  }

  // Arrow keys move through the tour; Escape returns to the whole room.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!entered) return
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
      if (e.key === 'Escape') overview()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const stop = STOPS.find((s) => s.id === active)
  const hoverStop = STOPS.find((s) => s.id === hover)
  const dark = night

  return (
    <main id="main" className={'relative h-[100svh] overflow-hidden transition-colors duration-700 ' + (dark ? 'dark bg-[#0b0d1a] text-fog' : 'bg-fog text-ink')}>
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full touch-manipulation" />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 sm:p-7">
        <a href="/" className="pointer-events-auto flex min-h-[44px] items-center font-display text-lg font-semibold">
          AS<span className={dark ? 'text-voltsoft' : 'text-volt'}>.</span>
        </a>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setNight((n) => !n)}
            aria-pressed={night}
            className={'btn min-h-[44px] px-4 text-sm ' + (dark ? 'border border-white/30 hover:border-white' : 'btn-ghost bg-white/60')}
          >
            {night ? 'Lights on' : 'Lights off'}
          </button>
          {entered && active && (
            <button onClick={overview} className={'btn min-h-[44px] px-4 text-sm ' + (dark ? 'bg-white text-ink' : 'btn-ink')}>
              Whole room
            </button>
          )}
        </div>
      </header>

      {!entered && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-10">
          <div className="pointer-events-auto max-w-3xl">
            <p className={dark ? 'text-fog/80' : 'text-slate'}>Studio</p>
            <h1 className="mt-2 font-display text-[clamp(3rem,9vw,8rem)] font-semibold leading-[0.85] tracking-[-0.05em]">
              Come in.
              <br />
              This is my room.
            </h1>
            <p className={'mt-5 max-w-lg text-lg ' + (dark ? 'text-fog/85' : 'text-slate')}>
              Everything in here is something I’ve made or care about. Click around, or let me show you.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={startTour} className={'btn px-7 text-lg ' + (dark ? 'bg-white text-ink hover:bg-voltsoft' : 'btn-ink')}>
                Take the tour
              </button>
              <button onClick={() => setEntered(true)} className={'btn ' + (dark ? 'border border-white/40 hover:border-white' : 'btn-ghost bg-white/60')}>
                Look around myself
              </button>
            </div>
          </div>
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <p className="max-w-md">
            This room needs WebGL, which your browser has turned off.{' '}
            <a href="/#work" className="link">
              See my work instead
            </a>
            .
          </p>
        </div>
      )}

      {entered && !stop && hoverStop && (
        <p className={'pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium ' + (dark ? 'bg-white text-ink' : 'bg-ink text-fog')}>
          {hoverStop.label}
        </p>
      )}

      {stop && (
        <section
          key={stop.id}
          aria-live="polite"
          className="absolute bottom-4 left-4 right-4 animate-[pop_.5s_cubic-bezier(.2,.8,.2,1.3)] rounded-3xl bg-white p-6 text-ink shadow-[0_20px_60px_-20px_rgba(12,15,20,.5)] sm:bottom-8 sm:left-8 sm:right-auto sm:w-[26rem] sm:p-7"
        >
          {touring && (
            <p className="text-sm tabular-nums text-slate">
              {tourIndex + 1} of {STOPS.length}
            </p>
          )}
          <h2 className="mt-1 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">{stop.title}</h2>
          <p className="mt-3 text-slate">{stop.body}</p>
          {stop.link && (
            <a href={stop.link.href} className="link mt-3 inline-flex min-h-[44px] items-center font-medium">
              {stop.link.label}
            </a>
          )}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
            <button onClick={() => step(-1)} className="btn btn-ghost min-h-[44px] px-4 text-sm">
              Back
            </button>
            <div aria-hidden="true" className="flex gap-1.5">
              {STOPS.map((s) => (
                <span key={s.id} className={'h-1.5 w-1.5 rounded-full ' + (s.id === active ? 'bg-volt' : seen.has(s.id) ? 'bg-ink/40' : 'bg-ink/15')} />
              ))}
            </div>
            <button onClick={() => step(1)} className="btn btn-ink min-h-[44px] px-4 text-sm">
              {tourIndex === STOPS.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </section>
      )}

      {entered && (
        <nav aria-label="Things in the room" className="absolute right-4 top-24 hidden max-h-[calc(100svh-8rem)] overflow-auto sm:right-7 md:block">
          <ul className="space-y-1.5">
            {STOPS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setTouring(false)
                    open(s.id)
                  }}
                  aria-current={active === s.id}
                  className={
                    'flex min-h-[40px] w-full items-center gap-2 rounded-full px-4 text-left text-sm font-medium transition-colors ' +
                    (active === s.id || hover === s.id
                      ? dark
                        ? 'bg-white text-ink'
                        : 'bg-ink text-fog'
                      : dark
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-white/70 hover:bg-white')
                  }
                >
                  <span className={'h-1.5 w-1.5 rounded-full ' + (seen.has(s.id) ? 'bg-volt' : 'bg-current opacity-30')} />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {entered && !stop && (
        <p className={'pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm ' + (dark ? 'text-mist' : 'text-slate')}>
          Click anything in the room
        </p>
      )}
    </main>
  )
}

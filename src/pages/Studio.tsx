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
    id: 'gallery',
    label: 'Gallery',
    title: 'On the wall',
    body: 'Six projects, framed: apps, machine-learning pipelines and websites. Each one has its own case study.',
    link: { label: 'See all my work', href: '/#work' },
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
    id: 'door',
    label: 'Door',
    title: 'The way out',
    body: 'The door opens on to a small garden. Step outside for a minute.',
  },
  {
    id: 'garden',
    label: 'Garden',
    title: 'The garden',
    body: 'Somewhere to step away from the screen. It follows Pune time too, so the lights come on out here when it’s night.',
  },
  {
    id: 'mug',
    label: 'Coffee',
    title: 'Let’s grab a coffee',
    body: 'Have a project in mind, a role, or just want to talk about models and apps? I’d like to hear about it.',
    link: { label: 'Email me', href: `mailto:${EMAIL}` },
  },
]

// The 3D models in the room that other people made, shared under CC BY 4.0 and simplified for the web.
const CREDITS = [
  { what: 'Desk, keyboard and chair', title: 'Modern Gaming PC & Workspace Setup', by: 'Syzoth', href: 'https://sketchfab.com/3d-models/modern-gaming-pc-workspace-setup-b47af9368f6f4df4ad085e64de92e49e' },
  { what: 'Monitor', title: 'Ultrawide Monitor', by: 'dylanheyes', href: 'https://sketchfab.com/3d-models/ultrawide-monitor-f84d24b6df3648d884fd9be9c8007dd4' },
  { what: 'Monstera', title: 'Monstera Deliciosa Potted Mid-Century plant', by: 'Giora', href: 'https://sketchfab.com/3d-models/monstera-deliciosa-potted-mid-century-plant-1ab9bf841df04c07b1819be596327629' },
  { what: 'Grass', title: 'Simple grass chunks', by: '3dhdscan', href: 'https://sketchfab.com/3d-models/simple-grass-chunks-eb4f6dc9d4e3455ea3435385faf58b60' },
  { what: 'Laptop', title: 'HP Omen Laptop', by: 'Fadi', href: 'https://sketchfab.com/3d-models/hp-omen-laptop-cb33442e53e6404a9439f320401da1d9' },
  { what: 'Controller stand', title: 'Bomb Monkey', by: 'nosimaj4', href: 'https://sketchfab.com/3d-models/bomb-monkey-37830c004a084435acf1b5e4e4c5f15c' },
  { what: 'Console', title: 'PS5', by: 'rtql8d', href: 'https://sketchfab.com/3d-models/ps5-d788de3735964151a3e24fd59c0f1956' },
  { what: 'Sofa', title: 'Sofa', by: 'AngelNebesniy', href: 'https://sketchfab.com/3d-models/sofa-c7a0c35f4f0b49f8b4fea273f9014001' },
  { what: 'Arcade cabinet (repainted)', title: 'Game-ready arcade machine', by: 'Snji', href: 'https://sketchfab.com/3d-models/game-ready-arcade-machine-25fb590707034cff8b555953d66a0f7b' },
  { what: 'Mug', title: 'Coffee Mug (School Project)', by: 'Ole Gunnar Isager', href: 'https://sketchfab.com/3d-models/coffee-mug-school-project-5f5ccee1514c440887c072fae8e0d699' },
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
  const [credits, setCredits] = useState(false)
  const [dir, setDir] = useState<1 | -1>(1) // which way the visitor last moved through the tour
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const main = useRef<HTMLElement>(null)

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
            onProgress: (p) => !cancelled && setProgress((old) => Math.max(old, p)),
          },
          { reduced, night: puneIsNight() },
        )
        const finish = () => {
          if (cancelled) return
          setProgress(1)
          setLoaded(true)
        }
        room.current.ready.then(finish, finish)
      } catch {
        setFailed(true)
      }
    })
    // Never keep anyone waiting forever: after 25 s, let them in with whatever has arrived.
    const giveUp = window.setTimeout(() => setLoaded(true), 25000)
    return () => {
      cancelled = true
      window.clearTimeout(giveUp)
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
    setDir(d < 0 ? -1 : 1)
    const i = tourIndex + d
    if (i < 0 || i >= STOPS.length) return overview()
    open(STOPS[i].id)
  }

  // Scrolling walks through the room: one stop per scroll gesture. Ctrl + wheel (and pinch) zooms instead.
  const wheel = useRef({ acc: 0, lockedUntil: 0 })
  const onWheelRef = useRef<(e: WheelEvent) => void>(() => {})
  onWheelRef.current = (e: WheelEvent) => {
    if (e.ctrlKey || credits || failed || !loaded) return
    const w = wheel.current
    const now = performance.now()
    if (now < w.lockedUntil) {
      w.lockedUntil = now + 220 // a trackpad keeps sending small deltas: wait for the gesture to end
      return
    }
    w.acc += e.deltaY
    if (Math.abs(w.acc) < 50) return
    const d = w.acc > 0 ? 1 : -1
    w.acc = 0
    w.lockedUntil = now + 650
    if (!entered || !active) {
      if (d > 0) startTour()
      return
    }
    setTouring(true)
    step(d)
  }
  useEffect(() => {
    const el = main.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      onWheelRef.current(e)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Arrow keys move through the tour; Escape returns to the whole room.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCredits(false)
      if (!entered) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') step(1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') step(-1)
      if (e.key === 'Escape') overview()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const stop = STOPS.find((s) => s.id === active)
  const hoverStop = STOPS.find((s) => s.id === hover)
  const dark = night

  return (
    <main ref={main} id="main" className={'relative h-[100svh] overflow-hidden transition-colors duration-700 ' + (dark ? 'dark bg-[#0b0d1a] text-fog' : 'bg-fog text-ink')}>
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full touch-manipulation" />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-5 sm:p-7">
        <div className="pointer-events-auto flex flex-col items-start">
          <a href="/" className="flex min-h-[44px] items-center font-display text-lg font-semibold">
            AS<span className={dark ? 'text-voltsoft' : 'text-volt'}>.</span>
          </a>
          <button
            onClick={() => setCredits((c) => !c)}
            aria-expanded={credits}
            aria-controls="studio-credits"
            className={'flex min-h-[44px] items-center text-sm underline underline-offset-4 ' + (dark ? 'text-fog/80 hover:text-fog' : 'text-slate hover:text-ink')}
          >
            Credits
          </button>
        </div>
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

      {credits && (
        <section
          id="studio-credits"
          aria-label="3D model credits"
          className="absolute left-4 top-28 z-10 max-h-[calc(100svh-8rem)] w-[min(22rem,calc(100vw-2rem))] animate-[pop_.4s_cubic-bezier(.2,.8,.2,1.3)] overflow-auto rounded-3xl bg-white p-6 text-sm text-ink shadow-[0_20px_60px_-20px_rgba(12,15,20,.5)] sm:left-7"
        >
          <h2 className="font-display text-xl font-semibold">3D model credits</h2>
          <p className="mt-2 text-slate">
            I built the room and the garden around models made by other people. These ones are shared under{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" className="link" target="_blank" rel="noreferrer">
              CC BY 4.0
            </a>{' '}
            and simplified to load quickly.
          </p>
          <ul className="mt-3 space-y-2">
            {CREDITS.map((c) => (
              <li key={c.href}>
                <span className="text-slate">{c.what}: </span>
                <a href={c.href} className="link" target="_blank" rel="noreferrer">
                  {c.title}
                </a>{' '}
                by {c.by}
              </li>
            ))}
          </ul>
          <button onClick={() => setCredits(false)} className="btn btn-ghost mt-4 min-h-[44px] px-4 text-sm">
            Close
          </button>
        </section>
      )}

      {/* A soft wash behind the headline, so it stays readable over the garden. */}
      {!entered && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(to top right, ${dark ? '#0b0d1a' : '#e4e7ec'} 8%, ${dark ? 'rgba(11,13,26,.7)' : 'rgba(228,231,236,.7)'} 26%, transparent 48%)`,
          }}
        />
      )}

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
              Everything in here is something I’ve made or care about. Drag to turn the room, scroll to walk through it, or let me show you.
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
          style={{ animation: `${dir > 0 ? 'card-from-below' : 'card-from-above'} .6s cubic-bezier(.2,.8,.2,1) both` }}
          className="studio-card absolute bottom-4 left-4 right-4 rounded-3xl bg-white p-6 text-ink shadow-[0_20px_60px_-20px_rgba(12,15,20,.5)] sm:bottom-8 sm:left-8 sm:right-auto sm:w-[26rem] sm:p-7"
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
        <p className={'pointer-events-none absolute bottom-6 left-1/2 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 text-center text-sm ' + (dark ? 'text-mist' : 'text-slate')}>
          <span className="[@media(hover:none)]:hidden">Drag to turn the room · scroll to walk through it · click anything</span>
          <span className="hidden [@media(hover:none)]:inline">Drag to turn the room · tap anything</span>
        </p>
      )}

      {/* Tour progress: a rail that fills as you scroll through the room. */}
      {entered && (
        <div aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 hidden h-48 w-[3px] -translate-y-1/2 overflow-hidden rounded-full sm:block md:left-5">
          <div className={'absolute inset-0 ' + (dark ? 'bg-white/15' : 'bg-ink/10')} />
          <div
            className="absolute inset-x-0 top-0 origin-top bg-volt transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ height: '100%', transform: `scaleY(${active ? (tourIndex + 1) / STOPS.length : 0})` }}
          />
        </div>
      )}

      <StudioLoader progress={progress} done={loaded || failed} dark={dark} />

      {/* Before the visit starts: a small scroll cue. */}
      {!entered && !failed && (
        <div aria-hidden="true" className={'pointer-events-none absolute bottom-8 right-6 hidden flex-col items-center gap-2 text-xs sm:flex sm:right-10 ' + (dark ? 'text-fog/70' : 'text-slate')}>
          <span className="flex h-9 w-6 justify-center rounded-full border-2 border-current pt-1.5">
            <span className="scroll-dot h-2 w-1 rounded-full bg-current" style={{ animation: 'scroll-dot 1.6s ease-in-out infinite' }} />
          </span>
          Scroll
        </div>
      )}
    </main>
  )
}

// What the loader says while the models arrive, one line at a time.
const LOADING_LINES = [
  'Carrying the sofa up the stairs',
  'Plugging in the PC',
  'Watering the plants',
  'Dusting the bookshelves',
  'Putting a coin in the arcade',
  'Opening the blinds',
]

/** Covers the room until its 3D models have downloaded, then lifts away. */
function StudioLoader({ progress, done, dark }: { progress: number; done: boolean; dark: boolean }) {
  const [line, setLine] = useState(0)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (done) return
    const t = window.setInterval(() => setLine((l) => (l + 1) % LOADING_LINES.length), 1600)
    return () => window.clearInterval(t)
  }, [done])
  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setGone(true), 900)
    return () => window.clearTimeout(t)
  }, [done])
  if (gone) return null
  const pct = Math.round(progress * 100)
  return (
    <div
      className={
        'studio-loader absolute inset-0 z-20 flex flex-col justify-end p-5 transition-[opacity,transform] duration-700 ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none sm:p-10 ' +
        (dark ? 'bg-[#0b0d1a] text-fog ' : 'bg-fog text-ink ') +
        (done ? 'pointer-events-none -translate-y-full opacity-0' : '')
      }
    >
      {/* Without JavaScript the room never loads, so the loader should not stay up. */}
      <noscript>
        <style>{'.studio-loader{display:none}'}</style>
      </noscript>
      <p className={'text-sm ' + (dark ? 'text-fog/70' : 'text-slate')}>Studio</p>
      <div className="mt-2 flex items-end justify-between gap-6">
        <p className="font-display text-[clamp(4rem,16vw,12rem)] font-semibold leading-[0.8] tracking-[-0.05em] tabular-nums">
          {pct}
          <span className={dark ? 'text-voltsoft' : 'text-volt'}>%</span>
        </p>
        <p key={line} aria-hidden="true" className={'mb-2 hidden text-right text-lg sm:block ' + (dark ? 'text-fog/80' : 'text-slate')} style={{ animation: 'fade-up .5s cubic-bezier(.2,.8,.2,1) both' }}>
          {LOADING_LINES[line]}…
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Loading the room"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className={'mt-6 h-[3px] w-full overflow-hidden rounded-full ' + (dark ? 'bg-white/15' : 'bg-ink/10')}
      >
        <div className="h-full origin-left bg-volt transition-transform duration-500 ease-out" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <p aria-hidden="true" className={'mt-3 text-sm sm:hidden ' + (dark ? 'text-fog/70' : 'text-slate')}>
        {LOADING_LINES[line]}…
      </p>
    </div>
  )
}

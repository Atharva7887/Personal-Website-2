import { useEffect, useState } from 'react'
import { NAV } from '../data/site'

/** Compact bar that slides up once the hero has scrolled away (Jakob: nav stays where people expect it). */
export function Dock() {
  const [shown, setShown] = useState(false)
  const [time, setTime] = useState('')

  useEffect(() => {
    const hero = document.getElementById('top')
    // Subpages have no hero: the dock is always there.
    const io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting), { threshold: 0.05 })
    if (hero) io.observe(hero)
    else setShown(true)
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 30_000)
    return () => {
      io.disconnect()
      clearInterval(id)
    }
  }, [])

  return (
    <nav
      aria-label="Quick navigation"
      className={
        'fixed inset-x-0 bottom-4 z-40 mx-auto w-[min(44rem,calc(100%-1.5rem))] transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1.15)] ' +
        (shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[140%] opacity-0')
      }
    >
      <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-white/90 p-1.5 pl-5 text-ink shadow-[0_12px_40px_-12px_rgba(12,15,20,.45)] backdrop-blur-md">
        <a href="/" className="mr-auto flex min-h-[44px] min-w-[44px] items-center gap-3 text-sm" tabIndex={shown ? 0 : -1}>
          <span className="font-display font-semibold">AS<span className="text-volt">.</span></span>
          <span className="hidden text-slate sm:inline">
            Pune {time && <time className="tabular-nums">{time}</time>}
          </span>
        </a>
        {NAV.map((n) => (
          <a
            key={n.href}
            href={n.href}
            tabIndex={shown ? 0 : -1}
            className="hidden min-h-[44px] items-center rounded-full px-3 text-sm text-ink transition-[color,transform] hover:text-volt active:scale-[0.94] sm:flex"
          >
            {n.label}
          </a>
        ))}
        <a
          href="#contact"
          tabIndex={shown ? 0 : -1}
          className="btn min-h-[44px] bg-volt px-5 text-sm text-white hover:bg-ink"
        >
          Let’s talk
        </a>
      </div>
    </nav>
  )
}

import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { EMAIL, GITHUB_URL, LINKEDIN_URL, LOCATION, NAME, RESUME_URL } from '../data/site'
import { CopyEmail } from './CopyEmail'
import { useMagnet, useReducedMotion, useReveals } from './motion'

// The WebGL gradient is its own chunk, fetched only when the footer is near the viewport.
const FooterGradient = lazy(() => import('./FooterGradient'))

type FooterLink = { label: string; href: string; download?: boolean }

const GROUPS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Work', href: '/#work' },
      { label: 'Services', href: '/#services' },
      { label: 'About', href: '/#about' },
    ],
  },
  {
    title: 'Elsewhere',
    links: [
      { label: 'GitHub', href: GITHUB_URL },
      { label: 'LinkedIn', href: LINKEDIN_URL },
      ...(RESUME_URL ? [{ label: 'Résumé (PDF)', href: RESUME_URL, download: true }] : []),
    ],
  },
  {
    title: 'Off the clock',
    links: [
      { label: 'Studio', href: '/studio/' },
      { label: 'Play', href: '/play/' },
      { label: 'Sitemap', href: '/sitemap/' },
    ],
  },
]

const stagger = (i: number) => ({ ['--i' as string]: i })

/**
 * Mounts the shader only while the footer is within about one screen of the viewport, and unmounts it a
 * moment after it leaves so a scrolled-away page isn't rendering WebGL for nothing. The CSS gradient
 * underneath is always there: it is the server render, the loading state and the reduced-motion look.
 */
function Backdrop() {
  const host = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [live, setLive] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el || reduced || !('IntersectionObserver' in window)) return
    let off = 0
    const io = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(off)
        if (e.isIntersecting) setLive(true)
        else off = window.setTimeout(() => setLive(false), 1500)
      },
      { rootMargin: '600px 0px 0px 0px' },
    )
    io.observe(el)
    return () => {
      window.clearTimeout(off)
      io.disconnect()
    }
  }, [reduced])

  return (
    <div ref={host} aria-hidden="true" className="footer-ground absolute inset-0 -z-10">
      {live && !reduced && (
        <div className="footer-gl absolute inset-0">
          <Suspense fallback={null}>
            <FooterGradient />
          </Suspense>
        </div>
      )}
      {/* Keeps white text above 4.5:1 wherever the shader brightens. */}
      <div className="footer-scrim absolute inset-0" />
    </div>
  )
}

const WORD = 'Atharva.'.split('')

export function Footer() {
  const ref = useReveals<HTMLElement>()
  const mail = useMagnet<HTMLSpanElement>(0.2)
  const word = useRef<HTMLSpanElement>(null)

  // The name leans toward the pointer: each letter lifts by how close the cursor is, the headline drifts a few px.
  // Everything is a CSS transition on a variable, so leaving mid-way retargets from where it is (interruptible).
  useEffect(() => {
    const host = ref.current
    if (!host || !window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const letters = () => word.current?.querySelectorAll<HTMLElement>('[data-l]') ?? []
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = host.getBoundingClientRect()
        host.style.setProperty('--px', String(((e.clientX - r.left) / r.width - 0.5) * 2))
        host.style.setProperty('--py', String(((e.clientY - r.top) / r.height - 0.5) * 2))
        letters().forEach((l) => {
          const b = l.getBoundingClientRect()
          const d = Math.abs(e.clientX - (b.left + b.width / 2)) / Math.max(b.width * 2.2, 1)
          // Letters answer fully only when the pointer is near the name's own height.
          const near = Math.max(0, 1 - d) * (Math.abs(e.clientY - (b.top + b.height / 2)) < b.height ? 1 : 0.35)
          l.style.setProperty('--d', near.toFixed(3))
        })
      })
    }
    const leave = () => {
      cancelAnimationFrame(raf)
      host.style.setProperty('--px', '0')
      host.style.setProperty('--py', '0')
      letters().forEach((l) => l.style.setProperty('--d', '0'))
    }
    host.addEventListener('pointermove', move)
    host.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerleave', leave)
    }
  }, [ref])

  return (
    <footer id="contact" ref={ref} className="dark footer relative isolate overflow-hidden bg-ink text-white">
      <Backdrop />

      <div className="page pb-10 pt-20 sm:pt-28">
        <p className="reveal text-lg text-white/90">Have a project in mind?</p>
        <h2
          className="reveal footer-lean mt-4 text-[clamp(3rem,9.5vw,9.5rem)] font-semibold leading-[0.88] tracking-[-0.045em]"
          style={stagger(1)}
        >
          Let’s build
          <br />
          something.
        </h2>

        {/* Fitts: the email is the biggest target on the page. Von Restorff: it is also the only white thing. */}
        <div className="reveal mt-12 flex flex-wrap items-center gap-3" style={stagger(3)}>
          <span ref={mail} className="inline-block max-w-full">
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex min-h-[64px] max-w-full items-center rounded-full bg-white px-6 font-display text-[clamp(1rem,2.8vw,2rem)] font-medium text-ink transition-[background-color,color,transform] duration-200 hover:bg-volt hover:text-white active:scale-[0.96] sm:px-8"
            >
              <span className="break-all">{EMAIL}</span>
            </a>
          </span>
          <CopyEmail className="btn border border-white/60 text-white hover:bg-white hover:text-ink" />
        </div>

        {/* Hick: three short groups of three. */}
        <div className="mt-16 grid gap-x-10 gap-y-10 border-t border-white/25 pt-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="reveal" style={stagger(0)}>
            <p className="font-display text-2xl font-semibold tracking-[-0.02em]">{NAME}</p>
            <p className="mt-2 max-w-[18rem] text-white/90">Software engineer and data scientist. {LOCATION}.</p>
          </div>
          {GROUPS.map((g, i) => (
            <nav key={g.title} aria-label={g.title} className="reveal" style={stagger(i + 1)}>
              <p className="text-sm uppercase tracking-[0.14em] text-white/80">{g.title}</p>
              <ul className="mt-2">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.download ? { download: true, 'data-goatcounter-click': 'resume-download' } : {})}
                      className="footer-link inline-flex min-h-[44px] min-w-[44px] items-center text-lg"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="reveal mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-4" style={stagger(2)}>
          <p className="max-w-md text-lg text-white">
            You made it to the end. Most visitors don’t. You’re an outlier, p&nbsp;&lt;&nbsp;0.05.
          </p>
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
            }}
            className="glass-pill"
          >
            Back to top
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
            </svg>
          </a>
        </div>
      </div>

      {/* The name is the last big thing the page says, set across the full width. Decorative: the h2 and links carry the meaning. */}
      <div className="page select-none">
        <span
          ref={word}
          aria-hidden="true"
          className="footer-word block whitespace-nowrap font-display text-[clamp(4.5rem,23.5vw,24rem)] font-bold leading-[0.8] tracking-[-0.06em]"
        >
          {WORD.map((ch, i) => (
            <span key={i} className="reveal footer-letter inline-block" style={stagger(i + 2)}>
              <span data-l className="footer-letter-in inline-block">
                {ch}
              </span>
            </span>
          ))}
        </span>
      </div>

      <div className="page">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/25 py-4 text-sm text-white/90">
          <p>© 2026 {NAME}</p>
          <p>Made in {LOCATION.split(',')[0]}.</p>
        </div>
      </div>
    </footer>
  )
}

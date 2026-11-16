import { useEffect } from 'react'
import { Hero } from './components/Hero'
import { Dock } from './components/Dock'
import { Marquee } from './components/Marquee'
import { Work } from './components/Work'
import { OffTheClock } from './components/OffTheClock'
import { About, Contact, Services } from './components/Sections'
import { CaseStudy } from './pages/CaseStudy'
import { Play } from './pages/Play'
import { Studio } from './pages/Studio'
import { SitemapPage } from './pages/SitemapPage'
import { NotFound } from './pages/NotFound'
import { projects } from './data/projects'
import { normalise } from './routes'

function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-fog"
    >
      Skip to content
    </a>
  )
}

function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover)').matches) return
    let lenis: { raf: (t: number) => void; destroy: () => void } | undefined
    let raf = 0
    import('lenis').then(({ default: Lenis }) => {
      const l = new Lenis({ lerp: 0.1, anchors: { offset: 0 } })
      lenis = l
      const loop = (t: number) => {
        l.raf(t)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    })
    return () => {
      cancelAnimationFrame(raf)
      lenis?.destroy()
    }
  }, [])
}

export default function App({ path }: { path: string }) {
  useSmoothScroll()
  const route = normalise(path)

  if (route === '/sitemap/') {
    return (
      <>
        <SkipLink />
        <SitemapPage />
      </>
    )
  }

  if (route === '/studio/') {
    return (
      <>
        <SkipLink />
        <Studio />
      </>
    )
  }

  if (route === '/play/') {
    return (
      <>
        <SkipLink />
        <Play />
      </>
    )
  }

  const match = route.match(/^\/work\/([^/]+)\/$/)
  const project = match && projects.find((p) => p.slug === match[1] && p.sections)
  if (project) {
    return (
      <>
        <SkipLink />
        <Dock />
        <CaseStudy project={project} />
      </>
    )
  }

  // Anything else that isn't the home page is a 404 (Netlify serves dist/404.html for it).
  if (route !== '/') {
    return (
      <>
        <SkipLink />
        <NotFound />
      </>
    )
  }

  return (
    <>
      <div className="intro" aria-hidden="true">
        <span className="intro-count" />
      </div>
      <SkipLink />
      <Dock />
      <main id="main">
        <Hero />
        <Marquee />
        <Work />
        <Services />
        <About />
        <OffTheClock />
        <Contact />
      </main>
    </>
  )
}

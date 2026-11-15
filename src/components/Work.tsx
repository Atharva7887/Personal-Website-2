import { useState } from 'react'
import { hasPage, projects, projectUrl, type Project } from '../data/projects'
import { ParticleCanvas } from './ParticleCanvas'
import { useReveals } from './motion'

const DARK = { base: '#e4e7ec', accent: '#8c99ff' }

function Row({ p, i, onActive, active }: { p: Project; i: number; onActive: (i: number) => void; active: boolean }) {
  const page = hasPage(p)
  const href = projectUrl(p)
  const external = !page && href.startsWith('http')
  return (
    <li
      className="reveal border-b border-white/15"
      style={{ ['--i' as string]: i % 3 }}
      onPointerEnter={() => onActive(i)}
      onFocus={() => onActive(i)}
    >
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        className="group grid gap-x-6 gap-y-2 py-7 outline-offset-[-2px] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline lg:py-8"
      >
        <div>
          <p className="text-sm text-mist">
            {p.kind}, {p.year}
            {p.status && <span className="ml-2 rounded-full border border-voltsoft/50 px-2 py-0.5 text-voltsoft">{p.status}</span>}
          </p>
          <h3
            className={
              'mt-1 text-4xl font-semibold leading-none tracking-[-0.03em] transition-[transform,color] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] sm:text-5xl xl:text-6xl ' +
              (active ? 'translate-x-3 text-white' : 'text-fog/80')
            }
          >
            {p.name}
          </h3>
          <p className="mt-3 max-w-xl text-fog/80">{p.tagline}</p>
        </div>
        <span className="text-sm text-mist transition-colors group-hover:text-voltsoft">
          {page ? 'Case study' : external ? 'Code' : ''}
          <span aria-hidden="true" className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-1">
            ›
          </span>
        </span>
      </a>
      {/* Touch screens: show the picture inline; no hover required. */}
      {p.image && (
        <img
          src={p.image.src}
          alt={p.image.alt}
          width={p.image.width}
          height={p.image.height}
          loading="lazy"
          decoding="async"
          className="mb-8 w-full rounded-xl lg:hidden"
        />
      )}
    </li>
  )
}

export function Work() {
  const ref = useReveals<HTMLElement>()
  const [active, setActive] = useState(0)
  const p = projects[active]

  return (
    <section id="work" ref={ref} className="dark bg-ink py-24 text-fog sm:py-32">
      <div className="page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="text-[clamp(3rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.04em]">Selected work</h2>
          <p className="max-w-sm text-mist">
            Apps, production ML at IndiskaAI, websites, and the projects that got me here. Hover a project to see its
            shape.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <ul className="border-t border-white/15">
            {projects.map((proj, i) => (
              <Row key={proj.slug} p={proj} i={i} active={i === active} onActive={setActive} />
            ))}
          </ul>

          {/* Signature: the particles take the shape of the project in focus. */}
          <aside aria-hidden="true" className="hidden lg:block">
            <div className="sticky top-16">
              <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                <ParticleCanvas
                  shapes={projects.map((x) => x.shape)}
                  shape={p.shape}
                  colors={DARK}
                  density={0.8}
                  layout={() => ({ x: 0, y: 0, z: 10 })}
                  className="absolute inset-0 h-full w-full"
                />
                <p className="absolute bottom-5 left-6 right-6 text-sm text-mist">
                  <span className="block text-fog">{p.name}</span>
                  {p.stack}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

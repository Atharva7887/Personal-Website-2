import { EMAIL, LOCATION, NAV, RESUME_URL } from '../data/site'
import { useMagnet } from './motion'
import { ParticleCanvas } from './ParticleCanvas'

function Words({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i} className="hero-word">
          <span style={{ ['--i' as string]: start + i }}>{w}</span>
          {' '}
        </span>
      ))}
    </>
  )
}

export function Hero() {
  const cta = useMagnet<HTMLSpanElement>(0.35)

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <ParticleCanvas
        shapes={['sphere', 'lattice', 'knot', 'helix']}
        autoplay
        colors={{ base: '#0c0f14', accent: '#2f45ff' }}
        layout={(aspect) =>
          aspect < 1.1 ? { x: 0, y: 3.6, z: 15 } : { x: Math.min(3.2, 1.2 * aspect), y: 0.3, z: 9 }
        }
        className="absolute inset-0 h-full w-full"
      />

      <header className="page relative z-10 flex items-center justify-between pt-5">
        <a href="#top" className="font-display text-lg font-semibold tracking-tight">
          AS<span className="text-volt">.</span>
        </a>
        <nav aria-label="Sections">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="flex min-h-[44px] items-center rounded-full px-3 text-[0.9375rem] transition-colors hover:text-volt"
                >
                  {n.label}
                </a>
              </li>
            ))}
            <li className="hidden sm:block">
              <a href="#contact" className="btn btn-ink ml-2 min-h-[44px] px-5 text-[0.9375rem]">
                Let’s talk
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <div className="page relative z-10 mt-auto pb-10 sm:pb-14">
        <p className="after-intro mb-6 flex items-center gap-2 text-slate" style={{ ['--i' as string]: 0 }}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-volt opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-volt" />
          </span>
          Available for freelance work · {LOCATION}
        </p>
        <h1 className="font-display text-[15vw] sm:text-[10vw] 2xl:text-[10rem] font-semibold leading-[0.86] tracking-[-0.045em]">
          <Words text="Atharva" />
          <br />
          <Words text="Shirke" start={1} />
        </h1>
        <div className="mt-8 grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <p className="after-intro max-w-[34rem] text-xl leading-snug sm:text-2xl" style={{ ['--i' as string]: 1 }}>
            Software engineer and data scientist. I build machine-learning pipelines, data products and the
            web apps around them.
          </p>
          <div className="after-intro flex flex-wrap gap-3" style={{ ['--i' as string]: 2 }}>
            <span ref={cta} className="inline-block">
              <a href={`mailto:${EMAIL}`} className="btn btn-ink">
                Start a project
              </a>
            </span>
            {RESUME_URL ? (
              <a href={RESUME_URL} download data-goatcounter-click="resume-download" className="btn btn-ghost">
                Résumé
              </a>
            ) : (
              <a href="#work" className="btn btn-ghost">
                See my work
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

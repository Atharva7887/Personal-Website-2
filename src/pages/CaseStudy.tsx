import { hasPage, projects, type Project } from '../data/projects'
import { Contact } from '../components/Sections'
import { ParticleCanvas } from '../components/ParticleCanvas'
import { SubpageHeader } from '../components/SubpageHeader'

const LIGHT = { base: '#0c0f14', accent: '#2f45ff' }

export function CaseStudy({ project: p }: { project: Project }) {
  const withPages = projects.filter(hasPage)
  const next = withPages[(withPages.indexOf(p) + 1) % withPages.length]

  return (
    <>
      <SubpageHeader />
      <main id="main">
        <article>
          <header className="page grid gap-10 pb-14 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
            <div>
              <p className="text-slate">
                <a href="/#work" className="link inline-flex min-h-[44px] min-w-[44px] items-center">
                  Work
                </a>{' '}
                / {p.kind}, {p.year}
              </p>
              <h1 className="mt-5 text-[clamp(3.2rem,9vw,8.5rem)] font-semibold leading-[0.88] tracking-[-0.045em]">{p.name}</h1>
              <p className="mt-6 max-w-[34rem] text-xl leading-snug sm:text-2xl">{p.tagline}</p>
            </div>
            <div aria-hidden="true" className="relative hidden aspect-[4/3] lg:block">
              <ParticleCanvas
                shapes={[p.shape]}
                shape={p.shape}
                colors={LIGHT}
                density={0.7}
                layout={() => ({ x: 0, y: 0, z: 10 })}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </header>

          <section className="page" aria-label="Project facts">
            <dl className="grid gap-px overflow-hidden rounded-3xl bg-ink/15 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Role', p.role],
                ['Built with', p.stack],
                ['Year', p.year],
                ['Status', p.status ?? (p.links.length ? 'Live' : 'Internal')],
              ].map(([k, v]) => (
                <div key={k} className="bg-fog p-6">
                  <dt className="text-sm text-slate">{k}</dt>
                  <dd className="mt-1 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {p.links.length > 0 && (
              <p className="mt-6 flex flex-wrap gap-3">
                {p.links.map((l, i) => (
                  <a key={l.href} href={l.href} className={'btn ' + (i === 0 ? 'btn-ink' : 'btn-ghost')}>
                    {l.label}
                  </a>
                ))}
              </p>
            )}
          </section>

          {p.image && (
            <figure className="page mt-16">
              <img
                src={p.image.src}
                alt={p.image.alt}
                width={p.image.width}
                height={p.image.height}
                className="w-full rounded-3xl border border-ink/10"
              />
            </figure>
          )}

          <div className="page mt-20 grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <p className="text-xl leading-relaxed sm:text-2xl">{p.summary}</p>
            <div className="space-y-12">
              {p.sections?.map((s) => (
                <section key={s.title}>
                  <h2 className="text-sm font-medium text-slate">{s.title}</h2>
                  <ul className="mt-4 border-t border-ink/15">
                    {s.points.map((pt) => (
                      <li key={pt} className="border-b border-ink/15 py-4 text-lg leading-relaxed">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          {p.gallery && (
            <figure className="mt-20 overflow-x-auto px-5 sm:px-8 lg:px-12">
              <img
                src={p.gallery.src}
                alt={p.gallery.alt}
                width={p.gallery.width}
                height={p.gallery.height}
                loading="lazy"
                className="mx-auto h-auto min-w-[900px] max-w-[1600px] rounded-3xl"
              />
            </figure>
          )}

          <nav aria-label="Next project" className="page mt-24 border-t border-ink/15 py-12">
            <a href={`/work/${next.slug}/`} className="group block">
              <span className="text-slate">Next project</span>
              <span className="mt-2 block text-[clamp(2.4rem,7vw,6rem)] font-semibold leading-none tracking-[-0.04em] transition-colors group-hover:text-volt">
                {next.name}
                <span aria-hidden="true" className="ml-3 inline-block transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1.4)] group-hover:translate-x-3 group-active:translate-x-5">
                  ›
                </span>
              </span>
            </a>
          </nav>
        </article>
        <Contact />
      </main>
    </>
  )
}

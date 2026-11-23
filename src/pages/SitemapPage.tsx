import { SubpageHeader } from '../components/SubpageHeader'
import { hasPage, projects } from '../data/projects'

const GROUPS = [
  {
    title: 'Main',
    links: [
      ['Home', '/'],
      ['Selected work', '/#work'],
      ['Services', '/#services'],
      ['About, experience and education', '/#about'],
      ['Contact', '/#contact'],
    ],
  },
  { title: 'Case studies', links: projects.filter(hasPage).map((p) => [p.name, `/work/${p.slug}/`]) },
  {
    title: 'For fun',
    links: [
      ['Studio: my 3D room', '/studio/'],
      ['Play: Find the minimum', '/play/'],
    ],
  },
]

export function SitemapPage() {
  return (
    <>
      <SubpageHeader />
      <main id="main" className="page pb-24 pt-14">
        <h1 className="text-[clamp(3rem,9vw,7rem)] font-semibold leading-[0.9] tracking-[-0.045em]">Sitemap</h1>
        <p className="mt-4 max-w-xl text-lg text-slate">Every page on this site.</p>
        <div className="mt-14 grid gap-12 md:grid-cols-3">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h2 className="text-sm font-medium text-slate">{g.title}</h2>
              <ul className="mt-4 border-t border-ink/15">
                {g.links.map(([label, href]) => (
                  <li key={href} className="border-b border-ink/15">
                    <a href={href} className="link flex min-h-[48px] items-center text-lg">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-14 text-sm text-slate">
          For search engines:{' '}
          <a href="/sitemap.xml" className="link inline-flex min-h-[44px] items-center">
            sitemap.xml
          </a>
        </p>
      </main>
    </>
  )
}

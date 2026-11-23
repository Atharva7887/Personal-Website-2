import studioCover from '../assets/studio-cover.webp'
import playCover from '../assets/play-cover.webp'

const CARDS = [
  {
    href: '/studio/',
    title: 'Step into my room',
    body: 'A 3D room where every object is something I’ve made. Take the tour or click around.',
    cta: 'Open the studio',
    lead: true,
    img: studioCover,
    alt: 'A low-poly 3D room at night: a lamp-lit bookshelf, a desk with a glowing monitor, an antibody poster and an arcade cabinet',
  },
  {
    href: '/play/',
    title: 'Find the minimum',
    body: 'A small 3D game about how machine learning learns. Roll down a loss landscape and collect my projects.',
    cta: 'Play the game',
    lead: false,
    img: playCover,
    alt: 'A striped ball rolling across a purple low-poly landscape of hills and dark trees, next to a glowing orb',
  },
]

export function OffTheClock() {
  return (
    <section aria-labelledby="off-title" className="border-t border-ink/15 py-24 sm:py-32">
      <div className="page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="off-title" className="text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
            Off the clock
          </h2>
          <p className="max-w-sm text-slate">Two things I built for fun, with the same tools I use at work.</p>
        </div>
        {/* The studio is the best thing on the site, so it takes the wider card and the accent button; the game is the side door. */}
        <ul className="mt-12 grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {CARDS.map((c) => (
            <li key={c.href}>
              {/* Door threshold: hovering leans the picture in and lifts the card; pressing squeezes it and pushes the picture in further, a beat before the page changes. */}
              <a
                href={c.href}
                className="group flex h-full flex-col overflow-hidden rounded-3xl bg-ink text-fog transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.985]"
              >
                <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[17rem] md:flex-1">
                  <img
                    src={c.img}
                    alt={c.alt}
                    width={1200}
                    height={750}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.04] group-active:scale-[1.09] group-active:duration-200"
                  />
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4 p-7 sm:p-8">
                  <div className="max-w-md">
                    <h3 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{c.title}</h3>
                    <p className="mt-2 text-fog/75">{c.body}</p>
                  </div>
                  <span
                    className={
                      'btn min-h-[48px] transition-[background-color,color,transform,padding] ' +
                      (c.lead ? 'bg-volt text-white group-hover:bg-voltsoft group-hover:text-ink' : 'bg-white text-ink group-hover:bg-voltsoft')
                    }
                  >
                    {c.cta}
                    <span aria-hidden="true" className="inline-block transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1.4)] group-hover:translate-x-1 group-active:translate-x-2">
                      ›
                    </span>
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { ProjectVideo } from './ProjectVideo'
import { hasPage, projects, projectUrl, type Project } from '../data/projects'
import { ShapeIcon } from './ShapeIcon'
import { useReducedMotion, useReveals } from './motion'
import './work.css'

/** How many folders sit in a row; 0 means the phone scroller (one row, the panel opens below it). */
function useColumns() {
  // 3 first so the prerendered HTML and the first client render agree; the real count is read after mount.
  const [cols, setCols] = useState(3)
  useEffect(() => {
    const steps: [string, number][] = [
      ['(min-width: 1280px)', 4],
      ['(min-width: 1024px)', 3],
      ['(min-width: 640px)', 2],
    ]
    const mqs = steps.map(([q]) => window.matchMedia(q))
    const read = () => setCols(steps.find((_, i) => mqs[i].matches)?.[1] ?? 0)
    read()
    mqs.forEach((m) => m.addEventListener('change', read))
    return () => mqs.forEach((m) => m.removeEventListener('change', read))
  }, [])
  return cols
}

/* ---------- papers ---------- */

// Faux documents for the papers: only the real screenshots are pictures, the rest are drawn sheets
// so nothing is invented. Widths vary a little by sheet so the folders do not look stamped.
const LINES = [
  [86, 62, 92, 48, 74, 58],
  [70, 90, 54, 82, 44, 66],
  [92, 50, 78, 64, 88, 40],
]

function Doc({ seed, bars }: { seed: number; bars?: boolean }) {
  const lines = LINES[seed % LINES.length]
  return (
    <div className="flex h-full flex-col gap-[7%] p-[9%]">
      <span className="h-[7%] w-2/5 rounded-full bg-volt/80" />
      {bars ? (
        <div className="flex h-[34%] items-end gap-[6%]">
          {[40, 70, 52, 92, 64].map((h, i) => (
            <span key={i} className="flex-1 rounded-t-sm bg-[#cfd4dc]" style={{ height: h + '%' }} />
          ))}
        </div>
      ) : null}
      {lines.slice(0, bars ? 3 : 6).map((w, i) => (
        <span key={i} className="h-[5%] rounded-full bg-[#d7dbe2]" style={{ width: w + '%' }} />
      ))}
    </div>
  )
}

function Papers({ p, n }: { p: Project; n: number }) {
  return (
    <div aria-hidden="true">
      <div className="paper paper-a">
        <Doc seed={n} />
      </div>
      <div className="paper paper-b">
        {p.image ? (
          <>
            <img
              src={p.image.src}
              alt=""
              width={p.image.width}
              height={p.image.height}
              loading="lazy"
              decoding="async"
              sizes="(min-width: 1280px) 180px, (min-width: 640px) 200px, 160px"
              className="h-[58%] w-full object-cover object-left-top"
            />
            <div className="flex flex-col gap-[7%] p-[9%]">
              <span className="h-[5%] w-3/4 rounded-full bg-[#d7dbe2]" />
              <span className="h-[5%] w-1/2 rounded-full bg-[#d7dbe2]" />
            </div>
          </>
        ) : (
          <Doc seed={n + 1} bars />
        )}
      </div>
      <div className="paper paper-c">
        <Doc seed={n + 2} />
      </div>
    </div>
  )
}

/* ---------- folder ---------- */

function Folder({
  p,
  n,
  expanded,
  onToggle,
  btnRef,
  panelId,
  reduced,
}: {
  p: Project
  n: number
  expanded: boolean
  onToggle: () => void
  btnRef: (el: HTMLButtonElement | null) => void
  panelId: string
  reduced: boolean
}) {
  const tilt = useRef<HTMLDivElement>(null)

  // A small lean toward the pointer. Mouse only; touch and reduced motion get none.
  const lean = (e: PointerEvent<HTMLButtonElement>) => {
    if (reduced || e.pointerType !== 'mouse' || !tilt.current) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    tilt.current.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg')
    tilt.current.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg')
  }
  const rest = () => {
    tilt.current?.style.setProperty('--ry', '0deg')
    tilt.current?.style.setProperty('--rx', '0deg')
  }

  return (
    <li className="reveal min-w-0 shrink-0 basis-[78%] snap-start sm:basis-auto" style={{ ['--i' as string]: n % 4 }}>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? panelId : undefined}
        onClick={onToggle}
        onPointerMove={lean}
        onPointerLeave={rest}
        className="folder folder-btn group block w-full rounded-3xl pt-[9%] text-left outline-offset-4"
      >
        <div ref={tilt} className="folder-tilt">
          <div className="folder-back" />
          <Papers p={p} n={n} />
          <div className="folder-front">
            <div className="absolute inset-x-[7%] bottom-[9%] flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate">
                  {p.kind.split(',')[0]}, {p.year}
                </p>
                <h3 className="mt-1 text-[clamp(1.35rem,2vw,1.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink">
                  {p.name}
                </h3>
              </div>
              {/* A real 44px square so it is an easy target; the whole folder is the button anyway. */}
              <span
                aria-hidden="true"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink text-fog transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1.3)] group-hover:translate-x-0.5 group-active:scale-90"
              >
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={expanded ? 'M5 12l5-5 5 5' : 'M5 8l5 5 5-5'} />
                </svg>
              </span>
            </div>
          </div>
        </div>
        <p className="mt-5 max-w-[30ch] text-fog/80">{p.tagline}</p>
        <span className="mt-2 inline-flex min-h-[44px] items-center text-sm text-fog underline decoration-white/30 underline-offset-4 transition-colors group-hover:decoration-voltsoft">
          {expanded ? 'Close project' : 'View project'}
          <span aria-hidden="true" className="ml-1">
            ↗
          </span>
        </span>
      </button>
      {/* Without JS the folder cannot open, so the case study is one plain link away. */}
      <noscript>
        <a href={projectUrl(p)} className="inline-flex min-h-[44px] items-center text-sm text-voltsoft underline underline-offset-4">
          {hasPage(p) ? 'Read case study' : 'Open project'}
        </a>
      </noscript>
    </li>
  )
}

/* ---------- details panel ---------- */

function Accordion({ id, title, open, onToggle, children }: { id: string; title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="border-t border-white/15">
      <h4>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="flex min-h-[52px] w-full items-center justify-between gap-4 text-left text-lg font-medium text-fog outline-offset-2 active:opacity-80"
        >
          {title}
          <span aria-hidden="true" className={'text-mist transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ' + (open ? 'rotate-180' : '')}>
            {open ? '−' : '+'}
          </span>
        </button>
      </h4>
      <div id={id} role="region" aria-label={title} className={'wp ' + (open ? 'is-open' : '')}>
        <div>
          <div className="pb-5 text-fog/85">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Panel({
  p,
  expanded,
  onClose,
  panelId,
  focusHeading,
}: {
  p: Project
  expanded: boolean
  onClose: () => void
  panelId: string
  focusHeading: boolean
}) {
  const uid = useId()
  const [on, setOn] = useState(false)
  const [inside, setInside] = useState(true)
  const [more, setMore] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const host = useRef<HTMLDivElement>(null)

  // Mount closed, then open on the next frames so the row actually grows instead of appearing.
  useEffect(() => {
    if (!expanded) return setOn(false)
    let a = 0
    let b = 0
    a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setOn(true))
    })
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
    }
  }, [expanded])

  // Focus the heading so a keyboard or screen-reader user lands in the panel, then bring it fully into view.
  useEffect(() => {
    if (!on || !focusHeading) return
    heading.current?.focus({ preventScroll: true })
    const t = window.setTimeout(() => {
      const r = host.current?.getBoundingClientRect()
      if (!r) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const over = r.bottom - (window.innerHeight - 24)
      const dy = Math.min(over, r.top - 88)
      if (dy > 0) window.scrollBy({ top: dy, behavior: reduced ? 'auto' : 'smooth' })
    }, 520)
    return () => window.clearTimeout(t)
  }, [on, focusHeading, p.slug])

  useEffect(() => {
    setInside(true)
    setMore(false)
  }, [p.slug])

  const external = p.links
  const caseStudy = hasPage(p)

  return (
    <div id={panelId} ref={host} role="region" aria-labelledby={uid + '-h'} className={'wp ' + (on ? 'is-open' : '')}>
      <div>
        <div key={p.slug} className="wp-swap mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm uppercase tracking-[0.1em] text-mist">Project details</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close project details"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-xl leading-none text-fog transition-[transform,background-color] duration-200 hover:bg-white/10 active:scale-90"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
            {/* Soft frame, like a mount: the screenshot where there is one, the project's own shape where there is not. */}
            <div className="self-start rounded-2xl bg-[#d3d7de] p-3 sm:p-4">
              {p.video ? (
                <ProjectVideo p={p} className="rounded-xl" />
              ) : p.image ? (
                <img
                  src={p.image.src}
                  alt={p.image.alt}
                  width={p.image.width}
                  height={p.image.height}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 700px, 90vw"
                  className="w-full rounded-xl"
                />
              ) : (
                <div className="grid aspect-[16/10] place-items-center rounded-xl bg-fog">
                  <ShapeIcon name={p.shape} active size={360} />
                </div>
              )}
            </div>

            <div>
              <h3
                id={uid + '-h'}
                ref={heading}
                tabIndex={-1}
                className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[0.98] tracking-[-0.03em] "
                style={{ outline: 'none' }}
              >
                {p.name}
              </h3>
              <p className="mt-3 text-mist">
                {p.kind}, {p.year}
                {p.status && <span className="ml-2 rounded-full border border-voltsoft/50 px-2 py-0.5 text-voltsoft">{p.status}</span>}
              </p>
              <p className="mt-4 text-lg text-fog/90">{p.tagline}</p>

              <div className="mt-6">
                <Accordion id={uid + '-in'} title={'Inside ' + p.name} open={inside} onToggle={() => setInside((v) => !v)}>
                  <p>{p.summary}</p>
                  <p className="mt-4 text-sm text-mist">
                    <span className="text-fog/90">Role:</span> {p.role}
                  </p>
                  <p className="mt-2 text-sm text-mist">
                    <span className="text-fog/90">Stack:</span> {p.stack.split(/,\s*/).join(' / ')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5">
                    {caseStudy && (
                      <a
                        href={'/work/' + p.slug + '/'}
                        className="inline-flex min-h-[44px] items-center text-voltsoft underline underline-offset-4 hover:text-white"
                      >
                        Read case study →
                      </a>
                    )}
                    {external.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[44px] items-center text-fog underline decoration-white/30 underline-offset-4 hover:text-voltsoft"
                      >
                        {l.label} ↗
                      </a>
                    ))}
                  </div>
                </Accordion>
                {p.sections && (
                  <Accordion id={uid + '-more'} title="Highlights" open={more} onToggle={() => setMore((v) => !v)}>
                    <div className="space-y-5">
                      {p.sections.map((s) => (
                        <div key={s.title}>
                          <p className="text-sm font-medium text-fog">{s.title}</p>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-fog/80 marker:text-mist">
                            {s.points.map((pt) => (
                              <li key={pt}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </Accordion>
                )}
                <div className="border-t border-white/15" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- section ---------- */

export function Work() {
  const ref = useReveals<HTMLElement>()
  const reduced = useReducedMotion()
  const cols = useColumns()
  const panelId = useId() + '-panel'
  const [openSlug, setOpenSlug] = useState<string | null>(null) // content shown (kept while closing)
  const [expanded, setExpanded] = useState(false)
  const [byKeyboard, setByKeyboard] = useState(true)
  const btns = useRef<Record<string, HTMLButtonElement | null>>({})
  const closeTimer = useRef(0)

  const close = useCallback(() => {
    setExpanded(false)
    const slug = openSlug
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpenSlug(null), 520)
    // Hand focus back to the folder that opened it.
    if (slug) btns.current[slug]?.focus({ preventScroll: true })
  }, [openSlug])

  const toggle = (slug: string) => {
    if (expanded && openSlug === slug) return close()
    window.clearTimeout(closeTimer.current)
    setOpenSlug(slug)
    setExpanded(true)
    setByKeyboard(true)
  }

  useEffect(() => {
    if (!expanded) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [expanded, close])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  const openIndex = projects.findIndex((x) => x.slug === openSlug)
  const open = openIndex >= 0 ? projects[openIndex] : null
  // The panel goes in after the last folder of the clicked row; on the phone scroller it goes after the whole strip.
  const afterIndex = open && cols > 0 ? Math.min(projects.length - 1, (Math.floor(openIndex / cols) + 1) * cols - 1) : -1
  const rowKey = cols > 0 ? Math.floor(openIndex / cols) : 0

  const panel = open ? (
    <Panel key={'row-' + rowKey} p={open} expanded={expanded} onClose={close} panelId={panelId} focusHeading={byKeyboard} />
  ) : null

  return (
    <section id="work" ref={ref} className="dark bg-ink py-24 text-fog sm:py-32">
      <div className="page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="text-[clamp(3rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.04em]">Selected work</h2>
          <p className="max-w-sm text-mist">
            Apps, production ML at IndiskaAI, websites, and the projects that got me here. Open a folder to see what is
            inside.
          </p>
        </div>

        <ul
          className="folder-scroller -mx-5 mt-16 flex scroll-px-5 snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-4"
        >
          {projects.flatMap((proj, i) => {
            const items = [
              <Folder
                key={proj.slug}
                p={proj}
                n={i}
                expanded={expanded && openSlug === proj.slug}
                onToggle={() => toggle(proj.slug)}
                btnRef={(el) => {
                  btns.current[proj.slug] = el
                }}
                panelId={panelId}
                reduced={reduced}
              />,
            ]
            if (panel && i === afterIndex) {
              items.push(
                <li key="panel" className="col-span-full min-w-0">
                  {panel}
                </li>,
              )
            }
            return items
          })}
        </ul>
        {cols === 0 && panel}
      </div>
    </section>
  )
}

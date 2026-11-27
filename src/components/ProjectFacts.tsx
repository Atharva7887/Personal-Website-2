import type { Project } from '../data/projects'

/** Headline numbers in a row. `tone` follows the surface: light case pages, the dark Work panel. */
export function ProjectMetrics({ p, tone = 'light' }: { p: Project; tone?: 'light' | 'dark' }) {
  if (!p.metrics?.length) return null
  const line = tone === 'dark' ? 'border-white/15' : 'border-ink/15'
  const sub = tone === 'dark' ? 'text-mist' : 'text-slate'
  return (
    <dl className={`grid grid-cols-2 gap-x-6 gap-y-5 border-y py-6 sm:grid-cols-4 ${line}`}>
      {p.metrics.map((m) => (
        <div key={m.label} className="flex flex-col">
          <dt className={`order-2 mt-1 text-sm ${sub}`}>{m.label}</dt>
          <dd className="order-1 font-display text-3xl font-semibold tabular-nums tracking-[-0.03em] sm:text-4xl">{m.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** The architecture as a pipeline: stages joined by arrows, wrapping on narrow screens. */
export function ProjectPipeline({ p, tone = 'light' }: { p: Project; tone?: 'light' | 'dark' }) {
  if (!p.pipeline?.length) return null
  const box = tone === 'dark' ? 'border-white/15 bg-white/[0.04]' : 'border-ink/10 bg-white/70'
  const chip = tone === 'dark' ? 'border-white/20 bg-white/[0.06] text-fog' : 'border-ink/15 bg-white text-ink'
  const sub = tone === 'dark' ? 'text-mist' : 'text-slate'
  return (
    <figure className={`rounded-2xl border p-5 sm:p-6 ${box}`}>
      <figcaption className={`font-mono text-xs uppercase tracking-[0.18em] ${sub}`}>Architecture pipeline</figcaption>
      <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3">
        {p.pipeline.map((s, i) => (
          <li key={s.stage} className="flex items-center gap-2">
            <span title={s.detail} className={`rounded-lg border px-3 py-2 text-[0.9375rem] ${chip}`}>
              {s.stage}
            </span>
            {i < p.pipeline!.length - 1 && (
              <span aria-hidden="true" className={sub}>
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      <ul className={`mt-5 grid gap-1.5 text-sm sm:grid-cols-2 ${sub}`}>
        {p.pipeline
          .filter((s) => s.detail)
          .map((s) => (
            <li key={s.stage}>
              <span className={tone === 'dark' ? 'text-fog/90' : 'text-ink'}>{s.stage}:</span> {s.detail}
            </li>
          ))}
      </ul>
    </figure>
  )
}

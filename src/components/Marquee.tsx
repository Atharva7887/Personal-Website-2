import { SKILLS } from '../data/site'

export function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {SKILLS.map((s) => (
        <li key={s} className="flex items-center whitespace-nowrap px-6 font-display text-3xl font-medium sm:text-5xl">
          {s}
          <span aria-hidden="true" className="ml-12 inline-block h-2.5 w-2.5 rotate-45 bg-volt" />
        </li>
      ))}
    </ul>
  )
  return (
    <section aria-label="Skills" className="marquee overflow-hidden border-y border-ink/15 py-6 sm:py-8">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </section>
  )
}

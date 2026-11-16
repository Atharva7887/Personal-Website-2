import { SKILLS } from '../data/site'

export function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {SKILLS.map((s) => (
        <li key={s} className="flex items-center whitespace-nowrap px-4 font-display text-xl font-medium sm:px-5 sm:text-2xl">
          {s}
          <span aria-hidden="true" className="ml-8 inline-block h-1.5 w-1.5 rotate-45 bg-volt sm:ml-10" />
        </li>
      ))}
    </ul>
  )
  return (
    <section aria-label="Skills" className="marquee overflow-hidden border-y border-ink/15 py-4 sm:py-5">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </section>
  )
}

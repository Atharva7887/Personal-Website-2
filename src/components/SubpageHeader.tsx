import { NAV } from '../data/site'

export function SubpageHeader() {
  return (
    <header className="page flex items-center justify-between pt-5">
      <a href="/" className="flex min-h-[44px] min-w-[44px] items-center font-display text-lg font-semibold tracking-tight">
        AS<span className="text-volt">.</span>
      </a>
      <nav aria-label="Sections">
        <ul className="flex items-center gap-1 sm:gap-2">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="flex min-h-[44px] items-center rounded-full px-3 text-[0.9375rem] transition-[color,transform] hover:text-volt active:scale-[0.94]">
                {n.label}
              </a>
            </li>
          ))}
          <li className="hidden sm:block">
            <a href="/#contact" className="btn btn-ink ml-2 min-h-[44px] px-5 text-[0.9375rem]">
              Let’s talk
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}

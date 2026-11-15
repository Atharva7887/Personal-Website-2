import portrait from '../assets/portrait.webp'
import { useState } from 'react'
import { certifications, education, experience, research, services, skillGroups } from '../data/profile'
import { EMAIL, GITHUB_URL, LINKEDIN_URL, NAME, RESUME_URL } from '../data/site'
import { CopyEmail } from './CopyEmail'
import { useMagnet, useReveals } from './motion'
import { ShapeIcon } from './ShapeIcon'

export function Services() {
  const ref = useReveals<HTMLElement>()
  const [hover, setHover] = useState<number | null>(null)
  return (
    <section id="services" ref={ref} className="py-24 sm:py-32">
      <div className="page">
        <h2 className="max-w-[16ch] text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.035em]">
          What I can build for you
        </h2>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-ink/15 md:grid-cols-3">
          {services.map((s, i) => (
            <li
              key={s.title}
              className="relative bg-fog p-8 transition-colors duration-300 hover:bg-white sm:p-10"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <div className="mb-8 -ml-2">
                <ShapeIcon name={s.shape} active={hover === i} size={88} />
              </div>
              <h3 className="text-3xl font-semibold tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-4 text-slate">{s.body}</p>
              <p className="mt-6 text-sm font-medium">{s.tags.join(' / ')}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function About() {
  const ref = useReveals<HTMLElement>()
  return (
    <section id="about" ref={ref} className="border-t border-ink/15 py-24 sm:py-32">
      <div className="page grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="self-start lg:sticky lg:top-12">
          <img
            src={portrait}
            alt="Portrait of Atharva Shirke in a blue blazer"
            width={720}
            height={720}
            loading="lazy"
            className="aspect-square w-full max-w-md rounded-full object-cover grayscale transition duration-700 hover:grayscale-0"
          />
        </div>
        <div>
          <h2 className="text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.035em]">About</h2>
          <p className="mt-8 max-w-[38rem] text-xl leading-relaxed sm:text-2xl" style={{ ['--i' as string]: 1 }}>
            I’m a computer engineer who likes the whole path from raw data to something people use. Today that
            means machine-learning pipelines for drug discovery at IndiskaAI; before that, identity systems and
            full-stack product work. I care about software that survives contact with real, messy data.
          </p>

          <h3 className="mt-16 text-sm font-medium text-slate">Experience</h3>
          <ol className="mt-4 border-t border-ink/15">
            {experience.map((job, i) => (
              <li
                key={job.company}
                className="grid gap-x-8 gap-y-1 border-b border-ink/15 py-6 sm:grid-cols-[8rem_minmax(0,1fr)]"
                style={{ ['--i' as string]: i }}
              >
                <p className="text-sm tabular-nums text-slate sm:pt-1">{job.dates}</p>
                <div>
                  <p className="text-xl font-semibold tracking-[-0.01em]">
                    {job.role}, {job.company}
                  </p>
                  <p className="mt-1 max-w-[60ch] text-slate">{job.summary}</p>
                </div>
              </li>
            ))}
          </ol>

          <h3 className="mt-12 text-sm font-medium text-slate">Research</h3>
          <ul className="mt-4 border-t border-ink/15">
            {research.map((r) => (
              <li key={r.title} className="border-b border-ink/15 py-5">
                <p className="max-w-[60ch] font-medium">{r.title}</p>
                <p className="mt-1 text-sm text-slate">
                  {r.role}. {r.status}
                </p>
              </li>
            ))}
          </ul>

          <h3 className="mt-12 text-sm font-medium text-slate">Education</h3>
          <ul className="mt-4 border-t border-ink/15">
            {education.map((e) => (
              <li key={e.title} className="grid gap-x-8 border-b border-ink/15 py-5 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <p className="text-sm tabular-nums text-slate sm:pt-0.5">{e.dates}</p>
                <p>
                  <span className="font-medium">{e.title}</span>
                  <span className="text-slate">, {e.place}</span>
                </p>
              </li>
            ))}
          </ul>

          <h3 className="mt-12 text-sm font-medium text-slate">Skills</h3>
          <dl className="mt-4 grid gap-x-8 gap-y-5 border-t border-ink/15 pt-5 sm:grid-cols-2">
            {skillGroups.map((g) => (
              <div key={g.group}>
                <dt className="font-medium">{g.group}</dt>
                <dd className="mt-1 text-slate">{g.items.join(', ')}</dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-12 text-sm font-medium text-slate">Certifications</h3>
          <ul className="mt-4 border-t border-ink/15">
            {certifications.map((c) => (
              <li key={c} className="border-b border-ink/15 py-3 text-slate">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function Contact() {
  const ref = useReveals<HTMLElement>()
  const mail = useMagnet<HTMLSpanElement>(0.2)
  return (
    <section id="contact" ref={ref} className="dark bg-volt text-white">
      <div className="page py-24 sm:py-36">
        <p className="text-lg text-white">Have a project in mind?</p>
        <h2 className="reveal mt-4 text-[clamp(3.2rem,11vw,11rem)] font-semibold leading-[0.85] tracking-[-0.045em]">
          Let’s work together.
        </h2>
        <span ref={mail} className="mt-12 inline-block">
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex min-h-[64px] items-center gap-4 rounded-full bg-white px-8 font-display text-[clamp(1.1rem,3vw,2rem)] font-medium text-ink transition-[background-color,color,transform] duration-200 hover:bg-ink hover:text-white active:scale-[0.96]"
          >
            {EMAIL}
          </a>
        </span>
        <CopyEmail className="btn ml-0 mt-4 border border-white/50 text-white hover:bg-white hover:text-ink sm:ml-3" />
        <ul className="mt-10 flex flex-wrap gap-x-8 text-lg">
          <li>
            <a className="link inline-flex min-h-[44px] items-center" href={LINKEDIN_URL}>LinkedIn</a>
          </li>
          <li>
            <a className="link inline-flex min-h-[44px] items-center" href={GITHUB_URL}>GitHub</a>
          </li>
          {RESUME_URL && (
            <li>
              <a className="link inline-flex min-h-[44px] items-center" href={RESUME_URL} download data-goatcounter-click="resume-download">Résumé (PDF)</a>
            </li>
          )}
        </ul>
      </div>
      <footer className="page">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/25 py-5 text-sm text-white/85">
          <p>© 2026 {NAME}</p>
          <span className="flex gap-6">
            <a href="/studio/" className="link inline-flex min-h-[44px] items-center">Studio</a>
            <a href="/play/" className="link inline-flex min-h-[44px] items-center">Play: find the minimum</a>
          </span>
          <a href="/#top" className="link inline-flex min-h-[44px] items-center">Back to top</a>
        </div>
      </footer>
    </section>
  )
}

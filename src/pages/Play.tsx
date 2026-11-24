import { useEffect, useState, type ReactNode } from 'react'
import { GAMES, type GameInfo } from '../play/games'
import { loadBest } from '../play/storage'
import { fmtScore } from '../play/math'
import { PlayBar } from '../play/ui'

// Each card carries a small picture of its game: contours and a ball, a curve through dots, and clusters.
const ART: Record<GameInfo['id'], ReactNode> = {
  minimum: (
    <svg viewBox="0 0 400 250" className="play-art h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      {[150, 120, 92, 66, 42, 20].map((r, i) => (
        <ellipse key={r} cx="250" cy="150" rx={r * 1.55} ry={r * 0.78} fill="none" stroke="#fff" strokeOpacity={0.16 + i * 0.05} strokeWidth="1.5" />
      ))}
      <circle cx="250" cy="150" r="9" fill="#ffd29a" />
      <circle cx="250" cy="150" r="22" fill="#ffd29a" fillOpacity="0.18" />
      <g>
        <circle cx="116" cy="88" r="20" fill="#fff" />
        <path d="M100 76c8 5 8 21 0 28M112 69c10 7 10 31 0 38M126 70c8 6 9 30 0 36" fill="none" stroke="#2f45ff" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="116" cy="112" rx="20" ry="5" fill="#000" fillOpacity="0.25" />
      </g>
      <circle cx="318" cy="70" r="5" fill="#ffd29a" />
      <circle cx="74" cy="178" r="5" fill="#ffd29a" />
      <circle cx="338" cy="196" r="5" fill="#ffd29a" />
    </svg>
  ),
  overfit: (
    <svg viewBox="0 0 400 250" className="play-art h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <path d="M0 130C60 40 120 40 200 125S340 215 400 110" fill="none" stroke="#ffd29a" strokeOpacity="0.7" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" />
      <path d="M30 150L60 80L92 128L124 68L158 150L190 118L222 176L252 122L284 188L316 96L348 140L372 100" fill="none" stroke="#8c99ff" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      {[
        [30, 150],
        [60, 80],
        [92, 128],
        [124, 68],
        [158, 150],
        [190, 118],
        [222, 176],
        [252, 122],
        [284, 188],
        [316, 96],
        [348, 140],
        [372, 100],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="6" fill="#fff" />
      ))}
      <circle cx="205" cy="150" r="7" fill="#0b0d1a" stroke="#ffd29a" strokeWidth="3" />
    </svg>
  ),
  cluster: (
    <svg viewBox="0 0 400 250" className="play-art h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      {[
        { c: '#8c99ff', x: 110, y: 90, pts: [[-26, -10], [-8, 14], [14, -22], [24, 8], [-14, -30], [6, 28], [-32, 18], [30, -12]] },
        { c: '#ffd29a', x: 285, y: 80, pts: [[-24, 6], [-6, -20], [18, 14], [22, -12], [-16, 24], [4, 6], [28, 26], [-30, -14]] },
        { c: '#7ee2c0', x: 205, y: 188, pts: [[-28, 4], [-8, -18], [12, 16], [26, -6], [-18, 22], [4, -4], [32, 18], [-4, 28]] },
      ].map((g) => (
        <g key={g.c}>
          {g.pts.map(([dx, dy]) => (
            <circle key={`${dx}${dy}`} cx={g.x + dx} cy={g.y + dy} r="5.5" fill={g.c} />
          ))}
          <circle cx={g.x} cy={g.y} r="14" fill={g.c} stroke="#fff" strokeWidth="3" />
          <path d={`M${g.x - 5} ${g.y}h10M${g.x} ${g.y - 5}v10`} stroke="#0b0d1a" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  ),
}

const BG: Record<GameInfo['id'], string> = {
  minimum: 'bg-[radial-gradient(90%_90%_at_70%_30%,#2f45ff_0%,#10143a_70%)]',
  overfit: 'bg-[radial-gradient(90%_90%_at_30%_30%,rgb(255_210_154/0.5)_0%,#1a1522_75%)]',
  cluster: 'bg-[radial-gradient(90%_90%_at_60%_60%,rgb(47_69_255/0.8)_0%,#0f1330_75%)]',
}

export function Play() {
  const [bests, setBests] = useState<Record<string, number | null>>({})
  useEffect(() => setBests(Object.fromEntries(GAMES.map((g) => [g.id, loadBest(g.id)]))), [])

  return (
    <main id="main" className="dark min-h-[100svh] bg-[#0b0d1a] text-fog">
      <PlayBar hub />
      <div className="mx-auto w-full max-w-page px-5 pb-20 pt-6 sm:px-8 sm:pt-10 lg:px-12">
        <p className="play-rise max-w-md text-lg text-fog/85">Three small games about how machines learn.</p>
        <h1 className="play-rise mt-4 font-display text-[clamp(4rem,17vw,16rem)] font-semibold leading-[0.82] tracking-[-0.055em]" style={{ ['--i' as string]: 1 }}>
          Play<span className="text-voltsoft">.</span>
        </h1>
        <p className="play-rise mt-6 max-w-xl text-fog/85" style={{ ['--i' as string]: 2 }}>
          Each one takes a minute or two, and each is a bad idea in machine learning turned into a game: getting stuck, memorising the noise, drifting off-centre. Sound is off until you switch it on.
        </p>

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {GAMES.map((g, i) => (
            <li key={g.id} className="play-rise" style={{ ['--i' as string]: 3 + i }}>
              <a href={g.path} className="play-card group flex h-full flex-col overflow-hidden rounded-3xl bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.09]">
                <div className={`aspect-[16/10] overflow-hidden ${BG[g.id]}`}>{ART[g.id]}</div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-display text-3xl font-semibold tracking-[-0.025em]">{g.title}</h2>
                  <p className="mt-2 flex-1 text-fog/75">{g.blurb}</p>
                  <div className="mt-5 flex items-center justify-between gap-3 text-sm text-mist">
                    <span>
                      {g.time}
                      {bests[g.id] ? ` · best ${fmtScore(bests[g.id]!)}` : ''}
                    </span>
                    <span className="btn min-h-[44px] bg-white px-5 text-ink group-hover:bg-voltsoft">Play</span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-sm text-mist">
          Made by Atharva Shirke.{' '}
          <a href="/" className="link inline-flex min-h-[44px] items-center">
            Back to the site
          </a>
        </p>
      </div>
    </main>
  )
}

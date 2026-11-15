import { useEffect, useRef, useState } from 'react'
import { SubpageHeader } from '../components/SubpageHeader'
import { useReducedMotion } from '../components/motion'
import type { ParticleHandle } from '../three/particleScene'
import type { ShapeName } from '../three/shapes'

const SHAPES: { name: ShapeName; label: string; note: string }[] = [
  { name: 'sphere', label: 'Sphere', note: 'Points spread evenly with a golden-angle spiral.' },
  { name: 'lattice', label: 'Neural net', note: 'Four layers of a small network, points along every connection.' },
  { name: 'knot', label: 'Torus knot', note: 'A (2, 3) torus knot: wraps twice one way, three times the other.' },
  { name: 'helix', label: 'Double helix', note: 'Two strands and the rungs between them.' },
  { name: 'antibody', label: 'Antibody', note: 'The Y-shaped molecule I work with every day.' },
  { name: 'cloud', label: 'Cloud', note: 'Puff, from the Unhaze app.' },
  { name: 'grid', label: 'Image', note: 'A grid of pixels, the input to a vision model.' },
  { name: 'network', label: 'Network', note: 'Hosts and links, the shape of traffic data.' },
  { name: 'spiral', label: 'Sunflower', note: 'Phyllotaxis: each seed turns 137.5° from the last.' },
  { name: 'browser', label: 'Browser', note: 'A web page, in outline.' },
]

const PALETTES = [
  { name: 'Ink', bg: '#e4e7ec', base: '#0c0f14', accent: '#2f45ff', dark: false },
  { name: 'Night', bg: '#0b0d1a', base: '#e4e7ec', accent: '#8c99ff', dark: true },
  { name: 'Ember', bg: '#170c0a', base: '#ffb27a', accent: '#ff5a36', dark: true },
  { name: 'Lab', bg: '#eef6f1', base: '#0f3d2e', accent: '#00a36c', dark: false },
  { name: 'Volt', bg: '#2f45ff', base: '#ffffff', accent: '#0c0f14', dark: true },
]

export function Studio() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<ParticleHandle | null>(null)
  const reduced = useReducedMotion()
  const [shape, setShape] = useState<ShapeName | 'text' | 'scatter'>('sphere')
  const [text, setText] = useState('Hello')
  const [palette, setPalette] = useState(0)
  const [spin, setSpin] = useState(1)
  const [ready, setReady] = useState(false)
  const P = PALETTES[palette]

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    let cancelled = false
    import('../three/particleScene').then(({ mountParticles }) => {
      if (cancelled) return
      try {
        engine.current = mountParticles(c, {
          shapes: ['sphere'],
          colors: { base: PALETTES[0].base, accent: PALETTES[0].accent },
          reduced,
          preserve: true,
          density: 1.1,
          layout: (aspect) => ({ x: 0, y: 0, z: aspect < 1 ? 14 : 11 }),
        })
        c.style.opacity = '1'
        setReady(true)
      } catch {
        /* no WebGL */
      }
    })
    return () => {
      cancelled = true
      engine.current?.dispose()
      engine.current = null
    }
  }, [reduced])

  useEffect(() => {
    engine.current?.setColors(P.base, P.accent)
  }, [P, ready])

  useEffect(() => {
    engine.current?.setSpin(spin)
  }, [spin, ready])

  const pickShape = (name: ShapeName) => {
    setShape(name)
    engine.current?.setShape(name)
  }

  const showText = async (value = text) => {
    const e = engine.current
    if (!e || !value.trim()) return
    await document.fonts.ready
    const { textPoints } = await import('../three/textPoints')
    setShape('text')
    e.setSpin(0)
    setSpin(0)
    e.faceCamera()
    e.setPoints(textPoints(value, e.count))
  }

  const scatter = async () => {
    const e = engine.current
    if (!e) return
    const { scatterPoints } = await import('../three/textPoints')
    setShape('scatter')
    e.setPoints(scatterPoints(e.count))
  }

  const save = () => {
    const url = engine.current?.snapshot()
    if (!url) return
    // Composite onto the palette background so the PNG isn't transparent.
    const img = new Image()
    img.onload = () => {
      const out = document.createElement('canvas')
      out.width = img.width
      out.height = img.height
      const ctx = out.getContext('2d')!
      ctx.fillStyle = P.bg
      ctx.fillRect(0, 0, out.width, out.height)
      ctx.drawImage(img, 0, 0)
      const a = document.createElement('a')
      a.download = `studio-${shape}.png`
      a.href = out.toDataURL('image/png')
      a.click()
    }
    img.src = url
  }

  const note =
    shape === 'text'
      ? 'Your words, sampled into points from the letterforms.'
      : shape === 'scatter'
        ? 'Every particle let loose. Pick a shape to pull them back together.'
        : SHAPES.find((s) => s.name === shape)?.note

  return (
    <div className={'min-h-[100svh] transition-colors duration-700 ' + (P.dark ? 'dark text-fog' : 'text-ink')} style={{ background: P.bg }}>
      <SubpageHeader />
      <main id="main" className="page pb-16 pt-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <h1 className="text-[clamp(3.4rem,10vw,9rem)] font-semibold leading-[0.85] tracking-[-0.05em]">Studio</h1>
            <p className={'mt-4 max-w-xl text-lg ' + (P.dark ? 'text-fog/80' : 'text-slate')}>
              A sketchbook for the particle engine behind this site. Shape it, write with it, recolour it, and keep what you
              make.
            </p>
            <div className="relative mt-6 aspect-[4/3] w-full">
              <canvas
                ref={canvas}
                aria-label={`Particle sketch: ${shape === 'text' ? `the word ${text}` : shape}`}
                role="img"
                className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-1000"
              />
              <p aria-live="polite" className={'absolute bottom-2 left-0 max-w-md text-sm ' + (P.dark ? 'text-fog/70' : 'text-slate')}>
                {note}
              </p>
            </div>
          </div>

          <aside aria-label="Studio controls" className="space-y-9 lg:pt-6">
            <fieldset>
              <legend className="font-medium">Shape</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {SHAPES.map((s) => (
                  <button
                    key={s.name}
                    aria-pressed={shape === s.name}
                    onClick={() => pickShape(s.name)}
                    className={
                      'btn min-h-[44px] px-4 text-sm ' +
                      (shape === s.name ? (P.dark ? 'bg-white text-ink' : 'btn-ink') : P.dark ? 'border border-white/30 hover:border-white' : 'btn-ghost')
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                showText()
              }}
            >
              <label htmlFor="studio-text" className="font-medium">
                Write with particles
              </label>
              <div className="mt-3 flex gap-2">
                <input
                  id="studio-text"
                  value={text}
                  maxLength={24}
                  onChange={(e) => setText(e.target.value)}
                  className={'min-h-[48px] w-full min-w-0 rounded-full border px-5 text-base ' + (P.dark ? 'border-white/30 bg-white/10' : 'border-ink/25 bg-white/70')}
                />
                <button type="submit" className={'btn shrink-0 ' + (P.dark ? 'bg-white text-ink' : 'btn-ink')}>
                  Form it
                </button>
              </div>
            </form>

            <fieldset>
              <legend className="font-medium">Palette</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {PALETTES.map((p, i) => (
                  <button
                    key={p.name}
                    aria-pressed={palette === i}
                    aria-label={p.name}
                    title={p.name}
                    onClick={() => setPalette(i)}
                    className={'relative h-12 w-12 rounded-full transition-transform duration-200 active:scale-90 ' + (palette === i ? 'ring-2 ring-current ring-offset-2 ring-offset-transparent' : '')}
                    style={{ background: `conic-gradient(${p.bg} 0 50%, ${p.base} 0 80%, ${p.accent} 0)` }}
                  />
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="flex justify-between font-medium">
                Spin <span className="tabular-nums">{spin.toFixed(1)}×</span>
              </span>
              <input
                type="range"
                min={0}
                max={4}
                step={0.1}
                value={spin}
                onChange={(e) => setSpin(Number(e.target.value))}
                className="mt-2 w-full accent-current"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button onClick={scatter} className={'btn ' + (P.dark ? 'border border-white/30 hover:border-white' : 'btn-ghost')}>
                Scatter
              </button>
              <button onClick={save} className={'btn ' + (P.dark ? 'bg-white text-ink' : 'btn-ink')}>
                Save as PNG
              </button>
            </div>
            <p className={'text-sm ' + (P.dark ? 'text-fog/70' : 'text-slate')}>
              Move your pointer through the particles to push them around.{' '}
              <a href="/play/" className="link">
                Want a game instead?
              </a>
            </p>
          </aside>
        </div>
      </main>
    </div>
  )
}

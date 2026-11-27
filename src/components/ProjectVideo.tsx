import { useEffect, useRef, useState } from 'react'
import type { Project } from '../data/projects'
import { useReducedMotion } from './motion'

/**
 * A project's screen recording, shown the way product demos are: muted, looping, playing by itself while it is
 * on screen and paused when it isn't. It starts buffering a little before it scrolls into view, and the
 * screenshot (a frame from the same recording) covers the moment before the first frame, so there is no blank.
 *
 * Reduced motion or Data Saver: no autoplay and nothing downloaded up front; the visitor gets normal controls.
 * Autoplay always comes with a visible pause button (WCAG 2.2.2).
 */
export function ProjectVideo({ p, className = '' }: { p: Project; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()
  const [saveData, setSaveData] = useState(false)
  const [paused, setPaused] = useState(false) // by the visitor
  const [playing, setPlaying] = useState(false)
  const auto = !reduced && !saveData

  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    setSaveData(!!c?.saveData)
  }, [])

  useEffect(() => {
    const v = ref.current
    if (!v || !auto || !('IntersectionObserver' in window)) return
    // Start fetching about a screen early, so playback is ready when it arrives.
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && v.preload !== 'auto') {
          v.preload = 'auto'
          v.load()
        }
      },
      { rootMargin: '800px 0px' },
    )
    // Play while at least a third of it is visible.
    const seen = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !paused) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.33 },
    )
    near.observe(v)
    seen.observe(v)
    return () => {
      near.disconnect()
      seen.disconnect()
    }
  }, [auto, paused])

  if (!p.video) return null

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) {
      setPaused(false)
      v.play().catch(() => {})
    } else {
      setPaused(true)
      v.pause()
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={ref}
        muted
        loop={auto}
        playsInline
        controls={!auto}
        preload="none"
        poster={p.image?.src}
        width={1920}
        height={1080}
        aria-label={p.video.title}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="block aspect-video h-auto w-full bg-ink object-cover"
      >
        <source src={p.video.src} type="video/mp4" />
      </video>
      {auto && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause the demo video' : 'Play the demo video'}
          className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-ink/70 text-white backdrop-blur transition-[transform,background-color] duration-200 hover:bg-ink active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {playing ? (
              <>
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </>
            ) : (
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
            )}
          </svg>
        </button>
      )}
    </div>
  )
}

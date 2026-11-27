import type { Project } from '../data/projects'

/**
 * A project's screen recording. preload="none": nothing is fetched until the visitor presses play,
 * and the project's screenshot (a frame from the same recording) stands in until then.
 */
export function ProjectVideo({ p, className = '' }: { p: Project; className?: string }) {
  if (!p.video) return null
  return (
    <video
      controls
      playsInline
      preload="none"
      poster={p.image?.src}
      width={1920}
      height={1080}
      aria-label={p.video.title}
      className={`aspect-video h-auto w-full bg-ink object-cover ${className}`}
    >
      <source src={p.video.src} type="video/mp4" />
    </video>
  )
}

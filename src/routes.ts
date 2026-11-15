import { hasPage, projects } from './data/projects'
import { SITE_URL } from './data/site'

export interface RouteMeta {
  path: string
  title: string
  description: string
  ogImage: string
}

const HOME: RouteMeta = {
  path: '/',
  title: 'Atharva Shirke — Software engineer and data scientist',
  description:
    'Atharva Shirke is a software engineer and data scientist in Pune, India. Machine-learning pipelines, data products, web and Android apps. Available for freelance work.',
  ogImage: '/og.png',
}

export const routes: RouteMeta[] = [
  HOME,
  ...projects.filter(hasPage).map((p) => ({
    path: `/work/${p.slug}/`,
    title: `${p.name} — Atharva Shirke`,
    description: `${p.tagline} ${p.summary}`.slice(0, 200),
    ogImage: `/og/${p.slug}.png`,
  })),
  {
    path: '/play/',
    title: 'Find the minimum — a 3D game by Atharva Shirke',
    description:
      'A small 3D game about how machine learning learns: roll a ball across a loss landscape, collect my projects and find the global minimum.',
    ogImage: '/og/play.png',
  },
]

export function normalise(path: string): string {
  if (!path || path === '/index.html') return '/'
  const p = path.replace(/index\.html$/, '')
  return p.endsWith('/') ? p : p + '/'
}

export function metaFor(path: string): RouteMeta {
  return routes.find((r) => r.path === normalise(path)) ?? HOME
}

export const absolute = (p: string) => SITE_URL + p

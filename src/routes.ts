import { hasPage, projects, type Project } from './data/projects'
import { GAMES } from './play/games'
import { EMAIL, GITHUB_URL, LINKEDIN_URL, SITE_URL } from './data/site'

export interface RouteMeta {
  path: string
  title: string
  description: string
  ogImage: string
  /** schema.org JSON-LD graph for this page. */
  jsonld: object[]
}

export const absolute = (p: string) => SITE_URL + p

// ---- Structured data: tells search engines exactly who "Atharva Shirke" is ----
const PERSON_ID = `${SITE_URL}/#person`
const SITE_ID = `${SITE_URL}/#website`

const person = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Atharva Shirke',
  alternateName: ['Atharva', 'Atharva7887', 'athshirke'],
  url: `${SITE_URL}/`,
  image: absolute('/atharva-shirke.jpg'),
  email: `mailto:${EMAIL}`,
  jobTitle: 'Data Scientist',
  description:
    'Software engineer and data scientist in Pune, India, building machine-learning pipelines, AI tools, web and Android apps.',
  worksFor: { '@type': 'Organization', name: 'IndiskaAI', url: 'https://www.indiskaai.com/' },
  address: { '@type': 'PostalAddress', addressLocality: 'Pune', addressRegion: 'Maharashtra', addressCountry: 'IN' },
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Vishwakarma University', address: 'Pune, India' },
    { '@type': 'CollegeOrUniversity', name: 'MAEER’s MIT Polytechnic, Pune', alternateName: 'Maharashtra Institute of Technology, Pune' },
  ],
  hasCredential: [
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'degree',
      name: 'Bachelor of Engineering, Computer Engineering',
      recognizedBy: { '@type': 'CollegeOrUniversity', name: 'Vishwakarma University' },
    },
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'diploma',
      name: 'Diploma in Electronics and Telecommunication',
      recognizedBy: { '@type': 'CollegeOrUniversity', name: 'MAEER’s MIT Polytechnic, Pune' },
    },
  ],
  knowsAbout: [
    'Data science',
    'Machine learning',
    'Artificial intelligence',
    'Deep learning',
    'Computational biology',
    'Protein structure prediction',
    'Antibody engineering',
    'Python',
    'PyTorch',
    'React',
    'TypeScript',
    'Android development',
    'Kotlin',
    'Identity and access management',
  ],
  sameAs: [LINKEDIN_URL, GITHUB_URL],
}

const website = {
  '@type': 'WebSite',
  '@id': SITE_ID,
  url: `${SITE_URL}/`,
  name: 'Atharva Shirke',
  description: 'Portfolio of Atharva Shirke, data scientist and software engineer in Pune, India.',
  publisher: { '@id': PERSON_ID },
  inLanguage: 'en',
}

const crumbs = (items: [string, string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absolute(path) })),
})

function projectLd(p: Project) {
  const app = p.kind.toLowerCase().includes('app')
  return {
    '@type': app ? 'SoftwareApplication' : 'CreativeWork',
    '@id': absolute(`/work/${p.slug}/#work`),
    name: p.name,
    description: p.summary,
    url: absolute(`/work/${p.slug}/`),
    image: absolute(`/og/${p.slug}.png`),
    creator: { '@id': PERSON_ID },
    dateCreated: p.year.slice(0, 4),
    keywords: p.stack,
    ...(app
      ? {
          applicationCategory: p.slug === 'unhaze' ? 'LifestyleApplication' : 'DeveloperApplication',
          operatingSystem: p.slug === 'unhaze' ? 'Android' : 'Windows, macOS, Linux',
        }
      : {}),
    ...(p.links.length ? { sameAs: p.links.map((l) => l.href) } : {}),
  }
}

const HOME: RouteMeta = {
  path: '/',
  title: 'Atharva Shirke — Data Scientist & Software Engineer, Pune',
  description:
    'Atharva Shirke is a data scientist and software engineer in Pune, India, at IndiskaAI. Machine learning, AI and deep-learning pipelines, plus web and Android apps. Available for freelance work.',
  ogImage: '/og.png',
  jsonld: [
    person,
    website,
    {
      '@type': 'ProfilePage',
      '@id': `${SITE_URL}/#profile`,
      url: `${SITE_URL}/`,
      name: 'Atharva Shirke',
      mainEntity: { '@id': PERSON_ID },
      isPartOf: { '@id': SITE_ID },
    },
  ],
}

export const routes: RouteMeta[] = [
  HOME,
  ...projects.filter(hasPage).map((p) => ({
    path: `/work/${p.slug}/`,
    title: `${p.name} by Atharva Shirke — ${p.kind}`,
    description: `${p.tagline} ${p.summary}`.slice(0, 200),
    ogImage: `/og/${p.slug}.png`,
    jsonld: [
      projectLd(p),
      crumbs([
        ['Atharva Shirke', '/'],
        ['Work', '/#work'],
        [p.name, `/work/${p.slug}/`],
      ]),
      {
        '@type': 'WebPage',
        url: absolute(`/work/${p.slug}/`),
        name: p.name,
        isPartOf: { '@id': SITE_ID },
        about: { '@id': absolute(`/work/${p.slug}/#work`) },
        author: { '@id': PERSON_ID },
      },
      person,
    ],
  })),
  {
    path: '/studio/',
    title: 'Studio: Atharva Shirke’s 3D room',
    description:
      'Step into Atharva Shirke’s 3D room: every object is something he has made. Take the tour or click around: apps, ML pipelines, research and a game.',
    ogImage: '/og/studio.png',
    jsonld: [
      crumbs([
        ['Atharva Shirke', '/'],
        ['Studio', '/studio/'],
      ]),
      { '@type': 'WebPage', url: absolute('/studio/'), name: 'Studio', author: { '@id': PERSON_ID }, isPartOf: { '@id': SITE_ID } },
      person,
    ],
  },
  {
    path: '/play/',
    title: 'Play: three small machine-learning games — Atharva Shirke',
    description:
      'Three small browser games about how machine learning learns, by Atharva Shirke: roll down a loss landscape, fit a curve without overfitting, and herd the centroids in k-means.',
    ogImage: '/og/play.png',
    jsonld: [
      {
        '@type': 'CollectionPage',
        url: absolute('/play/'),
        name: 'Play',
        author: { '@id': PERSON_ID },
        isPartOf: { '@id': SITE_ID },
        hasPart: GAMES.map((g) => ({ '@type': 'VideoGame', name: g.title, url: absolute(g.path) })),
      },
      crumbs([
        ['Atharva Shirke', '/'],
        ['Play', '/play/'],
      ]),
      person,
    ],
  },
  ...GAMES.map((g) => ({
    path: g.path,
    title: `${g.title}: a small machine-learning game by Atharva Shirke`,
    description: `${g.blurb} ${g.kicker}`.slice(0, 200),
    ogImage: '/og/play.png',
    jsonld: [
      {
        '@type': 'VideoGame',
        name: g.title,
        url: absolute(g.path),
        author: { '@id': PERSON_ID },
        gamePlatform: 'Web browser',
        genre: 'Educational',
        applicationCategory: 'Game',
        operatingSystem: 'Any',
      },
      crumbs([
        ['Atharva Shirke', '/'],
        ['Play', '/play/'],
        [g.title, g.path],
      ]),
      person,
    ],
  })),
  {
    path: '/sitemap/',
    title: 'Sitemap — Atharva Shirke',
    description: 'Every page on Atharva Shirke’s website: work, case studies, the 3D studio and the games.',
    ogImage: '/og.png',
    jsonld: [
      crumbs([
        ['Atharva Shirke', '/'],
        ['Sitemap', '/sitemap/'],
      ]),
      person,
    ],
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

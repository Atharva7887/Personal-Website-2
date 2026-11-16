// Writes one prerendered HTML file per route (dist/index.html,
// dist/work/<slug>/index.html, dist/play/index.html) so crawlers, link-preview
// bots and visitors without JavaScript all receive the full content and the
// right title, description and preview image. Also writes sitemap.xml.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')
const entry = fs.readdirSync(ssrDir).find((f) => f.startsWith('entry-server.'))
const { render, head, routes, notFound } = await import(pathToFileURL(path.join(ssrDir, entry)).href)

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
if (!template.includes('<!--app-->')) throw new Error('prerender: <!--app--> marker missing')
const metaRe = /[ \t]*<!--meta-->[\s\S]*?<!--\/meta-->/
if (!metaRe.test(template)) throw new Error('prerender: <!--meta--> block missing')

for (const r of routes) {
  const html = template.replace(metaRe, head(r)).replace('<!--app-->', render(r.path))
  const out = path.join(dist, r.path, 'index.html')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
  console.log(`prerendered ${r.path} (${(html.length / 1024).toFixed(1)} KB)`)
}

// The 404 page: not indexed, no canonical, and served by Netlify for any unknown address.
const notFoundHtml = template
  .replace(
    metaRe,
    head(notFound)
      .split('\n')
      .filter((l) => !l.includes('rel="canonical"') && !l.includes('og:url') && !l.includes('ld+json'))
      .join('\n'),
  )
  .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex" />')
  .replace('<!--app-->', render(notFound.path))
fs.writeFileSync(path.join(dist, '404.html'), notFoundHtml)
console.log(`prerendered 404.html (${(notFoundHtml.length / 1024).toFixed(1)} KB)`)

const today = new Date().toISOString().slice(0, 10)
const urls = routes.map((r) => `  <url><loc>https://atharvar.in${r.path}</loc><lastmod>${today}</lastmod></url>`).join('\n')
fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
)
fs.rmSync(ssrDir, { recursive: true, force: true })
console.log(`sitemap.xml: ${routes.length} urls`)

// Writes one prerendered HTML file per route (dist/index.html,
// dist/work/<slug>/index.html, dist/play/index.html) so crawlers, link-preview
// bots and visitors without JavaScript all receive the full content and the
// right title, description and preview image. Also writes sitemap.xml.
import crypto from 'node:crypto'
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
// Content Security Policy, one per page as a <meta> tag (so the Studio alone can have what its texture decoder needs).
// Inline scripts (the theme and night pre-paint) are allowed by their hashes, so no page needs 'unsafe-inline' for scripts.
// frame-ancestors can't go in a <meta>, so _headers sends it (with X-Frame-Options).
const htmlFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? htmlFiles(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []))
for (const f of htmlFiles(dist)) {
  const html = fs.readFileSync(f, 'utf8')
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`)
  // The Studio's KTX2 transcoder (Emscripten embind) builds functions at runtime, so it needs 'unsafe-eval'; nothing else does.
  const studio = path.relative(dist, f).split(path.sep)[0] === 'studio'
  const csp = [
    "default-src 'self'",
    // wasm-unsafe-eval: the WebAssembly mesh and texture decoders. gc.zgo.at: GoatCounter's script, when analytics is on.
    `script-src 'self' 'wasm-unsafe-eval'${studio ? " 'unsafe-eval'" : ''} https://gc.zgo.at ${hashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'", // React style attributes, including the prerendered ones
    "img-src 'self' data: blob: https://*.goatcounter.com",
    "connect-src 'self' data: blob: https://*.goatcounter.com",
    "worker-src 'self' blob:",
    "font-src 'self' data:",
    "media-src 'self' data: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ')
  if (!/<meta charset="[^"]*" \/>/i.test(html)) throw new Error(`prerender: no <meta charset> in ${f}`)
  fs.writeFileSync(f, html.replace(/(<meta charset="[^"]*" \/>)/i, `$1\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`))
}
console.log('CSP meta written to every page')

fs.rmSync(ssrDir, { recursive: true, force: true })
console.log(`sitemap.xml: ${routes.length} urls`)

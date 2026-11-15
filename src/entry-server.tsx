import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'
import { absolute, routes, type RouteMeta } from './routes'

export { routes }

export function render(path: string): string {
  return renderToString(
    <StrictMode>
      <App path={path} />
    </StrictMode>,
  )
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** The block that replaces <!--meta-->…<!--/meta--> in index.html for one route. */
export function head(r: RouteMeta): string {
  const url = absolute(r.path)
  return [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(r.title)}" />`,
    `<meta property="og:description" content="${esc(r.description)}" />`,
    `<meta property="og:image" content="${absolute(r.ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
  ]
    .map((l) => '    ' + l)
    .join('\n')
}

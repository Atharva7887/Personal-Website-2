import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/instrument-sans'
import './index.css'
import App from './App'
import { GOATCOUNTER_CODE } from './data/site'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App path={location.pathname} />
  </StrictMode>
)

// Production HTML is prerendered (scripts/prerender.mjs), so hydrate it;
// the dev server serves an empty root, so render from scratch there.
if (root.querySelector('*')) hydrateRoot(root, app)
else createRoot(root).render(app)

// Cookie-free analytics (GoatCounter). Off until GOATCOUNTER_CODE is set.
// Links with data-goatcounter-click (the résumé downloads) are counted as events.
if (GOATCOUNTER_CODE && !location.hostname.includes('localhost')) {
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://gc.zgo.at/count.js'
  s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`
  document.head.appendChild(s)
}

import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// KTX2Loader names its Basis transcoder with a URL inside three, so Vite copies it into dist/assets even
// though the room points the loader at public/basis. That copy is never fetched; leave it out of the build.
const dropUnusedTranscoder = (): Plugin => ({
  name: 'drop-unused-basis-transcoder',
  apply: 'build',
  generateBundle(_, bundle) {
    for (const file of Object.keys(bundle)) if (/(^|\/)basis_transcoder-[\w-]+\.(js|wasm)$/.test(file)) delete bundle[file]
  },
})

// The footer's gradient libraries use three through a namespace import, which stops tree-shaking and would drag
// the whole library into the chunk the home page's hero shares with them (about +35 kB gzip on first load).
// So they get their own copy of three, bundled only into the lazy footer chunk. Nothing from that copy meets the
// app's own three objects, so the two cannot clash. The copy lives in node_modules/.cache, made fresh each build.
const gradientThree = fileURLToPath(new URL('./node_modules/.cache/three-gradient/', import.meta.url))
const isolateGradientThree = (): Plugin => ({
  name: 'isolate-gradient-three',
  enforce: 'pre',
  apply: 'build',
  buildStart() {
    fs.rmSync(gradientThree, { recursive: true, force: true })
    fs.mkdirSync(gradientThree, { recursive: true })
    for (const file of ['three.module.js', 'three.core.js']) {
      let code = fs.readFileSync(fileURLToPath(new URL('./node_modules/three/build/' + file, import.meta.url)), 'utf8')
      // Two copies is the point here, so silence three's "Multiple instances" console warning in the copy.
      code = code.replace("warn( 'WARNING: Multiple instances of Three.js being imported.' );", '')
      fs.writeFileSync(gradientThree + file, code)
    }
  },
  resolveId(source, importer) {
    if (source !== 'three' || !importer) return null
    if (!/node_modules[/](@shadergradient|@react-three|three-stdlib|camera-controls)|FooterGradient/.test(importer)) return null
    return gradientThree + 'three.module.js'
  },
})

export default defineConfig({
  plugins: [react(), dropUnusedTranscoder(), isolateGradientThree()],
})

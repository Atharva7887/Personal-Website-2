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

export default defineConfig({
  plugins: [react(), dropUnusedTranscoder()],
})

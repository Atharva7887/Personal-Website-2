// Exports the Studio room to glTF binary (.glb) for Blender.
// Run the dev server (npm run dev) and open /scripts/export-room/index.html.
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { mountRoom } from '../../src/three/room'

const canvas = document.getElementById('c') as HTMLCanvasElement
const status = document.getElementById('status')!
const room = mountRoom(canvas, { onHover: () => {}, onSelect: () => {} }, { reduced: true, night: false })

async function download(night: boolean) {
  room.setNight(night)
  status.textContent = 'Exporting…'
  const exporter = new GLTFExporter()
  // Animated helpers (steam, trail-like points) are exported as they are now.
  const glb = (await exporter.parseAsync(room.scene, { binary: true, onlyVisible: true, maxTextureSize: 2048 })) as ArrayBuffer
  const blob = new Blob([glb], { type: 'model/gltf-binary' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = night ? 'atharva-room-night.glb' : 'atharva-room-day.glb'
  a.click()
  status.textContent = `Saved ${a.download} (${(blob.size / 1024).toFixed(0)} KB)`
}

document.getElementById('day')!.addEventListener('click', () => download(false))
document.getElementById('night')!.addEventListener('click', () => download(true))

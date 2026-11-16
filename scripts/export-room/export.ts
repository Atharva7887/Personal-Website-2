// Exports the Studio room to glTF binary (.glb) for Blender.
// Run the dev server (npm run dev) and open /scripts/export-room/index.html.
// To save straight into exports/ without clicking, see the note on "Unattended export" below.
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { mountRoom } from '../../src/three/room'

const canvas = document.getElementById('c') as HTMLCanvasElement
const status = document.getElementById('status')!
const room = mountRoom(canvas, { onHover: () => {}, onSelect: () => {} }, { reduced: true, night: false })

async function download(night: boolean) {
  await room.ready // the desk, laptop and other models load after the room mounts
  room.setNight(night)
  status.textContent = 'Exporting…'
  const exporter = new GLTFExporter()
  // Animated helpers (steam, trail-like points) are exported as they are now.
  const glb = (await exporter.parseAsync(room.scene, { binary: true, onlyVisible: true, maxTextureSize: 2048 })) as ArrayBuffer
  const blob = new Blob([glb], { type: 'model/gltf-binary' })
  const name = night ? 'atharva-room-night.glb' : 'atharva-room-day.glb'
  if (saveTo) {
    await fetch(saveTo + name, { method: 'POST', body: blob })
  } else {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
  }
  status.textContent = `Saved ${name} (${(blob.size / 1024).toFixed(0)} KB)`
}

// Unattended export: ?save=http://localhost:5200/ posts the file to save-server.mjs
// (node scripts/export-room/save-server.mjs) instead of downloading it. Add &night=1 for the night
// version; each needs its own page load, because a second export on the same page does not finish.
const query = new URLSearchParams(location.search)
const saveTo = query.get('save')
if (saveTo) {
  download(query.get('night') === '1')
    .then(() => (document.title = 'done'))
    .catch((e) => (status.textContent = String(e)))
}

document.getElementById('day')!.addEventListener('click', () => download(false))
document.getElementById('night')!.addEventListener('click', () => download(true))

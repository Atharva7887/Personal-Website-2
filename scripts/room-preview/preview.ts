// Dev only: mounts the Studio room at one stop, with motion off, so a screenshot is repeatable.
import { mountRoom, type StopId } from '../../src/three/room'

const q = new URLSearchParams(location.search)
const canvas = document.getElementById('c') as HTMLCanvasElement
const room = mountRoom(canvas, { onHover: () => {}, onSelect: () => {} }, { reduced: true, night: q.get('night') === '1' })
room.focus((q.get('stop') as StopId) || 'overview')
// The title tells a headless browser when the models are in and a few frames have drawn.
room.ready.then(() => setTimeout(() => (document.title = 'ready'), 1200))

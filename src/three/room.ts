import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import dracoJs from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url'
import dracoWasm from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url'
import { makeKit } from './room/kit'
import { buildGarden, type VineSpot } from './room/garden'
import { arcadeTexture, brickTexture, floorTexture, laptopTexture, monitorTexture, phoneTexture, plasterBump, posterTexture, rugTexture, woodTexture } from './room/textures'

export type StopId = 'overview' | 'desk' | 'gpu' | 'phone' | 'poster' | 'gallery' | 'shelf' | 'plant' | 'arcade' | 'window' | 'door' | 'garden' | 'mug'

export interface RoomEvents {
  onHover: (id: StopId | null) => void
  onSelect: (id: StopId) => void
}

export interface RoomHandle {
  focus: (id: StopId) => void
  setNight: (night: boolean) => void
  /** The scene graph, for exporting the room (scripts/export-room). */
  scene: THREE.Scene
  /** Resolves once the 3D models have loaded (or failed to). */
  ready: Promise<void>
  dispose: () => void
}

// Camera framing for each stop: where the camera sits and what it looks at.
const VIEWS: Record<StopId, { pos: [number, number, number]; look: [number, number, number] }> = {
  overview: { pos: [9.4, 8.8, 11.6], look: [-2.3, 1.0, -0.2] },
  desk: { pos: [0.3, 2.35, -0.5], look: [0.2, 1.55, -3.5] },
  gpu: { pos: [3.3, 1.5, -0.9], look: [1.9, 0.6, -3.2] },
  phone: { pos: [-0.35, 2.1, -1.6], look: [-0.5, 1.2, -2.8] },
  poster: { pos: [2.5, 3.0, 0.6], look: [2.4, 2.9, -3.9] },
  gallery: { pos: [-1.6, 3.4, 1.7], look: [-1.75, 3.45, -4] },
  shelf: { pos: [0.4, 2.5, 1.6], look: [-3.8, 1.9, 0.6] },
  plant: { pos: [-0.9, 1.9, -0.7], look: [-3.0, 1.0, -3.0] },
  arcade: { pos: [3.1, 1.95, -1.1], look: [3.3, 1.35, -3.5] },
  window: { pos: [0.6, 2.6, 0.8], look: [-3.9, 2.6, -1.6] },
  door: { pos: [0.4, 2.1, 2.0], look: [-4.6, 1.4, 2.85] },
  garden: { pos: [-9.3, 2.7, 6.1], look: [-4.6, 1.5, 1.0] },
  mug: { pos: [1.95, 2.0, -1.75], look: [1.0, 1.25, -2.65] },
}

const MODELS = '/models/'
const M = 1.5 // room units per metre: the room is drawn a little larger than life
const DESK_X = 0.2
const DESK_Z = -3.15
const DESK_Y = 0.763 * M // top of the desk

// Project covers hung on the gallery wall (public/og).
const GALLERY = ['unhaze', 'protein-ml-pipelines', 'interaction-analysis-app', 'indiskaai-website', 'skin-lesion-classifier', 'plant-cultivation-helper']

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const noRaycast = () => {}

export function mountRoom(canvas: HTMLCanvasElement, ev: RoomEvents, opts: { reduced: boolean; night: boolean }): RoomHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  const kit = makeKit(scene)
  const { track, mat, mesh, box, tbox, cyl } = kit

  // Soft reflections on wood, glass and metal.
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envScene = new RoomEnvironment()
  const envTarget = pmrem.fromScene(envScene, 0.04)
  scene.environment = envTarget.texture
  pmrem.dispose()

  // Interactive groups
  const groups = new Map<StopId, THREE.Group>()
  const group = (id: StopId) => {
    const g = new THREE.Group()
    g.userData.id = id
    g.name = id.charAt(0).toUpperCase() + id.slice(1)
    scene.add(g)
    groups.set(id, g)
    return g
  }
  /** An invisible box that makes a detailed model easy (and cheap) to click. */
  const pickMat = track(new THREE.MeshBasicMaterial())
  const pickBox = (w: number, h: number, d: number, x: number, y: number, z: number, parent: THREE.Object3D) => {
    const p = box(w, h, d, pickMat, x, y, z, parent)
    p.visible = false
    return p
  }
  const screenMat = (tex: THREE.Texture) => track(new THREE.MeshBasicMaterial({ map: track(tex), toneMapped: false }))

  // ---------- Room shell ----------
  const floorTex = track(floorTexture())
  const bump = track(plasterBump())
  bump.repeat.set(3, 3)
  const brickTex = track(brickTexture())
  const floorMat = mat('#ffffff', { map: floorTex, roughness: 0.5 })
  const slab = mat('#7d6149', { roughness: 0.9 })
  const wallMat = mat('#efe9df', { roughness: 0.95, bumpMap: bump, bumpScale: 0.6 })
  const accentWall = mat('#2f3b68', { roughness: 0.92, bumpMap: bump, bumpScale: 0.6 })
  const brick = mat('#ffffff', { map: brickTex, roughness: 0.95 })
  const white = mat('#f6f3ee', { roughness: 0.6 })

  // Walls and floor stop a click from reaching what is behind them (the garden, mostly).
  const occluders: THREE.Object3D[] = []
  const floor = tbox(8.2, 0.2, 8.2, [slab, slab, floorMat, slab, slab, slab], -0.1, -0.1, -0.1, 4)
  floor.name = 'Floor'
  const backWall = tbox(8.2, 5, 0.2, [wallMat, wallMat, wallMat, wallMat, wallMat, wallMat], -0.1, 2.5, -4.1, 2)
  backWall.name = 'Back wall'
  occluders.push(floor, backWall)
  // The left wall is built in pieces around the window and the door. Inside is painted, outside is brick.
  const WIN = { z0: -2.6, z1: -0.8, y0: 1.85, y1: 3.55 }
  const DOOR = { z0: 2.15, z1: 3.45, y1: 2.9 }
  const sideMats = [accentWall, brick, wallMat, wallMat, accentWall, accentWall] // ends match the paint, so joints do not show
  // Each piece is a hair oversize, so no background shows at the joints.
  const sideWall: THREE.Object3D[] = []
  const wallPiece = (z0: number, z1: number, y0: number, y1: number) => {
    const piece = tbox(0.2, y1 - y0 + 0.01, z1 - z0 + 0.01, sideMats, -4.1, (y0 + y1) / 2, (z0 + z1) / 2, 1.5)
    occluders.push(piece)
    sideWall.push(piece)
  }
  wallPiece(-4, WIN.z0, 0, 5)
  wallPiece(WIN.z0, WIN.z1, 0, WIN.y0)
  wallPiece(WIN.z0, WIN.z1, WIN.y1, 5)
  wallPiece(WIN.z1, DOOR.z0, 0, 5)
  wallPiece(DOOR.z0, DOOR.z1, DOOR.y1, 5)
  wallPiece(DOOR.z1, 4, 0, 5)
  // Skirting
  box(8, 0.2, 0.05, white, 0, 0.1, -3.975)
  box(0.05, 0.2, DOOR.z0 + 4 - 0.08, white, -3.975, 0.1, (DOOR.z0 - 4 - 0.08) / 2)
  box(0.05, 0.2, 4 - DOOR.z1 - 0.08, white, -3.975, 0.1, (4 + DOOR.z1 + 0.08) / 2)

  // Rug
  const rug = mesh(new THREE.BoxGeometry(3.6, 0.03, 2.4), mat('#ffffff', { map: track(rugTexture()), roughness: 1 }), 0.5, 0.015, -0.7)
  rug.name = 'Rug'
  rug.castShadow = false

  // ---------- Desk: the models arrive later, the screens and the click area are here now ----------
  const desk = group('desk')
  pickBox(1.97, 0.14, 1.5, DESK_X, DESK_Y - 0.07, DESK_Z, desk)
  pickBox(1.25, 0.72, 0.3, DESK_X, DESK_Y + 0.38, DESK_Z - 0.45, desk)
  const monitorMat = screenMat(monitorTexture())
  const laptopMat = screenMat(laptopTexture())
  const monitorGlow = new THREE.PointLight('#8c99ff', 0, 4.5, 1.8)
  monitorGlow.position.set(DESK_X, DESK_Y + 0.5, DESK_Z + 0.2)
  scene.add(monitorGlow)
  const chair = new THREE.Group()
  chair.name = 'Chair'
  scene.add(chair)

  // ---------- GPU tower: glass side, lit fans ----------
  // The PC model (furniture.glb) replaces this simple tower once it loads.
  const gpu = group('gpu')
  const TX = 1.95
  const TZ = -3.3
  const gpuFallback = new THREE.Group()
  gpu.add(gpuFallback)
  pickBox(0.55, 1.15, 1.0, TX, 0.58, TZ, gpu)
  const caseMat = mat('#14161f', { roughness: 0.35, metalness: 0.6 })
  box(0.5, 0.04, 1.0, caseMat, TX, 0.07, TZ, gpuFallback)
  box(0.5, 0.04, 1.0, caseMat, TX, 1.1, TZ, gpuFallback)
  box(0.03, 1.0, 1.0, caseMat, TX - 0.235, 0.585, TZ, gpuFallback)
  box(0.5, 1.0, 0.03, caseMat, TX, 0.585, TZ - 0.485, gpuFallback)
  box(0.5, 1.0, 0.03, mat('#0b0c12', { roughness: 0.6, metalness: 0.4 }), TX, 0.585, TZ + 0.485, gpuFallback)
  for (const [dx, dz] of [[-0.2, -0.42], [0.2, -0.42], [-0.2, 0.42], [0.2, 0.42]]) box(0.06, 0.05, 0.08, caseMat, TX + dx, 0.025, TZ + dz, gpuFallback)
  const glass = track(new THREE.MeshStandardMaterial({ color: '#9fb4d9', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.22 }))
  box(0.012, 1.0, 0.96, glass, TX + 0.245, 0.585, TZ, gpuFallback).castShadow = false
  // Inside: board, graphics card, memory, cooler
  box(0.02, 0.86, 0.8, mat('#1c2030', { roughness: 0.7 }), TX - 0.21, 0.6, TZ - 0.04, gpuFallback)
  box(0.3, 0.1, 0.66, mat('#23262f', { roughness: 0.4, metalness: 0.7 }), TX - 0.03, 0.42, TZ - 0.02, gpuFallback)
  const ledMat = track(new THREE.MeshBasicMaterial({ color: '#8c99ff', toneMapped: false }))
  box(0.3, 0.015, 0.6, ledMat, TX - 0.03, 0.478, TZ - 0.02, gpuFallback).castShadow = false
  for (let i = 0; i < 4; i++) box(0.14, 0.2, 0.012, i % 2 ? ledMat : caseMat, TX - 0.12, 0.84, TZ + 0.1 + i * 0.04, gpuFallback).castShadow = false
  const ringGeo = track(new THREE.TorusGeometry(0.13, 0.014, 8, 28))
  const ring = (x: number, y: number, z: number, ry: number) => {
    const r = new THREE.Mesh(ringGeo, ledMat)
    r.position.set(x, y, z)
    r.rotation.y = ry
    gpuFallback.add(r)
  }
  for (const y of [0.27, 0.585, 0.9]) ring(TX, y, TZ + 0.505, 0)
  ring(TX - 0.13, 0.82, TZ - 0.18, Math.PI / 2)
  const gpuLight = new THREE.PointLight('#5f6dff', 6, 3.2, 2)
  gpuLight.position.set(TX + 0.5, 0.6, TZ + 0.3)
  scene.add(gpuLight)

  // ---------- Phone (Unhaze) ----------
  const phone = group('phone')
  const PHX = -0.42
  const PHZ = -2.92
  const phoneBody = mesh(new THREE.BoxGeometry(0.26, 0.025, 0.52), mat('#16181f', { roughness: 0.3, metalness: 0.6 }), PHX, DESK_Y + 0.0125, PHZ, phone)
  phoneBody.rotation.y = 0.35
  const phoneScreen = mesh(new THREE.PlaneGeometry(0.235, 0.49), screenMat(phoneTexture()), PHX, DESK_Y + 0.027, PHZ, phone)
  phoneScreen.rotation.set(-Math.PI / 2, 0, 0.35)
  phoneScreen.castShadow = false

  // ---------- Mug with steam ----------
  const mug = group('mug')
  const MUG: [number, number, number] = [1.02, DESK_Y, -2.62]
  const mugFallback = new THREE.Group()
  mug.add(mugFallback)
  pickBox(0.32, 0.3, 0.32, MUG[0], MUG[1] + 0.15, MUG[2], mug)
  const ceramic = mat('#ff5a36', { roughness: 0.25 })
  const mugPts = [
    [0.0, 0.0],
    [0.095, 0.0],
    [0.11, 0.02],
    [0.115, 0.23],
    [0.1, 0.23],
    [0.095, 0.03],
    [0.0, 0.03],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  mesh(new THREE.LatheGeometry(mugPts, 28), ceramic, MUG[0], MUG[1], MUG[2], mugFallback)
  cyl(0.095, 0.095, 0.01, mat('#3a2418', { roughness: 0.2 }), MUG[0], MUG[1] + 0.195, MUG[2], mugFallback, 24).castShadow = false
  const handle = mesh(new THREE.TorusGeometry(0.065, 0.018, 10, 20), ceramic, MUG[0] + 0.125, MUG[1] + 0.12, MUG[2], mugFallback)
  handle.rotation.y = 0
  const steamGeo = track(new THREE.BufferGeometry())
  const STEAM = 24
  const steamPos = new Float32Array(STEAM * 3)
  // Resting shape (used as-is when motion is reduced): a loose curl above the cup.
  for (let i = 0; i < STEAM; i++) {
    const life = i / STEAM
    steamPos.set([MUG[0] + Math.sin(life * 6 + i) * 0.04 * (1 + life), MUG[1] + 0.25 + life * 0.6, MUG[2] + Math.cos(life * 5 + i) * 0.04], i * 3)
  }
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3))
  const steamMat = track(new THREE.PointsMaterial({ color: '#ffffff', size: 0.05, transparent: true, opacity: 0.4, depthWrite: false }))
  const steam = new THREE.Points(steamGeo, steamMat)
  steam.name = 'Steam'
  scene.add(steam)

  // ---------- Framed pictures ----------
  const frameBlack = mat('#15161b', { roughness: 0.4 })
  const frameOak = mat('#ffffff', { map: track(woodTexture(30, 38, 46, 13)), roughness: 0.6 })
  const mount = mat('#fbfaf6', { roughness: 0.9 })
  /** A frame on the back wall: moulding, a white mount, then the picture. */
  const framed = (parent: THREE.Object3D, art: THREE.Material, x: number, y: number, w: number, h: number, moulding: THREE.Material, border = 0.07) => {
    const fw = w + border * 2 + 0.08
    const fh = h + border * 2 + 0.08
    box(fw, fh, 0.05, moulding, x, y, -3.975, parent)
    const m = mesh(new THREE.PlaneGeometry(fw - 0.08, fh - 0.08), mount, x, y, -3.948, parent)
    m.castShadow = false
    const a = mesh(new THREE.PlaneGeometry(w, h), art, x, y, -3.945, parent)
    a.castShadow = false
  }

  // Poster (antibody)
  const poster = group('poster')
  framed(poster, track(new THREE.MeshStandardMaterial({ map: track(posterTexture()), roughness: 0.55 })), 2.55, 2.9, 1.18, 1.56, frameBlack, 0)

  // Gallery wall: project covers
  const gallery = group('gallery')
  const texLoader = new THREE.TextureLoader()
  GALLERY.forEach((slug, i) => {
    const art = track(new THREE.MeshStandardMaterial({ color: '#d9dce3', roughness: 0.6 }))
    texLoader.load(`/og/${slug}.png`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      track(t)
      art.map = t
      art.color.set('#ffffff')
      art.needsUpdate = true
    })
    framed(gallery, art, -3.1 + (i % 3) * 1.42, i < 3 ? 4.02 : 2.98, 1.14, 0.6, i % 2 ? frameBlack : frameOak)
  })
  // Picture light over the gallery
  const brass = mat('#b08d57', { roughness: 0.3, metalness: 0.9 })
  const railLight = track(new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffd9a0', emissiveIntensity: 0 }))
  const rail = cyl(0.025, 0.025, 3.9, brass, -1.68, 4.62, -3.82, scene, 10)
  rail.rotation.z = Math.PI / 2
  box(3.8, 0.02, 0.05, railLight, -1.68, 4.595, -3.82).castShadow = false
  for (const x of [-3.4, 0.05]) box(0.03, 0.03, 0.18, brass, x, 4.62, -3.9)
  const galleryLight = new THREE.PointLight('#ffd9a0', 0, 5, 1.6)
  galleryLight.position.set(-1.68, 4.3, -3.2)
  scene.add(galleryLight)

  // ---------- Sideboard under the gallery ----------
  const sideboard = new THREE.Group()
  sideboard.name = 'Sideboard'
  scene.add(sideboard)
  const SBX = -1.72
  const SBZ = -3.7
  const walnut = mat('#ffffff', { map: track(woodTexture(24, 38, 30, 29)), roughness: 0.5 })
  tbox(1.5, 0.62, 0.5, walnut, SBX, 0.56, SBZ, 1.2, sideboard)
  for (const dx of [-0.5, 0, 0.5]) {
    box(0.47, 0.54, 0.02, mat('#6a4630', { roughness: 0.55 }), SBX + dx, 0.56, SBZ + 0.255, sideboard)
    cyl(0.012, 0.012, 0.03, brass, SBX + dx + 0.18, 0.6, SBZ + 0.275, sideboard, 8).rotation.x = Math.PI / 2
  }
  for (const dx of [-0.68, 0.68]) for (const dz of [-0.18, 0.18]) cyl(0.022, 0.016, 0.25, frameBlack, SBX + dx, 0.125, SBZ + dz, sideboard, 8)
  // On top: a few books and a small speaker (the ZZ plant model joins them once it loads)
  ;[['#3a3f55', 0.4, 0.1], ['#d9825b', 0.36, -0.12], ['#f1ece2', 0.33, 0.25]].forEach(([c, w, r], i) => {
    box(w as number, 0.045, 0.27, mat(c as string, { roughness: 0.85 }), SBX + 0.05, 0.895 + i * 0.047, SBZ + 0.02, sideboard).rotation.y = r as number
  })
  box(0.2, 0.3, 0.2, mat('#1b1c22', { roughness: 0.7 }), SBX + 0.52, 1.02, SBZ - 0.02, sideboard)
  cyl(0.07, 0.07, 0.01, mat('#2a2c35', { roughness: 0.3, metalness: 0.5 }), SBX + 0.52, 1.05, SBZ + 0.083, sideboard, 20).rotation.x = Math.PI / 2

  // ---------- Bookshelf + diploma ----------
  const shelf = group('shelf')
  const shelfFallback = new THREE.Group()
  shelf.add(shelfFallback)
  pickBox(0.45, 2.9, 2.3, -3.75, 1.45, 0.8, shelf)
  const shelfMat = mat('#f2efe9', { roughness: 0.6 })
  const boardMat = mat('#ffffff', { map: track(woodTexture(27, 40, 40, 17)), roughness: 0.6 })
  box(0.05, 3.0, 2.2, shelfMat, -3.97, 1.5, 0.8, shelfFallback) // back
  box(0.45, 3.0, 0.06, shelfMat, -3.75, 1.5, -0.3, shelfFallback) // sides
  box(0.45, 3.0, 0.06, shelfMat, -3.75, 1.5, 1.9, shelfFallback)
  box(0.45, 0.06, 2.2, shelfMat, -3.75, 2.97, 0.8, shelfFallback) // top
  box(0.45, 0.12, 2.2, shelfMat, -3.75, 0.06, 0.8, shelfFallback) // plinth
  const bookColors = ['#2f45ff', '#d9825b', '#0c0f14', '#e8c58f', '#8c99ff', '#c4452c', '#1f7a56', '#f1ece2', '#3a3f55']
  const bookMats = bookColors.map((c) => mat(c, { roughness: 0.85 }))
  const bookGeo = track(new THREE.BoxGeometry(1, 1, 1))
  for (let s = 0; s < 3; s++) {
    tbox(0.42, 0.04, 2.1, boardMat, -3.73, 0.55 + s * 0.85, 0.8, 1, shelfFallback)
    let z = -0.2
    let n = s * 3
    const stop = s === 1 ? 1.15 : 1.75 // leave room on the middle shelf for a plant
    while (z < stop) {
      const w = 0.07 + ((n * 37) % 7) / 70
      const h = 0.46 + ((n * 13) % 5) / 18
      const b = new THREE.Mesh(bookGeo, bookMats[n % bookMats.length])
      b.scale.set(0.3 - ((n * 7) % 3) * 0.02, h, w)
      b.position.set(-3.7, 0.57 + s * 0.85 + h / 2, z + w / 2)
      if (n % 9 === 8) b.rotation.x = 0.16
      b.castShadow = b.receiveShadow = true
      shelfFallback.add(b)
      z += w + (n % 9 === 8 ? 0.06 : 0.012)
      n++
    }
  }
  // A small pot on the middle shelf
  cyl(0.12, 0.09, 0.2, mat('#e7e1d5', { roughness: 0.5 }), -3.72, 1.52, 1.5, shelfFallback, 16)
  const succulent = mat('#5f9b6a', { roughness: 0.8, flatShading: true })
  for (let i = 0; i < 7; i++) {
    const s = mesh(new THREE.ConeGeometry(0.035, 0.22, 5), succulent, -3.72 + Math.cos(i * 0.9) * 0.05, 1.7, 1.5 + Math.sin(i * 0.9) * 0.05, shelfFallback)
    s.rotation.set(Math.sin(i * 0.9) * 0.5, 0, -Math.cos(i * 0.9) * 0.5)
  }
  // Diploma on the wall above
  box(0.04, 0.66, 0.86, frameOak, -3.98, 3.62, 0.8, shelf)
  box(0.03, 0.54, 0.74, mount, -3.965, 3.62, 0.8, shelf)
  box(0.03, 0.34, 0.5, mat('#2f45ff', { roughness: 0.7 }), -3.955, 3.62, 0.8, shelf)

  // ---------- Window: a real opening on to the garden ----------
  const win = group('window')
  const WZ = (WIN.z0 + WIN.z1) / 2
  const WY = (WIN.y0 + WIN.y1) / 2
  const WW = WIN.z1 - WIN.z0
  const WH = WIN.y1 - WIN.y0
  box(0.26, WH, 0.07, white, -4.1, WY, WIN.z0 + 0.035, win)
  box(0.26, WH, 0.07, white, -4.1, WY, WIN.z1 - 0.035, win)
  box(0.26, 0.07, WW, white, -4.1, WIN.y1 - 0.035, WZ, win)
  box(0.26, 0.07, WW, white, -4.1, WIN.y0 + 0.035, WZ, win)
  box(0.06, WH, 0.05, white, -4.1, WY, WZ, win)
  box(0.06, 0.05, WW, white, -4.1, WY + 0.25, WZ, win)
  box(0.34, 0.05, WW + 0.2, white, -3.9, WIN.y0 - 0.02, WZ, win) // sill
  const pane = box(0.01, WH - 0.1, WW - 0.1, glass, -4.1, WY, WZ, win)
  pane.castShadow = false
  // Curtains
  const linen = mat('#efe6d6', { roughness: 1, side: THREE.DoubleSide })
  const curtain = (z: number) => {
    const g = new THREE.PlaneGeometry(0.62, 2.25, 18, 1)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 30) * 0.035)
    g.computeVertexNormals()
    const c = mesh(g, linen, -3.86, 2.68, z, win)
    c.rotation.y = Math.PI / 2
  }
  curtain(WIN.z0 - 0.18)
  curtain(WIN.z1 + 0.18)
  const rod = cyl(0.018, 0.018, WW + 1.2, brass, -3.86, 3.82, WZ, win, 8)
  rod.rotation.x = Math.PI / 2

  // ---------- Door to the garden ----------
  const door = group('door')
  const doorTex = track(woodTexture(22, 46, 30, 23))
  doorTex.center.set(0.5, 0.5)
  doorTex.rotation = Math.PI / 2
  const doorWood = mat('#ffffff', { map: doorTex, roughness: 0.55 })
  const doorPanel = mat('#8a5a3a', { roughness: 0.6 })
  const DW = DOOR.z1 - DOOR.z0
  box(0.28, DOOR.y1, 0.07, white, -4.1, DOOR.y1 / 2, DOOR.z0 + 0.035, door)
  box(0.28, DOOR.y1, 0.07, white, -4.1, DOOR.y1 / 2, DOOR.z1 - 0.035, door)
  box(0.28, 0.07, DW, white, -4.1, DOOR.y1 - 0.035, (DOOR.z0 + DOOR.z1) / 2, door)
  box(0.3, 0.03, DW, mat('#8f8a80', { roughness: 0.8 }), -4.1, 0.0, (DOOR.z0 + DOOR.z1) / 2, door) // threshold
  const leaf = new THREE.Group() // pivots on its hinges
  leaf.position.set(-4.17, 0, DOOR.z0 + 0.08)
  door.add(leaf)
  const LW = DW - 0.16
  box(0.06, DOOR.y1 - 0.1, LW, doorWood, 0, (DOOR.y1 - 0.1) / 2 + 0.02, LW / 2, leaf)
  for (const [y, h] of [[2.02, 1.3], [0.7, 0.9]]) for (const z of [LW * 0.27, LW * 0.73]) box(0.075, h, LW * 0.36, doorPanel, 0, y, z, leaf)
  for (const x of [-0.07, 0.07]) {
    mesh(new THREE.SphereGeometry(0.045, 14, 10), brass, x, 1.32, LW - 0.12, leaf)
    cyl(0.03, 0.03, 0.02, brass, x * 0.6, 1.32, LW - 0.12, leaf, 12).rotation.z = Math.PI / 2
  }
  const DOOR_AJAR = -1.0
  const DOOR_OPEN = -1.72
  let doorAngle = DOOR_AJAR
  let doorTarget = DOOR_AJAR
  leaf.rotation.y = doorAngle
  // Doormat
  mesh(new THREE.BoxGeometry(0.7, 0.025, 1.1), mat('#7a5c3e', { roughness: 1 }), -3.45, 0.012, (DOOR.z0 + DOOR.z1) / 2).castShadow = false

  // ---------- Plant: the monstera model arrives later, this is its click area ----------
  const plant = group('plant')
  const PX = -3.05
  const PZ = -3.05
  pickBox(1.1, 2.0, 1.1, PX, 1.0, PZ, plant)
  const swaying: THREE.Object3D[] = [] // plants that move a little in the air

  // ---------- Arcade cabinet (to /play) ----------
  const arcade = group('arcade')
  const arcadeFallback = new THREE.Group()
  arcade.add(arcadeFallback)
  const cab = mat('#2f45ff', { roughness: 0.45 })
  const black = mat('#0c0f14', { roughness: 0.5 })
  const AX = 3.3
  const AZ = -3.45
  pickBox(1.1, 2.1, 0.9, AX, 1.05, AZ, arcade)
  box(0.9, 1.9, 0.8, cab, AX, 0.95, AZ, arcadeFallback)
  box(0.94, 0.12, 0.84, black, AX, 1.96, AZ, arcadeFallback)
  for (const dx of [-0.455, 0.455]) box(0.012, 0.16, 0.8, mat('#ffd29a', { roughness: 0.5 }), AX + dx, 0.5, AZ, arcadeFallback)
  const marqueeMat = track(new THREE.MeshBasicMaterial({ color: '#ffd29a', toneMapped: false }))
  box(0.86, 0.22, 0.06, marqueeMat, AX, 1.82, AZ + 0.42, arcadeFallback).castShadow = false
  box(0.76, 0.62, 0.03, black, AX, 1.4, AZ + 0.4, arcadeFallback)
  const arcScreen = mesh(new THREE.PlaneGeometry(0.66, 0.52), screenMat(arcadeTexture()), AX, 1.4, AZ + 0.42, arcadeFallback)
  arcScreen.castShadow = false
  box(0.9, 0.08, 0.36, black, AX, 1.02, AZ + 0.52, arcadeFallback).rotation.x = 0.35
  const btnMat = mat('#ff5a36', { roughness: 0.3 })
  for (const dx of [-0.02, 0.12, 0.26]) cyl(0.04, 0.04, 0.04, btnMat, AX + dx, 1.085, AZ + 0.55, arcadeFallback, 12).rotation.x = 0.35
  const stick = cyl(0.012, 0.012, 0.14, mat('#c9ccd6', { metalness: 0.9, roughness: 0.3 }), AX - 0.25, 1.11, AZ + 0.5, arcadeFallback, 8)
  stick.rotation.x = 0.35
  mesh(new THREE.SphereGeometry(0.04, 12, 10), btnMat, AX - 0.25, 1.185, AZ + 0.525, arcadeFallback)
  const arcadeLight = new THREE.PointLight('#5f6dff', 3, 2.5, 2)
  arcadeLight.position.set(AX, 1.4, AZ + 0.9)
  scene.add(arcadeLight)

  // ---------- Floor lamp ----------
  cyl(0.24, 0.26, 0.04, black, -2.9, 0.02, -0.5, scene, 24)
  cyl(0.02, 0.02, 1.85, mat('#b08d57', { roughness: 0.3, metalness: 0.9 }), -2.9, 0.95, -0.5, scene, 10)
  const shadeMat = track(new THREE.MeshStandardMaterial({ color: '#f3e3c4', emissive: '#ffb27a', emissiveIntensity: 0, roughness: 0.9, side: THREE.DoubleSide }))
  const shade = mesh(new THREE.CylinderGeometry(0.22, 0.36, 0.44, 28, 1, true), shadeMat, -2.9, 1.98, -0.5)
  shade.name = 'Lamp shade'
  shade.castShadow = false
  const lampLight = new THREE.PointLight('#ffb27a', 0, 8, 1.6)
  lampLight.position.set(-2.9, 1.9, -0.5)
  lampLight.castShadow = true
  lampLight.shadow.mapSize.set(512, 512)
  lampLight.shadow.bias = -0.002
  scene.add(lampLight)

  // ---------- A place to sit: the sofa model, or a bean bag if it does not load ----------
  const SOFA: [number, number, number] = [1.15, 0, 2.55]
  const seating = new THREE.Group()
  seating.name = 'Seating'
  scene.add(seating)
  const bag = mesh(new THREE.SphereGeometry(0.8, 28, 18), mat('#3d4a78', { roughness: 1 }), 2.75, 0.4, 1.5)
  bag.name = 'Bean bag'
  bag.visible = false
  bag.scale.set(1, 0.56, 1)
  {
    const p = bag.geometry.attributes.position
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i)
      if (y > 0.2) p.setY(i, y - 0.28 * Math.max(0, 1 - Math.hypot(p.getX(i) - 0.15, p.getZ(i) - 0.1) / 0.7)) // where someone sat
      if (y < -0.55) p.setY(i, -0.55 - (y + 0.55) * 0.3) // flat on the floor
    }
    bag.geometry.computeVertexNormals()
  }

  // ---------- Garden ----------
  const garden = group('garden')
  const outside = buildGarden(kit)
  // The lawn near the door is the garden's click target.
  pickBox(6.2, 0.1, 9, -7.4, 0.02, 1.6, garden)

  // ---------- Models ----------
  const loaded: THREE.Object3D[] = []
  const vines: THREE.Object3D[] = []
  let disposed = false
  const disposeTree = (root: THREE.Object3D) =>
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.geometry.dispose()
      for (const material of Array.isArray(m.material) ? m.material : [m.material]) {
        for (const v of Object.values(material)) if ((v as THREE.Texture)?.isTexture) (v as THREE.Texture).dispose()
        material.dispose()
      }
    })
  // The Draco decoder ships with three; it is fetched only when a model needs it.
  const draco = new DRACOLoader().setDecoderPath({ js: dracoJs, wasm: dracoWasm })
  const loader = new GLTFLoader().setDRACOLoader(draco)
  const load = async (file: string) => {
    const root = (await loader.loadAsync(MODELS + file)).scene
    if (disposed) {
      disposeTree(root)
      throw new Error('room disposed')
    }
    loaded.push(root)
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = m.receiveShadow = true
      m.raycast = noRaycast // clicks go to the pick boxes instead
    })
    return root
  }
  const warn = (e: unknown) => {
    if (!disposed) console.warn('Studio room: a model did not load', e)
  }
  /** Swap a model's named screen material for one of the room's live canvases. */
  const setScreen = (root: THREE.Object3D, name: string, material: THREE.Material) =>
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh && (m.material as THREE.Material).name === name) {
        ;(m.material as THREE.Material).dispose()
        m.material = material
        m.castShadow = false
      }
    })

  // The phone, mug and steam sit on the desk, so they wait for it.
  const onDesk = [phone, mug, steam]
  onDesk.forEach((o) => (o.visible = false))
  const setup = load('studio-setup.glb').then(
    (root) => {
      root.scale.setScalar(M)
      root.position.set(DESK_X, 0, DESK_Z)
      const seat = root.getObjectByName('Chair')
      if (seat) {
        // The chair stands on its own, pushed back and turned a little, as if someone just got up.
        chair.position.set(DESK_X + seat.position.x * M + 0.85, 0, DESK_Z + seat.position.z * M + 0.75)
        chair.rotation.y = 0.85
        seat.position.set(0, 0, 0)
        seat.scale.setScalar(M)
        chair.add(seat)
      }
      desk.add(root)
    },
    (e) => {
      warn(e)
      // No model: a plain desk, so the stop still makes sense.
      const dark = mat('#1d1f2b', { roughness: 0.5 })
      box(1.97, 0.08, 1.5, dark, DESK_X, DESK_Y - 0.04, DESK_Z, desk)
      for (const dx of [-0.8, 0.8]) box(0.1, DESK_Y - 0.08, 1.2, dark, DESK_X + dx, (DESK_Y - 0.08) / 2, DESK_Z, desk)
    },
  ).then(() => onDesk.forEach((o) => (o.visible = true)))
  const MONITOR_Z = DESK_Z - 0.45
  const monitor = load('monitor.glb').then(
    (root) => {
      root.scale.setScalar(M)
      root.position.set(DESK_X - 0.03, DESK_Y, MONITOR_Z)
      setScreen(root, 'Screen', monitorMat)
      desk.add(root)
    },
    (e) => {
      warn(e)
      // No model: a plain screen on a stand.
      const dark = mat('#1d1f2b', { roughness: 0.5 })
      box(1.24, 0.56, 0.05, dark, DESK_X, DESK_Y + 0.42, MONITOR_Z, desk)
      box(0.1, 0.2, 0.06, dark, DESK_X, DESK_Y + 0.08, MONITOR_Z - 0.03, desk)
      mesh(new THREE.PlaneGeometry(1.18, 0.5), monitorMat, DESK_X, DESK_Y + 0.42, MONITOR_Z + 0.03, desk)
    },
  )
  const laptop = load('laptop.glb').then(
    (root) => {
      root.scale.setScalar(1.05)
      root.position.set(DESK_X + 0.68, DESK_Y + 0.005, DESK_Z - 0.2)
      root.rotation.y = -0.5
      setScreen(root, 'LaptopScreen', laptopMat)
      desk.add(root)
    },
    warn,
  )
  // The break corner: side table, a controller on its stand, and the console beside it.
  const TABLE: [number, number] = [3.4, 0.5]
  const gaming = load('gaming.glb').then(
    (root) => {
      const place = (name: string, x: number, y: number, z: number, rotY: number) => {
        const o = root.getObjectByName(name)
        if (!o) return
        o.position.set(x, y, z)
        o.rotation.y = rotY
        o.scale.setScalar(M)
      }
      place('Table', TABLE[0], 0, TABLE[1], 0.4)
      place('ControllerStand', TABLE[0] - 0.02, 0.367 * M, TABLE[1] + 0.03, -Math.PI / 4)
      place('Console', 3.62, 0, -0.45, -0.5)
      scene.add(root)
    },
    warn,
  )
  // Plants: the monstera in the corner, a ZZ plant on the sideboard, a pothos by the door.
  const plants = load('plants.glb').then((root) => {
    const place = (name: string, parent: THREE.Object3D, x: number, y: number, z: number, rotY: number, scale: number) => {
      const o = root.getObjectByName(name)
      if (!o) return
      o.position.set(x, y, z)
      o.rotation.y = rotY
      o.scale.setScalar(scale)
      parent.add(o)
      swaying.push(o)
    }
    // Leaves are cut out of their texture rather than blended, so they sort correctly.
    root.traverse((o) => {
      const material = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (material && material.name === 'PothosLeaf') {
        material.transparent = false
        material.alphaTest = 0.5
        material.side = THREE.DoubleSide
      }
    })
    place('Monstera', plant, PX, 0, PZ, 0.6, M)
    place('ZZPlant', sideboard, SBX - 0.48, 0.87, SBZ, 0.3, 1.15)
    place('Pothos', scene, -3.38, 0, 3.72, 1.2, 1.3)
    loaded.push(plant, sideboard) // their models now live in these groups
  }, warn)
  // The greenhouse at the back of the garden, lit from inside at night.
  const GH: [number, number, number] = [-7.75, -0.03, -3.2]
  const greenhouseGlow = new THREE.PointLight('#ffd9a0', 0, 7, 1.6)
  greenhouseGlow.position.set(GH[0], 1.4, GH[2])
  scene.add(greenhouseGlow)
  const greenhouse = load('greenhouse.glb').then((root) => {
    root.position.set(...GH)
    root.rotation.y = Math.PI / 2
    root.scale.setScalar(M)
    root.traverse((o) => {
      const material = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (!material) return
      if (material.name === 'GreenhouseGlass') {
        material.transparent = true
        material.opacity = 0.32
        material.roughness = 0.05
        material.color.set('#cfe3ea')
        material.side = THREE.DoubleSide
        ;(o as THREE.Mesh).castShadow = false
      }
    })
    scene.add(root)
  }, warn)
  const gardenModels = load('garden.glb').then((root) => outside.useModels(root), warn)
  const interiorVines: VineSpot[] = [{ pos: [-3.72, 2.68, 1.7], scale: 1.1, rotY: 0.8 }]
  const vine = load('vine.glb').then(
    (root) => {
      const base = root.getObjectByName('Vine') ?? root
      for (const spot of [...outside.vineSpots, ...interiorVines]) {
        const v = base.clone()
        v.position.set(...spot.pos)
        v.rotation.y = spot.rotY
        v.scale.setScalar(spot.scale)
        v.userData.rotY = spot.rotY
        scene.add(v)
        vines.push(v)
      }
    },
    warn,
  )
  // Furniture: PC, mug, two bookshelves, arcade cabinet and sofa. Each replaces its simple stand-in.
  const furniture = load('furniture.glb').then(
    (root) => {
      const take = (name: string, parent: THREE.Object3D, x: number, y: number, z: number, rotY: number, scale: number) => {
        const o = root.getObjectByName(name)
        if (!o) return null
        o.position.set(x, y, z)
        o.rotation.y = rotY
        o.scale.setScalar(scale)
        parent.add(o)
        return o
      }
      if (take('PC', gpu, TX, 0, TZ, Math.PI / 2, 2.0)) gpuFallback.removeFromParent()
      if (take('Mug', mug, MUG[0], MUG[1], MUG[2], -0.6, 2.3)) mugFallback.removeFromParent()
      const shelfA = take('Bookshelf', shelf, -3.74, 0, 0.22, Math.PI / 2, 1.4)
      if (shelfA) {
        const shelfB = shelfA.clone()
        shelfB.position.z = 1.38
        shelf.add(shelfB)
        shelfFallback.removeFromParent()
      }
      const cabinet = take('Arcade', arcade, AX, 0, AZ + 0.08, Math.PI / 2, 1.15)
      if (cabinet) arcadeFallback.removeFromParent()
      if (take('Sofa', seating, SOFA[0], SOFA[1], SOFA[2], Math.PI, 1.3) === null) bag.visible = true
      loaded.push(gpu, mug, shelf, arcade, seating) // the models now live in these groups
    },
    (e) => {
      warn(e)
      bag.visible = true
    },
  )
  const ready = Promise.all([setup, monitor, laptop, vine, gaming, plants, greenhouse, gardenModels, furniture]).then(() => {
    draco.dispose()
  })

  // ---------- Lights ----------
  const hemi = new THREE.HemisphereLight('#ffffff', '#b89b7c', 0.6)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#fff1d6', 2.6)
  sun.target.position.set(-3, 0, 0)
  sun.position.set(-11, 8.5, 3) // low enough to come in through the window and the door
  scene.add(sun.target)
  sun.castShadow = true
  const shadowSize = window.innerWidth < 800 ? 2048 : 4096
  sun.shadow.mapSize.set(shadowSize, shadowSize)
  const sc = sun.shadow.camera
  sc.left = sc.bottom = -11
  sc.right = sc.top = 11
  sc.near = 0.5
  sc.far = 40
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.03
  scene.add(sun)
  const fill = new THREE.DirectionalLight('#c9d1ff', 0.5)
  fill.position.set(6, 6, 8)
  scene.add(fill)

  let night = opts.night
  const applyNight = () => {
    scene.background = new THREE.Color(night ? '#0b0d1a' : '#e4e7ec')
    scene.environmentIntensity = night ? 0.07 : 0.5
    hemi.intensity = night ? 0.14 : 0.6
    sun.intensity = night ? 0.3 : 2.6
    sun.color.set(night ? '#8c99ff' : '#fff1d6')
    fill.intensity = night ? 0.12 : 0.5
    lampLight.intensity = night ? 14 : 0
    shadeMat.emissiveIntensity = night ? 1.6 : 0
    gpuLight.intensity = night ? 10 : 5
    monitorGlow.intensity = night ? 5 : 0
    galleryLight.intensity = night ? 7 : 0
    greenhouseGlow.intensity = night ? 9 : 0
    railLight.emissiveIntensity = night ? 2.2 : 0
    outside.setNight(night)
  }
  applyNight()

  // ---------- Camera + interaction ----------
  // On tall, narrow screens the overview backs away until the room and garden fit across.
  const viewOf = (id: StopId) => {
    const look = new THREE.Vector3(...VIEWS[id].look)
    const pos = new THREE.Vector3(...VIEWS[id].pos)
    if (id === 'overview') {
      const across = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect
      pos.sub(look).multiplyScalar(THREE.MathUtils.clamp(0.55 / across, 1, 2.3)).add(look)
    }
    return { pos, look }
  }
  const camPos = new THREE.Vector3(...VIEWS.overview.pos)
  const camLook = new THREE.Vector3(...VIEWS.overview.look)
  let fromPos = camPos.clone()
  let fromLook = camLook.clone()
  let toPos = camPos.clone()
  let toLook = camLook.clone()
  let flyT = 1
  let current: StopId = 'overview'
  const FLY = 1.4

  // Drag to turn the room (or the thing you are looking at) all the way round; pinch or ctrl + wheel to zoom.
  // A plain wheel is left to the page, which uses it to move through the tour.
  const controls = new OrbitControls(camera, canvas)
  controls.target.copy(camLook)
  controls.enableDamping = !opts.reduced
  controls.dampingFactor = 0.08
  controls.rotateSpeed = 0.7
  controls.enablePan = false
  controls.minDistance = 1.2
  controls.maxDistance = 34
  controls.minPolarAngle = 0.15
  controls.maxPolarAngle = 1.48 // never below the floor
  controls.autoRotate = !opts.reduced // the room turns slowly on its own until someone takes over
  controls.autoRotateSpeed = 0.45
  let userMoved = false
  const onControlsStart = () => {
    userMoved = true
    controls.autoRotate = false
    if (flyT < 1) {
      // Grabbing mid-flight stops the flight where it is.
      flyT = 1
      controls.target.copy(camLook)
    }
  }
  controls.addEventListener('start', onControlsStart)
  // Runs before the controls see the wheel: only ctrl + wheel (a trackpad pinch) zooms; touch pinch always can.
  const onZoomWheel = (e: WheelEvent) => (controls.enableZoom = e.ctrlKey)
  const onZoomDown = () => (controls.enableZoom = true)
  canvas.addEventListener('pointerdown', onZoomDown, { capture: true })
  canvas.addEventListener('wheel', onZoomWheel, { capture: true })

  const focus = (id: StopId) => {
    fromPos = camPos.clone()
    fromLook = camLook.clone()
    current = id
    const view = viewOf(id)
    toPos = view.pos
    toLook = view.look
    flyT = opts.reduced ? 1 : 0
    userMoved = false
    controls.autoRotate = false
    // Close up, the camera stays near the thing; the whole room can be seen from further out.
    controls.minDistance = id === 'overview' ? 4 : 0.8
    controls.maxDistance = id === 'overview' ? 34 : Math.max(4, toPos.distanceTo(toLook) * 2.2)
    // The door swings wide when you head for the garden.
    doorTarget = id === 'door' || id === 'garden' ? DOOR_OPEN : DOOR_AJAR
    if (opts.reduced) {
      camPos.copy(toPos)
      camLook.copy(toLook)
      camera.position.copy(camPos)
      controls.target.copy(camLook)
      doorAngle = doorTarget
    }
  }

  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Narrow screens: widen the view so the whole room fits.
    camera.fov = w / h < 1 ? 58 : 38
    camera.updateProjectionMatrix()
    // Keep the overview framed when the window changes shape.
    if (current === 'overview' && flyT >= 1 && !userMoved) {
      camPos.copy(viewOf('overview').pos)
      toPos.copy(camPos)
      camera.position.copy(camPos)
    }
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)

  const ray = new THREE.Raycaster()
  const pickable = [...groups.values(), ...occluders]
  const ndc = new THREE.Vector2()
  let hovered: StopId | null = null
  const pick = (e: PointerEvent): StopId | null => {
    const r = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    // Nearest thing wins: a wall or the floor in front means nothing is picked.
    // (Walls hidden while looking from outside don't count.)
    const hit = ray.intersectObjects(pickable, true).find((h) => h.object.visible || !occluders.includes(h.object))
    let o: THREE.Object3D | null = hit ? hit.object : null
    while (o && !o.userData.id) o = o.parent
    return o && o.visible ? (o.userData.id as StopId) : null
  }
  const onMove = (e: PointerEvent) => {
    const id = pick(e)
    if (id !== hovered) {
      hovered = id
      canvas.style.cursor = id ? 'pointer' : 'default'
      ev.onHover(id)
    }
  }
  let downAt = { x: 0, y: 0 }
  const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY })
  const onUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return
    const id = pick(e)
    if (id) {
      pop.set(id, 1)
      ev.onSelect(id)
    }
  }
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointerup', onUp)


  const pop = new Map<StopId, number>()
  const hoverScale = new Map<StopId, number>()
  // Big, fixed things (the garden, the window, the door) only nudge on hover; they don't bounce.
  const still = new Set<StopId>(['garden', 'window', 'door', 'gallery'])
  let last = performance.now()
  let raf = 0
  const ledColor = new THREE.Color()

  const loop = () => {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const t = now / 1000

    // Camera flight: eased, with a slight upward arc mid-flight.
    if (flyT < 1) {
      flyT = Math.min(1, flyT + dt / FLY)
      const e = easeInOut(flyT)
      camPos.lerpVectors(fromPos, toPos, e)
      camPos.y += Math.sin(e * Math.PI) * 0.8
      camLook.lerpVectors(fromLook, toLook, e)
    }
    const k = 1 - Math.pow(0.05, dt)
    if (flyT < 1) {
      camera.position.copy(camPos)
      controls.target.copy(camLook)
      camera.lookAt(camLook)
    } else {
      controls.update(dt)
      camPos.copy(camera.position)
      camLook.copy(controls.target)
    }
    // Seen from outside, the wall in the way steps aside so the room stays visible.
    const fromFront = camera.position.z > -10
    backWall.visible = poster.visible = gallery.visible = rail.visible = fromFront
    sideWall.forEach((w) => (w.visible = camera.position.x > -10 || current === 'garden'))

    // Door eases towards open or ajar.
    doorAngle += (doorTarget - doorAngle) * (1 - Math.pow(0.02, dt))
    leaf.rotation.y = doorAngle

    // Hover lift and click squash (squash and stretch, follow-through).
    for (const [id, g] of groups) {
      if (still.has(id)) continue
      const target = hovered === id ? 1 : 0
      const h = (hoverScale.get(id) ?? 0) + (target - (hoverScale.get(id) ?? 0)) * k * 1.5
      hoverScale.set(id, h)
      let p = pop.get(id) ?? 0
      if (p > 0) {
        p = Math.max(0, p - dt * 2.5)
        pop.set(id, p)
      }
      const squash = Math.sin(p * Math.PI * 2) * p * 0.06
      g.position.y = h * 0.05
      g.scale.set(1 + squash, 1 - squash, 1 + squash)
    }

    if (!opts.reduced) {
      // Steam
      for (let i = 0; i < STEAM; i++) {
        const life = (t * 0.4 + i / STEAM) % 1
        steamPos[i * 3] = MUG[0] + Math.sin(life * 6 + i) * 0.04 * (1 + life)
        steamPos[i * 3 + 1] = MUG[1] + 0.25 + life * 0.6
        steamPos[i * 3 + 2] = MUG[2] + Math.cos(life * 5 + i) * 0.04
      }
      steamGeo.attributes.position.needsUpdate = true
      // LEDs breathe
      ledMat.color.copy(ledColor.setHSL(0.64, 0.9, 0.58 + 0.14 * Math.sin(t * 2.4)))
      // Leaves and vines sway
      swaying.forEach((p, i) => (p.rotation.z = Math.sin(t * 1.1 + i * 2) * 0.012))
      vines.forEach((v, i) => {
        v.rotation.x = Math.sin(t * 0.9 + i * 1.7) * 0.025
        v.rotation.z = Math.cos(t * 0.7 + i) * 0.025
      })
      outside.update(t)
    }

    renderer.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  const onVis = () => {
    cancelAnimationFrame(raf)
    if (!document.hidden) {
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
  }
  document.addEventListener('visibilitychange', onVis)

  return {
    scene,
    ready,
    focus,
    setNight(n) {
      night = n
      applyNight()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      controls.removeEventListener('start', onControlsStart)
      canvas.removeEventListener('wheel', onZoomWheel, { capture: true })
      canvas.removeEventListener('pointerdown', onZoomDown, { capture: true })
      controls.dispose()
      document.removeEventListener('visibilitychange', onVis)
      loaded.forEach(disposeTree)
      disposeTree(chair) // moved out of its model, so not covered above
      kit.dispose()
      envTarget.dispose()
      envScene.dispose()
      renderer.dispose()
    },
  }
}

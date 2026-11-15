import * as THREE from 'three'

export type StopId = 'overview' | 'desk' | 'gpu' | 'phone' | 'poster' | 'shelf' | 'plant' | 'arcade' | 'window' | 'mug'

export interface RoomEvents {
  onHover: (id: StopId | null) => void
  onSelect: (id: StopId) => void
}

export interface RoomHandle {
  focus: (id: StopId) => void
  setNight: (night: boolean) => void
  dispose: () => void
}

// Camera framing for each stop: where the camera sits and what it looks at.
const VIEWS: Record<StopId, { pos: [number, number, number]; look: [number, number, number] }> = {
  overview: { pos: [9.5, 8.2, 9.5], look: [-0.4, 1.3, -0.4] },
  desk: { pos: [0.3, 2.55, -0.9], look: [0.2, 1.7, -3.5] },
  gpu: { pos: [2.6, 1.3, -0.2], look: [1.4, 0.6, -3.1] },
  phone: { pos: [-0.6, 2.05, -1.6], look: [-1.0, 1.15, -3.0] },
  poster: { pos: [2.5, 3.0, 0.6], look: [2.4, 2.9, -3.9] },
  shelf: { pos: [0.4, 2.5, 1.6], look: [-3.8, 1.9, 0.6] },
  plant: { pos: [-0.9, 1.9, -0.7], look: [-3.0, 1.0, -3.0] },
  arcade: { pos: [3.1, 1.95, -1.1], look: [3.3, 1.35, -3.5] },
  window: { pos: [0.6, 2.6, 0.8], look: [-3.9, 2.6, -1.6] },
  mug: { pos: [1.0, 1.85, -1.6], look: [0.95, 1.15, -2.7] },
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function mountRoom(canvas: HTMLCanvasElement, ev: RoomEvents, opts: { reduced: boolean; night: boolean }): RoomHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  const disposables: { dispose: () => void }[] = []
  const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra })
    disposables.push(m)
    return m
  }
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) => {
    const g = new THREE.BoxGeometry(w, h, d)
    disposables.push(g)
    const mesh = new THREE.Mesh(g, m)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }

  // Interactive groups
  const groups = new Map<StopId, THREE.Group>()
  const group = (id: StopId) => {
    const g = new THREE.Group()
    g.userData.id = id
    scene.add(g)
    groups.set(id, g)
    return g
  }

  // ---------- Room shell ----------
  const floorMat = mat('#c9a27e', { roughness: 0.9 })
  const wallMat = mat('#e9e4f2', { roughness: 0.95 })
  const accentWall = mat('#2f45ff', { roughness: 0.9 })
  box(8, 0.2, 8, floorMat, 0, -0.1, 0)
  box(8, 5, 0.2, wallMat, 0, 2.5, -4.1)
  box(0.2, 5, 8, accentWall, -4.1, 2.5, 0)
  // Skirting
  box(8, 0.18, 0.06, mat('#ffffff'), 0, 0.09, -3.98)
  box(0.06, 0.18, 8, mat('#ffffff'), -3.98, 0.09, 0)
  // Rug
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.03, 48), mat('#ff9a6b', { roughness: 1 }))
  rug.position.set(0.6, 0.02, 0.2)
  rug.receiveShadow = true
  scene.add(rug)
  disposables.push(rug.geometry)

  // ---------- Desk + monitor ----------
  const wood = mat('#8b5e3c')
  const dark = mat('#1d1f2b', { roughness: 0.5 })
  const desk = group('desk')
  box(3.4, 0.1, 1.3, wood, 0.2, 1.05, -3.25, desk)
  for (const [x, z] of [[-1.4, -3.8], [1.8, -3.8], [-1.4, -2.7], [1.8, -2.7]]) box(0.08, 1.0, 0.08, dark, x, 0.5, z, desk)
  // Monitor
  const screenTex = canvasTexture(512, 300, (x) => {
    const g = x.createLinearGradient(0, 0, 512, 300)
    g.addColorStop(0, '#0c0f14')
    g.addColorStop(1, '#1b2050')
    x.fillStyle = g
    x.fillRect(0, 0, 512, 300)
    x.fillStyle = '#e4e7ec'
    x.font = '700 44px system-ui, sans-serif'
    x.fillText('Selected work', 28, 70)
    x.font = '500 22px system-ui, sans-serif'
    const items = ['Unhaze', 'Protein ML pipelines', 'Interaction analysis app', 'IndiskaAI website', 'Skin lesion classifier']
    items.forEach((t, i) => {
      x.fillStyle = i === 0 ? '#8c99ff' : 'rgba(228,231,236,.8)'
      x.fillText('›  ' + t, 32, 120 + i * 34)
    })
  })
  disposables.push(screenTex)
  box(1.7, 1.0, 0.07, dark, 0.2, 1.95, -3.55, desk)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 0.9), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }))
  screen.position.set(0.2, 1.95, -3.51)
  desk.add(screen)
  disposables.push(screen.geometry, screen.material as THREE.Material)
  box(0.12, 0.4, 0.12, dark, 0.2, 1.3, -3.6, desk)
  box(0.6, 0.04, 0.35, dark, 0.2, 1.12, -3.6, desk)
  // Keyboard
  box(1.0, 0.04, 0.32, mat('#f4f4f6'), 0.2, 1.12, -2.95, desk)
  // Chair
  const chair = new THREE.Group()
  scene.add(chair)
  box(0.9, 0.12, 0.9, mat('#0c0f14'), 0.3, 0.75, -1.9, chair)
  box(0.9, 1.0, 0.12, mat('#0c0f14'), 0.3, 1.3, -1.48, chair)
  box(0.08, 0.7, 0.08, dark, 0.3, 0.37, -1.9, chair)

  // ---------- GPU tower (glowing) ----------
  const gpu = group('gpu')
  box(0.6, 1.1, 1.0, mat('#111320', { roughness: 0.4, metalness: 0.3 }), 1.4, 0.55, -3.2, gpu)
  const ledMat = new THREE.MeshBasicMaterial({ color: '#8c99ff', toneMapped: false })
  disposables.push(ledMat)
  const leds: THREE.Mesh[] = []
  for (let i = 0; i < 6; i++) {
    const l = box(0.02, 0.06, 0.7, ledMat, 1.09, 0.25 + i * 0.13, -3.2, gpu)
    l.castShadow = false
    leds.push(l)
  }
  const gpuLight = new THREE.PointLight('#5f6dff', 6, 3, 2)
  gpuLight.position.set(1.0, 0.6, -2.8)
  scene.add(gpuLight)

  // ---------- Phone (Unhaze) ----------
  const phone = group('phone')
  const phoneTex = canvasTexture(180, 360, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 360)
    g.addColorStop(0, '#4f9cf0')
    g.addColorStop(1, '#bfe3ff')
    x.fillStyle = g
    x.fillRect(0, 0, 180, 360)
    x.fillStyle = '#ffffff'
    for (const [cx, cy, r] of [[70, 170, 34], [110, 160, 42], [140, 178, 28]]) {
      x.beginPath()
      x.arc(cx, cy, r, 0, Math.PI * 2)
      x.fill()
    }
    x.fillStyle = '#1d2e5b'
    x.font = '700 26px system-ui, sans-serif'
    x.fillText('Unhaze', 46, 260)
  })
  disposables.push(phoneTex)
  const phoneBody = box(0.3, 0.03, 0.58, dark, -1.0, 1.12, -3.0, phone)
  phoneBody.rotation.y = 0.35
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.54), new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false }))
  phoneScreen.rotation.set(-Math.PI / 2, 0, 0.35)
  phoneScreen.position.set(-1.0, 1.14, -3.0)
  phone.add(phoneScreen)
  disposables.push(phoneScreen.geometry, phoneScreen.material as THREE.Material)

  // ---------- Mug with steam ----------
  const mug = group('mug')
  const mugMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.24, 20), mat('#ff5a36'))
  mugMesh.position.set(0.95, 1.22, -2.75)
  mugMesh.castShadow = true
  mug.add(mugMesh)
  disposables.push(mugMesh.geometry)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 8, 16), mat('#ff5a36'))
  handle.position.set(1.08, 1.22, -2.75)
  handle.rotation.y = Math.PI / 2
  mug.add(handle)
  disposables.push(handle.geometry)
  const steamGeo = new THREE.BufferGeometry()
  const STEAM = 24
  const steamPos = new Float32Array(STEAM * 3)
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3))
  const steam = new THREE.Points(steamGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.06, transparent: true, opacity: 0.55, depthWrite: false }))
  scene.add(steam)
  disposables.push(steamGeo, steam.material as THREE.Material)

  // ---------- Poster (antibody) ----------
  const poster = group('poster')
  const posterTex = canvasTexture(400, 520, (x) => {
    x.fillStyle = '#0c0f14'
    x.fillRect(0, 0, 400, 520)
    x.strokeStyle = '#8c99ff'
    x.lineWidth = 26
    x.lineCap = 'round'
    x.beginPath()
    x.moveTo(200, 420)
    x.lineTo(200, 270)
    x.lineTo(110, 130)
    x.moveTo(200, 270)
    x.lineTo(290, 130)
    x.stroke()
    x.strokeStyle = '#ff9a6b'
    x.beginPath()
    x.moveTo(170, 255)
    x.lineTo(85, 150)
    x.moveTo(230, 255)
    x.lineTo(315, 150)
    x.stroke()
    x.fillStyle = '#e4e7ec'
    x.font = '700 34px system-ui, sans-serif'
    x.fillText('ANTIBODY', 118, 480)
  })
  disposables.push(posterTex)
  box(1.3, 1.7, 0.05, mat('#ffffff'), 2.4, 2.9, -3.98, poster)
  const posterArt = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 1.56), new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.6 }))
  posterArt.position.set(2.4, 2.9, -3.95)
  poster.add(posterArt)
  disposables.push(posterArt.geometry, posterArt.material as THREE.Material)

  // ---------- Bookshelf + diploma ----------
  const shelf = group('shelf')
  const shelfMat = mat('#f2efe9')
  box(0.05, 3.0, 2.2, shelfMat, -3.97, 1.5, 0.8, shelf) // back
  box(0.45, 3.0, 0.06, shelfMat, -3.75, 1.5, -0.3, shelf) // sides
  box(0.45, 3.0, 0.06, shelfMat, -3.75, 1.5, 1.9, shelf)
  box(0.45, 0.06, 2.2, shelfMat, -3.75, 2.97, 0.8, shelf) // top
  box(0.45, 0.12, 2.2, shelfMat, -3.75, 0.06, 0.8, shelf) // plinth
  const bookColors = ['#2f45ff', '#ff9a6b', '#0c0f14', '#ffd29a', '#8c99ff', '#ff5a36', '#00a36c']
  for (let s = 0; s < 3; s++) {
    box(0.42, 0.04, 2.1, wood, -3.73, 0.55 + s * 0.85, 0.8, shelf)
    let z = -0.2
    let k = s * 3
    while (z < 1.75) {
      const w = 0.09 + ((k * 37) % 7) / 60
      const h = 0.5 + ((k * 13) % 5) / 20
      box(0.3, h, w, mat(bookColors[k % bookColors.length]), -3.7, 0.57 + s * 0.85 + h / 2, z + w / 2, shelf)
      z += w + 0.015
      k++
    }
  }
  // Diploma on the wall above
  box(0.04, 0.6, 0.8, mat('#ffffff'), -3.98, 3.55, 0.8, shelf)
  box(0.03, 0.46, 0.66, mat('#2f45ff'), -3.96, 3.55, 0.8, shelf)

  // ---------- Window (Pune) ----------
  const win = group('window')
  const skyDay = canvasTexture(256, 256, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#79b8ff')
    g.addColorStop(1, '#ffe2c4')
    x.fillStyle = g
    x.fillRect(0, 0, 256, 256)
    x.fillStyle = '#ffd66b'
    x.beginPath()
    x.arc(180, 70, 28, 0, Math.PI * 2)
    x.fill()
    x.fillStyle = '#6b7aa8'
    for (let i = 0; i < 9; i++) x.fillRect(i * 30, 180 - ((i * 47) % 60), 24, 120)
  })
  const skyNight = canvasTexture(256, 256, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#0b0d1a')
    g.addColorStop(1, '#2a1f5c')
    x.fillStyle = g
    x.fillRect(0, 0, 256, 256)
    x.fillStyle = '#ffffff'
    for (let i = 0; i < 40; i++) x.fillRect((i * 97) % 256, (i * 53) % 150, 2, 2)
    x.beginPath()
    x.arc(70, 60, 18, 0, Math.PI * 2)
    x.fill()
    for (let i = 0; i < 9; i++) {
      x.fillStyle = '#151830'
      x.fillRect(i * 30, 180 - ((i * 47) % 60), 24, 120)
      x.fillStyle = '#ffd29a'
      for (let j = 0; j < 4; j++) if ((i + j) % 3 === 0) x.fillRect(i * 30 + 6, 200 - ((i * 47) % 60) + j * 18, 5, 6)
    }
  })
  disposables.push(skyDay, skyNight)
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.6), new THREE.MeshBasicMaterial({ map: skyDay, toneMapped: false }))
  sky.rotation.y = Math.PI / 2
  sky.position.set(-3.98, 2.7, -1.7)
  win.add(sky)
  disposables.push(sky.geometry, sky.material as THREE.Material)
  const frame = mat('#ffffff')
  box(0.08, 1.75, 0.08, frame, -3.95, 2.7, -2.62, win)
  box(0.08, 1.75, 0.08, frame, -3.95, 2.7, -0.78, win)
  box(0.08, 0.08, 1.9, frame, -3.95, 3.55, -1.7, win)
  box(0.08, 0.08, 1.9, frame, -3.95, 1.85, -1.7, win)
  box(0.06, 1.6, 0.05, frame, -3.95, 2.7, -1.7, win)
  box(0.25, 0.06, 2.0, frame, -3.88, 1.8, -1.7, win)

  // ---------- Plant ----------
  const plant = group('plant')
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.7, 16), mat('#e8735a'))
  pot.position.set(-3.1, 0.35, -3.1)
  pot.castShadow = pot.receiveShadow = true
  plant.add(pot)
  disposables.push(pot.geometry)
  const leafMat = mat('#00a36c', { flatShading: true })
  const leaves: THREE.Mesh[] = []
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.3, 4), leafMat)
    const a = (i / 9) * Math.PI * 2
    leaf.position.set(-3.1 + Math.cos(a) * 0.15, 1.3, -3.1 + Math.sin(a) * 0.15)
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5)
    leaf.castShadow = true
    leaf.userData.base = leaf.rotation.clone()
    plant.add(leaf)
    leaves.push(leaf)
    disposables.push(leaf.geometry)
  }

  // ---------- Arcade cabinet (to /play) ----------
  const arcade = group('arcade')
  const arcadeTex = canvasTexture(200, 160, (x) => {
    x.fillStyle = '#0b0d1a'
    x.fillRect(0, 0, 200, 160)
    const g = x.createRadialGradient(100, 110, 5, 100, 110, 90)
    g.addColorStop(0, '#2f45ff')
    g.addColorStop(1, '#0b0d1a')
    x.fillStyle = g
    x.fillRect(0, 60, 200, 100)
    x.fillStyle = '#ffffff'
    x.beginPath()
    x.arc(70, 100, 9, 0, Math.PI * 2)
    x.fill()
    x.fillStyle = '#ffd29a'
    x.fillRect(130, 80, 10, 10)
    x.fillStyle = '#e4e7ec'
    x.font = '700 20px system-ui, sans-serif'
    x.fillText('FIND THE', 52, 34)
    x.fillText('MINIMUM', 54, 56)
  })
  disposables.push(arcadeTex)
  const cab = mat('#2f45ff')
  const AX = 3.3
  const AZ = -3.45
  box(0.9, 1.9, 0.8, cab, AX, 0.95, AZ, arcade)
  box(0.94, 0.12, 0.84, mat('#0c0f14'), AX, 1.96, AZ, arcade)
  const marqueeMat = new THREE.MeshBasicMaterial({ color: '#ffd29a', toneMapped: false })
  disposables.push(marqueeMat)
  box(0.86, 0.22, 0.06, marqueeMat, AX, 1.82, AZ + 0.42, arcade).castShadow = false
  const arcScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.52), new THREE.MeshBasicMaterial({ map: arcadeTex, toneMapped: false }))
  arcScreen.position.set(AX, 1.4, AZ + 0.41)
  arcade.add(arcScreen)
  disposables.push(arcScreen.geometry, arcScreen.material as THREE.Material)
  const panel = box(0.9, 0.08, 0.36, mat('#0c0f14'), AX, 1.02, AZ + 0.52, arcade)
  panel.rotation.x = 0.35
  const btnMat = mat('#ff5a36')
  for (const dx of [-0.2, 0.05, 0.22]) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), btnMat)
    btn.position.set(AX + dx, 1.08, AZ + 0.55)
    arcade.add(btn)
    disposables.push(btn.geometry)
  }
  const arcadeLight = new THREE.PointLight('#5f6dff', 3, 2.5, 2)
  arcadeLight.position.set(AX, 1.4, AZ + 0.9)
  scene.add(arcadeLight)

  // ---------- Lamp ----------
  const lampMat = mat('#0c0f14')
  box(0.06, 1.8, 0.06, lampMat, -2.9, 0.9, -0.5)
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#ffd29a', emissive: '#ffb27a', emissiveIntensity: 0 })
  disposables.push(shadeMat)
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.4, 20, 1, true), shadeMat)
  shade.position.set(-2.9, 1.95, -0.5)
  scene.add(shade)
  disposables.push(shade.geometry)
  const lampLight = new THREE.PointLight('#ffb27a', 0, 7, 1.6)
  lampLight.position.set(-2.9, 1.8, -0.5)
  lampLight.castShadow = true
  scene.add(lampLight)

  // ---------- Lights ----------
  const hemi = new THREE.HemisphereLight('#ffffff', '#c9a27e', 0.9)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#fff1d6', 2.4)
  sun.position.set(-8, 7, -2) // through the window
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  const sc = sun.shadow.camera as THREE.OrthographicCamera
  sc.left = sc.bottom = -7
  sc.right = sc.top = 7
  sun.shadow.bias = -0.0005
  scene.add(sun)
  const fill = new THREE.DirectionalLight('#c9d1ff', 0.6)
  fill.position.set(6, 6, 8)
  scene.add(fill)

  let night = opts.night
  const applyNight = () => {
    scene.background = new THREE.Color(night ? '#0b0d1a' : '#e4e7ec')
    ;(sky.material as THREE.MeshBasicMaterial).map = night ? skyNight : skyDay
    ;(sky.material as THREE.MeshBasicMaterial).needsUpdate = true
    hemi.intensity = night ? 0.18 : 0.9
    sun.intensity = night ? 0.25 : 2.4
    sun.color.set(night ? '#8c99ff' : '#fff1d6')
    fill.intensity = night ? 0.15 : 0.6
    lampLight.intensity = night ? 14 : 0
    shadeMat.emissiveIntensity = night ? 1.6 : 0
    gpuLight.intensity = night ? 10 : 5
  }
  applyNight()

  // ---------- Camera + interaction ----------
  const camPos = new THREE.Vector3(...VIEWS.overview.pos)
  const camLook = new THREE.Vector3(...VIEWS.overview.look)
  let fromPos = camPos.clone()
  let fromLook = camLook.clone()
  let toPos = camPos.clone()
  let toLook = camLook.clone()
  let flyT = 1
  const FLY = 1.4

  const focus = (id: StopId) => {
    fromPos = camPos.clone()
    fromLook = camLook.clone()
    toPos = new THREE.Vector3(...VIEWS[id].pos)
    toLook = new THREE.Vector3(...VIEWS[id].look)
    flyT = opts.reduced ? 1 : 0
    if (opts.reduced) {
      camPos.copy(toPos)
      camLook.copy(toLook)
    }
  }

  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Narrow screens: widen the view so the whole room fits.
    camera.fov = w / h < 1 ? 55 : 38
    camera.updateProjectionMatrix()
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)

  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  let hovered: StopId | null = null
  const pick = (e: PointerEvent): StopId | null => {
    const r = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const hits = ray.intersectObjects([...groups.values()], true)
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object
      while (o && !o.userData.id) o = o.parent
      if (o) return o.userData.id as StopId
    }
    return null
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

  // Gentle parallax with the pointer while in overview.
  const sway = { x: 0, y: 0 }
  const onWinMove = (e: PointerEvent) => {
    sway.x = (e.clientX / window.innerWidth) * 2 - 1
    sway.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onWinMove, { passive: true })

  const pop = new Map<StopId, number>()
  const hoverScale = new Map<StopId, number>()
  let last = performance.now()
  let raf = 0
  const swayEase = { x: 0, y: 0 }

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
    swayEase.x += (sway.x - swayEase.x) * k
    swayEase.y += (sway.y - swayEase.y) * k
    camera.position.set(camPos.x + (opts.reduced ? 0 : swayEase.x * 0.25), camPos.y - (opts.reduced ? 0 : swayEase.y * 0.15), camPos.z - (opts.reduced ? 0 : swayEase.x * 0.25))
    camera.lookAt(camLook)

    // Hover lift and click squash (squash and stretch, follow-through).
    for (const [id, g] of groups) {
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
        steamPos[i * 3] = 0.95 + Math.sin(life * 6 + i) * 0.04 * (1 + life)
        steamPos[i * 3 + 1] = 1.36 + life * 0.6
        steamPos[i * 3 + 2] = -2.75 + Math.cos(life * 5 + i) * 0.04
      }
      steamGeo.attributes.position.needsUpdate = true
      ;(steam.material as THREE.PointsMaterial).opacity = 0.45
      // LEDs breathe
      leds.forEach((l, i) => ((l.material as THREE.MeshBasicMaterial).color.setHSL(0.64, 0.9, 0.55 + 0.2 * Math.sin(t * 3 + i * 0.6))))
      // Leaves sway
      leaves.forEach((leaf, i) => {
        const b = leaf.userData.base as THREE.Euler
        leaf.rotation.x = b.x + Math.sin(t * 1.3 + i) * 0.04
        leaf.rotation.z = b.z + Math.cos(t * 1.1 + i) * 0.04
      })
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
    focus,
    setNight(n) {
      night = n
      applyNight()
    },
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointermove', onWinMove)
      document.removeEventListener('visibilitychange', onVis)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
    },
  }
}

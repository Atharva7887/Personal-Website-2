import * as THREE from 'three'

export interface Orb {
  id: string
  label: string
  x: number
  z: number
}

export interface Hud {
  /** Seconds left on the clock. */
  left: number
  score: number
  combo: number
  /** 0 to 1: how much of the streak window is left. */
  comboLeft: number
  /** 0 to 1: how recharged the boost is (1 is ready). */
  boost: number
  boosting: boolean
  /** Gradient noise, in the same units as the push of the ball. */
  noise: number
}

export interface WorldEvents {
  onCollect: (id: string, info: { collected: number; combo: number; points: number; bonus: number }) => void
  onUnlock: () => void
  onWin: (r: { score: number; bonus: number; left: number; seconds: number }) => void
  onLose: (r: { score: number; collected: number }) => void
  onTick: (hud: Hud) => void
  onBump: () => void
  onBoost: () => void
}

export interface WorldHandle {
  setInput: (x: number, z: number) => void
  boost: () => void
  setPaused: (paused: boolean) => void
  restart: () => void
  dispose: () => void
}

// Game rules. The clock is the "budget of epochs": start with some, earn more by finding orbs.
const START_TIME = 60
const ORB_TIME = 6
const ORB_POINTS = 100
const WIN_POINTS = 500
const WIN_TIME_POINTS = 25 // per second left
const COMBO_MAX = 6
const BOOST_TIME = 0.9
const BOOST_COOLDOWN = 3.2
const GRACE = 0.8 // the clock waits while the camera settles

const SIZE = 64 // playable area is SIZE x SIZE, centred on the origin
const HALF = SIZE / 2
// The terrain mesh extends well past the walls so its edge never shows.
const MESH = 150
const SEG = 150
const GOAL = { x: 15, z: -12 }

const gauss = (x: number, z: number, cx: number, cz: number, s: number) =>
  Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / s)

/** The loss landscape: a bowl, ridges, ripples, local minima and one deep global minimum. */
export function height(x: number, z: number): number {
  return (
    0.0042 * (x * x + z * z) * 3 +
    1.1 * Math.sin(x * 0.22) * Math.cos(z * 0.19) +
    2.6 * gauss(x, z, -8, 6, 60) + // hill
    3.2 * gauss(x, z, 4, -2, 40) + // ridge between start and goal
    2.0 * gauss(x, z, 18, 10, 50) +
    -2.4 * gauss(x, z, -15, -12, 30) + // local minimum (a trap)
    -2.0 * gauss(x, z, -14, 16, 26) + // another trap
    -6.5 * gauss(x, z, GOAL.x, GOAL.z, 22) // global minimum
  )
}

function grad(x: number, z: number) {
  const h = 0.05
  return {
    x: (height(x + h, z) - height(x - h, z)) / (2 * h),
    z: (height(x, z + h) - height(x, z - h)) / (2 * h),
  }
}

export function mountWorld(canvas: HTMLCanvasElement, orbs: Orb[], ev: WorldEvents, opts: { reduced: boolean }): WorldHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  const scene = new THREE.Scene()
  const bg = new THREE.Color('#0b0d1a')
  scene.background = bg
  scene.fog = new THREE.Fog(bg, 30, 75)

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200)

  // Lights
  scene.add(new THREE.HemisphereLight('#7f8cff', '#0a0618', 0.55))
  const sun = new THREE.DirectionalLight('#ffd9a8', 3.4)
  sun.position.set(-20, 30, 12)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  const sc = sun.shadow.camera as THREE.OrthographicCamera
  sc.left = sc.bottom = -40
  sc.right = sc.top = 40
  scene.add(sun)

  // Terrain: flat-shaded, coloured by height (low = electric blue, high = warm).
  const geo = new THREE.PlaneGeometry(MESH, MESH, SEG, SEG)
  geo.rotateX(-Math.PI / 2)
  const p = geo.attributes.position
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < p.count; i++) {
    const y = height(p.getX(i), p.getZ(i))
    p.setY(i, y)
    min = Math.min(min, y)
    max = Math.max(max, y)
  }
  let playMax = -Infinity
  for (let x = -HALF; x <= HALF; x += 2) for (let z = -HALF; z <= HALF; z += 2) playMax = Math.max(playMax, height(x, z))
  const low = new THREE.Color('#1a2a9e')
  const mid = new THREE.Color('#5b3fc4')
  const high = new THREE.Color('#e8735a')
  const top = new THREE.Color('#ffd2a6')
  const colors = new Float32Array(p.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, (p.getY(i) - min) / (playMax - min))
    if (t < 0.35) c.copy(low).lerp(mid, t / 0.35)
    else if (t < 0.75) c.copy(mid).lerp(high, (t - 0.35) / 0.4)
    else c.copy(high).lerp(top, (t - 0.75) / 0.25)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const terrainGeo = geo.toNonIndexed()
  terrainGeo.computeVertexNormals()
  const terrain = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85, metalness: 0 }),
  )
  terrain.receiveShadow = true
  scene.add(terrain)

  // Contour lines: the "loss landscape" reading.
  const contourMat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.12 })
  for (let k = 1; k < 14; k++) {
    const level = min + ((max - min) * k) / 14
    const pts: THREE.Vector3[] = []
    const step = SIZE / 90
    for (let x = -HALF; x < HALF; x += step)
      for (let z = -HALF; z < HALF; z += step) {
        const a = height(x, z) - level
        const b = height(x + step, z) - level
        const d = height(x, z + step) - level
        if (a * b < 0) pts.push(new THREE.Vector3(x + (step * a) / (a - b), level + 0.05, z))
        if (a * d < 0) pts.push(new THREE.Vector3(x, level + 0.05, z + (step * a) / (a - d)))
      }
    const g = new THREE.BufferGeometry().setFromPoints(pts)
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 0.09, transparent: true, opacity: 0.35 })))
  }
  contourMat.dispose()

  // Ground grid beyond the terrain edge (Bruno-style floor).
  const grid = new THREE.GridHelper(200, 100, '#3a2f6b', '#221c44')
  grid.position.y = min - 0.5
  scene.add(grid)

  // Low-poly trees and rocks on the slopes, for scale (instanced: one draw call each).
  const props = (() => {
    const rand = (() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647) })()
    const keepOut = [...orbs.map((o) => [o.x, o.z]), [GOAL.x, GOAL.z], [-22, 20]]
    const spots: [number, number, number][] = []
    for (let i = 0; i < 900 && spots.length < 170; i++) {
      const x = (rand() - 0.5) * (SIZE - 4)
      const z = (rand() - 0.5) * (SIZE - 4)
      if (keepOut.some(([a, b]) => (a - x) ** 2 + (b - z) ** 2 < 16)) continue
      const g2 = grad(x, z)
      const slope = Math.hypot(g2.x, g2.z)
      if (slope < 0.25 && rand() < 0.7) continue // mostly on slopes, away from the paths
      spots.push([x, z, 0.6 + rand() * 0.9])
    }
    const treeGeo = new THREE.ConeGeometry(0.6, 1.8, 5)
    treeGeo.translate(0, 0.9, 0)
    const trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ color: '#2a1f5c', flatShading: true, roughness: 0.9 }), spots.length)
    const rockGeo = new THREE.DodecahedronGeometry(0.45, 0)
    const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: '#c9b8ff', flatShading: true, roughness: 0.6 }), spots.length)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    spots.forEach(([x, z, s2], i) => {
      const y = height(x, z)
      const isRock = i % 4 === 0
      q.setFromEuler(new THREE.Euler(0, rand() * Math.PI * 2, 0))
      m.compose(new THREE.Vector3(x, y - 0.05, z), q, new THREE.Vector3(s2, s2 * (isRock ? 0.7 : 1), s2))
      ;(isRock ? rocks : trees).setMatrixAt(i, m)
      ;(isRock ? trees : rocks).setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0))
    })
    trees.castShadow = rocks.castShadow = true
    trees.receiveShadow = rocks.receiveShadow = true
    scene.add(trees, rocks)
    return { trees, rocks }
  })()
  void props

  // Player ball, striped so rolling reads.
  const stripe = document.createElement('canvas')
  stripe.width = 128
  stripe.height = 64
  const sctx = stripe.getContext('2d')!
  sctx.fillStyle = '#ffffff'
  sctx.fillRect(0, 0, 128, 64)
  sctx.fillStyle = '#2f45ff'
  for (let i = 0; i < 8; i += 2) sctx.fillRect(i * 16, 0, 16, 64)
  const ballTex = new THREE.CanvasTexture(stripe)
  ballTex.colorSpace = THREE.SRGBColorSpace
  const R = 0.7
  const ballPivot = new THREE.Group() // handles squash/stretch
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 16),
    new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.35, emissive: '#2f45ff', emissiveIntensity: 0.15 }),
  )
  ball.castShadow = true
  ballPivot.add(ball)
  scene.add(ballPivot)
  const ballLight = new THREE.PointLight('#8c99ff', 18, 9, 2)
  scene.add(ballLight)

  // Trail
  const TRAIL = 60
  const trailPos = new Float32Array(TRAIL * 3)
  const trailGeo = new THREE.BufferGeometry()
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
  const trail = new THREE.Points(
    trailGeo,
    new THREE.PointsMaterial({ color: '#8c99ff', size: 0.28, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  if (!opts.reduced) scene.add(trail)

  // Orbs
  const glowTex = (() => {
    const g = document.createElement('canvas')
    g.width = g.height = 64
    const x = g.getContext('2d')!
    const r = x.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.3, 'rgba(255,200,140,.6)')
    r.addColorStop(1, 'rgba(255,200,140,0)')
    x.fillStyle = r
    x.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(g)
  })()
  const orbObjs = orbs.map((o) => {
    const grp = new THREE.Group()
    const gem = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.MeshStandardMaterial({ color: '#ffd29a', emissive: '#ff9a6b', emissiveIntensity: 1.4, flatShading: true }),
    )
    gem.castShadow = true
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false }))
    glow.scale.set(3.2, 3.2, 1)
    grp.add(gem, glow)
    grp.position.set(o.x, height(o.x, o.z) + 1.6, o.z)
    scene.add(grp)
    return { o, grp, gem, taken: false, pop: 0 }
  })

  // Goal: a ring of light at the global minimum, dim until unlocked.
  const goalY = height(GOAL.x, GOAL.z)
  const goal = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.12, 12, 48),
    new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#8c99ff', emissiveIntensity: 0.2 }),
  )
  goal.rotation.x = Math.PI / 2
  goal.position.set(GOAL.x, goalY + 0.25, GOAL.z)
  scene.add(goal)
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 40, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: '#8c99ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }),
  )
  beam.position.set(GOAL.x, goalY + 20, GOAL.z)
  scene.add(beam)

  // Burst particles on pickup
  // Fewer sparks under reduced motion; the pickup is still clear from the orb vanishing and the card.
  const BURST = opts.reduced ? 28 : 140
  const burstPos = new Float32Array(BURST * 3)
  const burstVel = new Float32Array(BURST * 3)
  const burstGeo = new THREE.BufferGeometry()
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3))
  const burst = new THREE.Points(
    burstGeo,
    new THREE.PointsMaterial({ color: '#ffd29a', size: 0.25, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  scene.add(burst)
  let burstLife = 0
  const burstMat = burst.material as THREE.PointsMaterial
  const fireBurst = (x: number, y: number, z: number, power = 1) => {
    // A longer streak throws bigger, whiter sparks.
    burstMat.size = 0.25 + power * 0.04
    burstMat.color.set('#ffd29a').lerp(new THREE.Color('#ffffff'), Math.min(1, (power - 1) / 5))
    for (let i = 0; i < BURST; i++) {
      burstPos.set([x, y, z], i * 3)
      const a = Math.random() * Math.PI * 2
      const u = Math.random() * 2 - 1
      const s = Math.sqrt(1 - u * u)
      const sp = (4 + Math.random() * 5) * (0.9 + power * 0.1)
      burstVel.set([Math.cos(a) * s * sp, Math.abs(u) * sp + 2, Math.sin(a) * s * sp], i * 3)
    }
    burstLife = 1
    if (!opts.reduced) {
      ring.position.set(x, y - 0.6, z)
      ringLife = 1
    }
  }
  // The shockwave: a flat ring that races outwards from a pickup.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 1, 48),
    new THREE.MeshBasicMaterial({ color: '#ffd29a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }),
  )
  ring.rotation.x = -Math.PI / 2
  scene.add(ring)
  let ringLife = 0

  // State
  const START = { x: -22, z: 20 }
  const pos = new THREE.Vector3()
  const vel = new THREE.Vector3()
  const input = new THREE.Vector2()
  let collected = 0
  let unlocked = false
  let won = false
  let lost = false
  let paused = false
  let elapsed = 0
  let timeLeft = START_TIME
  let score = 0
  let combo = 0
  let comboTimer = 0
  let boostT = 0 // seconds of boost left
  let boostCd = 0 // seconds until the next boost
  let grace = GRACE
  let shake = 0
  let bumpCd = 0
  let lastHud = 0
  const gust = new THREE.Vector2()
  const gustTarget = new THREE.Vector2()
  let gustT = 0
  let squash = 0
  const roll = new THREE.Quaternion()

  const reset = () => {
    pos.set(START.x, height(START.x, START.z) + R, START.z)
    vel.set(0, 0, 0)
    collected = 0
    unlocked = false
    won = false
    lost = false
    elapsed = 0
    timeLeft = START_TIME
    score = 0
    combo = 0
    comboTimer = 0
    boostT = 0
    boostCd = 0
    grace = GRACE
    shake = 0
    gust.set(0, 0)
    orbObjs.forEach((ob) => {
      ob.taken = false
      ob.grp.visible = true
      ob.grp.scale.setScalar(1)
    })
    ;(goal.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2
    ;(beam.material as THREE.MeshBasicMaterial).opacity = 0
    for (let i = 0; i < TRAIL; i++) trailPos.set([pos.x, pos.y, pos.z], i * 3)
    camPos.set(pos.x - 11, pos.y + 10.5, pos.z + 13)
  }
  const camPos = new THREE.Vector3()
  const camLook = new THREE.Vector3()
  reset()
  camLook.copy(pos)

  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)

  // Keyboard input (merged with the external touch input)
  const keys = new Set<string>()
  const doBoost = () => {
    if (boostCd > 0 || won || lost || paused || grace > 0) return
    boostT = BOOST_TIME
    boostCd = BOOST_COOLDOWN
    shake = Math.max(shake, 0.3)
    ev.onBoost()
  }
  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      e.preventDefault()
      if (e.type === 'keydown') keys.add(k)
      else keys.delete(k)
    } else if (k === ' ' || k === 'shift') {
      // Space or Shift raises the learning rate. Space only counts on the canvas, so it still presses a focused button.
      if (k === ' ' && document.activeElement !== canvas) return
      if (k === ' ') e.preventDefault()
      if (e.type === 'keydown' && !e.repeat) doBoost()
    }
  }
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKey)
  const blur = () => keys.clear()
  window.addEventListener('blur', blur)

  let last = performance.now()
  let raf = 0

  // The streak window shrinks as the run goes on, and the gradient noise grows: the difficulty curve.
  const comboWindow = () => Math.max(3.5, 7 - 0.4 * collected)
  const noiseAmp = () => collected * 2.2
  const hudNow = (): Hud => ({
    left: Math.max(0, timeLeft),
    score,
    combo,
    comboLeft: combo > 0 ? Math.max(0, comboTimer / comboWindow()) : 0,
    boost: boostCd > 0 ? 1 - boostCd / BOOST_COOLDOWN : 1,
    boosting: boostT > 0,
    noise: noiseAmp(),
  })

  const step = () => {
    const now = performance.now()
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    const t = now / 1000
    const running = !won && !lost

    // Input: camera looks from (-x,+z) toward (+x,-z); map screen up to that direction.
    let ix = input.x
    let iz = input.y
    if (keys.has('w') || keys.has('arrowup')) iz -= 1
    if (keys.has('s') || keys.has('arrowdown')) iz += 1
    if (keys.has('a') || keys.has('arrowleft')) ix -= 1
    if (keys.has('d') || keys.has('arrowright')) ix += 1
    const len = Math.hypot(ix, iz) || 1
    if (len > 1) {
      ix /= len
      iz /= len
    }
    const fx = (ix + -iz) * Math.SQRT1_2 // rotate 45 degrees to match the camera
    const fz = (iz + ix) * Math.SQRT1_2

    // Boost: a higher learning rate. Bigger steps and far less friction, so you carry momentum and overshoot.
    boostCd = Math.max(0, boostCd - dt)
    const boostEnv = boostT > 0 ? Math.min(1, boostT / 0.25) : 0
    boostT = Math.max(0, boostT - dt)

    if (running) {
      if (grace > 0) grace -= dt
      else {
        timeLeft -= dt
        elapsed += dt
      }
      comboTimer = Math.max(0, comboTimer - dt)
      if (comboTimer === 0) combo = 0

      // Stochastic gradient noise: a wandering gust, stronger with every orb found.
      gustT -= dt
      if (gustT <= 0) {
        gustT = 0.5 + Math.random() * 0.6
        const a = Math.random() * Math.PI * 2
        gustTarget.set(Math.cos(a), Math.sin(a))
      }
      gust.lerp(gustTarget, 1 - Math.pow(0.1, dt))
      const na = noiseAmp()

      const g = grad(pos.x, pos.z)
      const PUSH = boostT > 0 ? 38 : 20
      const GRAV = 20
      const DAMP = boostT > 0 ? 0.35 : 0.9
      vel.x += (fx * PUSH - g.x * GRAV - vel.x * DAMP + gust.x * na) * dt
      vel.z += (fz * PUSH - g.z * GRAV - vel.z * DAMP + gust.y * na) * dt
      pos.x += vel.x * dt
      pos.z += vel.z * dt
      bumpCd = Math.max(0, bumpCd - dt)
      // Soft walls at the edge of the landscape
      for (const axis of ['x', 'z'] as const) {
        if (Math.abs(pos[axis]) > HALF - 1.5) {
          const hit = Math.abs(vel[axis])
          pos[axis] = Math.sign(pos[axis]) * (HALF - 1.5)
          vel[axis] *= -0.5
          squash = 0.35
          if (hit > 3 && bumpCd === 0) {
            bumpCd = 0.18
            shake = Math.max(shake, Math.min(0.35, hit * 0.03))
            ev.onBump()
          }
        }
      }
      pos.y = height(pos.x, pos.z) + R

      if (timeLeft <= 0) {
        timeLeft = 0
        lost = true
        squash = 0.4
        ev.onLose({ score, collected })
      }
    } else {
      vel.multiplyScalar(0.9)
      pos.x += vel.x * dt
      pos.z += vel.z * dt
      pos.y = height(pos.x, pos.z) + R
    }

    // Rolling rotation: axis perpendicular to velocity on the ground plane.
    const speed = Math.hypot(vel.x, vel.z)
    if (speed > 0.001) {
      const axis = new THREE.Vector3(vel.z, 0, -vel.x).normalize()
      roll.setFromAxisAngle(axis, (speed * dt) / R)
      ball.quaternion.premultiply(roll)
    }

    // Squash and stretch: stretch with speed (more on a boost), squash on impacts, spring back.
    squash *= Math.pow(0.02, dt)
    const stretch = Math.min(0.22, speed * 0.012) + boostEnv * 0.12
    ballPivot.position.copy(pos)
    if (speed > 0.05) {
      ballPivot.lookAt(pos.x + vel.x, pos.y, pos.z + vel.z)
    }
    ballPivot.scale.set(1 - stretch * 0.5 + squash * 0.4, 1 - squash * 0.6, 1 + stretch - squash * 0.2)
    ballPivot.position.y -= squash * 0.3
    ballLight.position.set(pos.x, pos.y + 1.4, pos.z)
    ballLight.intensity = 18 + boostEnv * 30

    // Trail
    if (!opts.reduced) {
      trailPos.copyWithin(3, 0, (TRAIL - 1) * 3)
      trailPos.set([pos.x, pos.y - R * 0.6, pos.z], 0)
      trailGeo.attributes.position.needsUpdate = true
      ;(trail.material as THREE.PointsMaterial).size = 0.28 + boostEnv * 0.3
    }

    // Orbs: bob, spin, collect
    for (const ob of orbObjs) {
      if (ob.taken) {
        if (ob.pop > 0) {
          ob.pop -= dt * 3
          const s = 1 + (1 - ob.pop) * 1.5
          ob.grp.scale.setScalar(Math.max(0, ob.pop) * s)
          ob.grp.position.y += dt * 6
          if (ob.pop <= 0) ob.grp.visible = false
        }
        continue
      }
      const baseY = height(ob.o.x, ob.o.z) + 1.6
      ob.grp.position.y = baseY + (opts.reduced ? 0 : Math.sin(t * 2 + ob.o.x) * 0.3)
      ob.gem.rotation.y += dt * 1.5
      ob.gem.rotation.x += dt * 0.7
      const dx = ob.o.x - pos.x
      const dz = ob.o.z - pos.z
      if (dx * dx + dz * dz < 2.4 * 2.4 && running) {
        ob.taken = true
        ob.pop = 1
        collected++
        // Streak: another orb inside the window keeps it going and the points climb.
        combo = comboTimer > 0 ? Math.min(COMBO_MAX, combo + 1) : 1
        comboTimer = comboWindow()
        const points = ORB_POINTS * combo
        score += points
        timeLeft += ORB_TIME
        squash = 0.25
        shake = Math.max(shake, 0.3 + combo * 0.05)
        fireBurst(ob.grp.position.x, ob.grp.position.y, ob.grp.position.z, combo)
        ev.onCollect(ob.o.id, { collected, combo, points, bonus: ORB_TIME })
        if (collected === orbs.length) {
          unlocked = true
          ev.onUnlock()
        }
      }
    }

    // Goal
    const gm = goal.material as THREE.MeshStandardMaterial
    const bm = beam.material as THREE.MeshBasicMaterial
    if (unlocked) {
      gm.emissiveIntensity += (2.5 - gm.emissiveIntensity) * dt * 2
      bm.opacity += (0.16 - bm.opacity) * dt * 2
      goal.rotation.z += dt
      const d = Math.hypot(pos.x - GOAL.x, pos.z - GOAL.z)
      if (d < 1.8 && running) {
        won = true
        squash = 0.5
        shake = 0.9
        const bonus = WIN_POINTS + Math.floor(timeLeft) * WIN_TIME_POINTS
        score += bonus
        fireBurst(GOAL.x, goalY + 1, GOAL.z, COMBO_MAX)
        ev.onWin({ score, bonus, left: timeLeft, seconds: elapsed })
      }
    }

    // Burst and shockwave
    if (burstLife > 0) {
      burstLife -= dt * 0.8
      for (let i = 0; i < BURST; i++) {
        burstVel[i * 3 + 1] -= 9.8 * dt
        burstPos[i * 3] += burstVel[i * 3] * dt
        burstPos[i * 3 + 1] += burstVel[i * 3 + 1] * dt
        burstPos[i * 3 + 2] += burstVel[i * 3 + 2] * dt
      }
      burstGeo.attributes.position.needsUpdate = true
      burstMat.opacity = Math.max(0, burstLife)
    }
    if (ringLife > 0) {
      ringLife -= dt * 2.2
      const grow = 1 - Math.max(0, ringLife)
      // Ease out, so it leaps out and then slows.
      ring.scale.setScalar(0.5 + (1 - Math.pow(1 - grow, 3)) * 7)
      ;(ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, ringLife) * 0.8
    }

    // Camera: isometric follow with a little look-ahead, eased. A boost widens the field of view.
    const target = new THREE.Vector3(pos.x - 11 + vel.x * 0.3, pos.y + 10.5, pos.z + 13 + vel.z * 0.3)
    const k = opts.reduced ? 1 : 1 - Math.pow(0.02, dt)
    camPos.lerp(target, k)
    camLook.lerp(new THREE.Vector3(pos.x + vel.x * 0.3, pos.y, pos.z + vel.z * 0.3), k)
    camera.position.copy(camPos)
    // Light screen shake: decays fast and never runs under reduced motion.
    shake *= Math.pow(0.004, dt)
    if (!opts.reduced && shake > 0.01) {
      camera.position.x += (Math.random() - 0.5) * shake * 0.7
      camera.position.y += (Math.random() - 0.5) * shake * 0.7
      camera.position.z += (Math.random() - 0.5) * shake * 0.7
    }
    camera.lookAt(camLook)
    const fovTarget = 45 + (opts.reduced ? 0 : boostEnv * 9)
    if (Math.abs(camera.fov - fovTarget) > 0.05) {
      camera.fov += (fovTarget - camera.fov) * Math.min(1, dt * 10)
      camera.updateProjectionMatrix()
    }
    sun.target.position.copy(pos)
    sun.position.set(pos.x - 20, pos.y + 30, pos.z + 12)
    sun.target.updateMatrixWorld()

    // The page's heads-up display updates ten times a second, not every frame.
    if (now - lastHud > 100) {
      lastHud = now
      ev.onTick(hudNow())
    }

    renderer.render(scene, camera)
    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)

  // The page decides when to pause (hidden tab, Escape, the pause card); the loop just stops and restarts cleanly.
  const setPaused = (p: boolean) => {
    if (p === paused) return
    paused = p
    cancelAnimationFrame(raf)
    if (!p) {
      last = performance.now()
      raf = requestAnimationFrame(step)
    }
  }

  // Dev only (stripped from the production build): lets a browser test jump to each ending without playing it out.
  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__minimum = {
      grabAll() {
        orbObjs.forEach((ob, i) => window.setTimeout(() => pos.set(ob.o.x, pos.y, ob.o.z), i * 250))
      },
      toGoal: () => pos.set(GOAL.x, pos.y, GOAL.z),
      expire: () => (timeLeft = 0.05),
    }
  }

  return {
    setInput(x, z) {
      input.set(x, z)
    },
    boost: doBoost,
    setPaused,
    restart() {
      reset()
      ev.onTick(hudNow())
    },
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', blur)
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose?.()
      })
      ballTex.dispose()
      glowTex.dispose()
      renderer.dispose()
    },
  }
}

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Kit } from './kit'
import { canvasTexture, mulberry32 } from './textures'
import { POND, POND_BANK, POND_WATER_Y, pondPoint } from './layout'

// The pond: a sunken basin with a gentle bank, a ring of rocks and pebbles, reeds, lily pads and a few koi.
// The water is one transparent shader (see WATER_FRAG). It does not re-render the scene: room.ts captures a
// cube map from the pond's centre once the models are in, and again whenever day turns to evening, and the
// shader reflects that. Everything here is instanced or one mesh, to keep the draw calls few.

const SEG = 96
const TAU = Math.PI * 2
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** The bed, from the lawn's edge in to the middle: how far out (multiple of the shoreline), how high, what colour. */
const PROFILE: { s: number; y: number; c: string }[] = [
  { s: POND_BANK, y: -0.03, c: '#56603a' }, // the lawn's edge, mossy
  { s: 1.1, y: -0.075, c: '#4b4430' },
  { s: 1.045, y: -0.13, c: '#3a2f23' },
  { s: 1.0, y: POND_WATER_Y, c: '#2d261e' }, // the waterline: wet, dark soil
  { s: 0.93, y: -0.26, c: '#3d3b30' }, // pebbly shelf
  { s: 0.78, y: -0.4, c: '#2b3329' },
  { s: 0.55, y: -0.53, c: '#1c2a26' },
  { s: 0.3, y: -0.58, c: '#14211f' },
]
/** The shelf is wider in some places than others, so the depth does not follow the outline like a contour. */
const shelf = (theta: number) => 0.8 + 0.5 * (0.5 + 0.5 * Math.sin(2 * theta + 0.7)) * (0.5 + 0.5 * Math.sin(5 * theta))
const ringScale = (s: number, theta: number) => (s >= 1 ? s : 1 - (1 - s) * shelf(theta))

/** The bed's height at direction theta and (shelf-adjusted) distance s from the centre. */
function bedHeight(theta: number, s: number) {
  const w = shelf(theta)
  const s0 = s >= 1 ? s : 1 - (1 - s) / w
  if (s0 >= PROFILE[0].s) return PROFILE[0].y
  for (let i = 0; i < PROFILE.length - 1; i++) {
    if (s0 >= PROFILE[i + 1].s) return lerp(PROFILE[i].y, PROFILE[i + 1].y, (s0 - PROFILE[i].s) / (PROFILE[i + 1].s - PROFILE[i].s))
  }
  return PROFILE[PROFILE.length - 1].y
}

const WATER_VERT = /* glsl */ `
attribute float aDepth;
varying vec3 vWorld;
varying float vDepth;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vDepth = aDepth;
  gl_Position = projectionMatrix * viewMatrix * w;
}`

const WATER_FRAG = /* glsl */ `
uniform float uTime;
uniform samplerCube uEnv;
uniform vec3 uCentre;     // where the cube map was taken from
uniform float uRadius;    // the sphere it is projected on, so trees sit where they should in the reflection
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform float uLight;     // how much light the water body catches (day 1, evening less)
uniform float uReflGain;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunPower;
varying vec3 vWorld;
varying float vDepth;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// Three layers of slow noise drifting different ways: a calm surface that is never quite still.
float height(vec2 p, float fine) {
  float h = vnoise(p * 0.9 + vec2(uTime * 0.035, uTime * 0.02)) * 0.6;
  h += vnoise(mat2(0.8, -0.6, 0.6, 0.8) * p * 2.3 + vec2(-uTime * 0.05, uTime * 0.04)) * 0.3;
  h += vnoise(p * 5.5 + vec2(uTime * 0.08, -uTime * 0.06)) * 0.1 * fine;
  return h;
}

void main() {
  vec3 toCam = cameraPosition - vWorld;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  vec2 p = vWorld.xz;
  float fine = 1.0 - smoothstep(6.0, 16.0, dist); // the finest ripples fade with distance, so they do not shimmer
  float e = 0.04;
  float h0 = height(p, fine);
  vec2 g = vec2(height(p + vec2(e, 0.0), fine) - h0, height(p + vec2(0.0, e), fine) - h0) / e;
  vec3 N = normalize(vec3(-g.x * 0.1, 1.0, -g.y * 0.1));

  float cosT = clamp(dot(N, V), 0.0, 1.0);
  float fres = clamp(0.035 + 0.965 * pow(1.0 - cosT, 3.6), 0.0, 1.0);

  // What the water reflects: the captured sky and garden, taken from where the pond's centre is.
  vec3 R = reflect(-V, N);
  R.y = abs(R.y);
  vec3 rel = vWorld - uCentre;
  float b = dot(rel, R);
  float c = dot(rel, rel) - uRadius * uRadius;
  vec3 dir = rel + R * (-b + sqrt(max(b * b - c, 0.0)));
  vec3 refl = textureLod(uEnv, normalize(dir), 1.5).rgb * uReflGain;

  // Its body: clear and greenish over the shallow shelf, dark teal in the middle. Over the shelf you see the bed.
  vec3 body = mix(uShallow, uDeep, smoothstep(0.02, 0.4, vDepth)) * uLight;
  float bodyA = mix(0.08, 0.84, smoothstep(0.0, 0.34, vDepth));
  float edge = smoothstep(0.0, 0.05, vDepth); // no hard line where it meets the bank

  // The sun on it: a tight glint that breaks up on the ripples, and a broad sheen round it.
  float sd = max(dot(R, normalize(uSunDir)), 0.0);
  vec3 glint = uSunColor * (pow(sd, 900.0) * 14.0 + pow(sd, 60.0) * 0.5) * uSunPower;

  vec3 col = refl * fres + body * (1.0 - fres) * bodyA + glint * fres * 4.0;
  float a = fres + (1.0 - fres) * bodyA;
  gl_FragColor = vec4(col * edge, a * edge);
  #include <colorspace_fragment>
}`

export function buildPond(k: Kit, garden: THREE.Group) {
  const { track } = k
  const rand = mulberry32(77)
  const gauss = () => rand() + rand() + rand() - 1.5
  const root = new THREE.Group()
  root.name = 'Pond'
  garden.add(root)
  const W = POND_WATER_Y

  // ---------- Bank and bed: one mesh, rings from the lawn's edge down to the middle ----------
  const ring = (i: number, theta: number) => {
    const s = ringScale(PROFILE[i].s, theta)
    const [x, z] = pondPoint(theta, s)
    return { x, z, y: bedHeight(theta, s) }
  }
  const pos: number[] = []
  const colour: number[] = []
  const col = new THREE.Color()
  for (let r = 0; r < PROFILE.length; r++)
    for (let i = 0; i < SEG; i++) {
      const p = ring(r, (i / SEG) * TAU)
      pos.push(p.x, p.y, p.z)
      col.set(PROFILE[r].c).multiplyScalar(0.88 + rand() * 0.24)
      colour.push(col.r, col.g, col.b)
    }
  const centre = PROFILE.length * SEG
  pos.push(POND.x, PROFILE[PROFILE.length - 1].y, POND.z)
  col.set(PROFILE[PROFILE.length - 1].c)
  colour.push(col.r, col.g, col.b)
  const index: number[] = []
  for (let r = 0; r < PROFILE.length - 1; r++)
    for (let i = 0; i < SEG; i++) {
      const o0 = r * SEG + i
      const o1 = r * SEG + ((i + 1) % SEG)
      const n0 = (r + 1) * SEG + i
      const n1 = (r + 1) * SEG + ((i + 1) % SEG)
      index.push(o0, n0, o1, o1, n0, n1) // counter-clockwise from above
    }
  for (let i = 0; i < SEG; i++) index.push((PROFILE.length - 1) * SEG + i, centre, (PROFILE.length - 1) * SEG + ((i + 1) % SEG))
  const bedGeo = track(new THREE.BufferGeometry())
  bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  bedGeo.setAttribute('color', new THREE.Float32BufferAttribute(colour, 3))
  bedGeo.setIndex(index)
  bedGeo.computeVertexNormals()
  const bed = new THREE.Mesh(bedGeo, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 })))
  bed.name = 'Pond bed'
  bed.receiveShadow = true
  bed.userData.noMerge = true
  root.add(bed)

  // ---------- Water: the same rings from the bank down, flat, with how deep it is under each point ----------
  const first = 2 // from the ring just inside the bank
  const wpos: number[] = []
  const depth: number[] = []
  for (let r = first; r < PROFILE.length; r++)
    for (let i = 0; i < SEG; i++) {
      const p = ring(r, (i / SEG) * TAU)
      wpos.push(p.x, W, p.z)
      depth.push(Math.max(0, W - p.y))
    }
  wpos.push(POND.x, W, POND.z)
  depth.push(W - PROFILE[PROFILE.length - 1].y)
  const rings = PROFILE.length - first
  const wcentre = rings * SEG
  const widx: number[] = []
  for (let r = 0; r < rings - 1; r++)
    for (let i = 0; i < SEG; i++) {
      const o0 = r * SEG + i
      const o1 = r * SEG + ((i + 1) % SEG)
      const n0 = (r + 1) * SEG + i
      const n1 = (r + 1) * SEG + ((i + 1) % SEG)
      widx.push(o0, n0, o1, o1, n0, n1)
    }
  for (let i = 0; i < SEG; i++) widx.push((rings - 1) * SEG + i, wcentre, (rings - 1) * SEG + ((i + 1) % SEG))
  const waterGeo = track(new THREE.BufferGeometry())
  waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3))
  waterGeo.setAttribute('aDepth', new THREE.Float32BufferAttribute(depth, 1))
  waterGeo.setIndex(widx)
  const uniforms = {
    uTime: { value: 0 },
    uEnv: { value: null as THREE.Texture | null },
    uCentre: { value: new THREE.Vector3(POND.x, 0.25, POND.z) },
    uRadius: { value: 11 },
    uShallow: { value: new THREE.Color() },
    uDeep: { value: new THREE.Color() },
    uLight: { value: 1 },
    uReflGain: { value: 1 },
    uSunDir: { value: new THREE.Vector3(-0.8, 0.34, -0.5) },
    uSunColor: { value: new THREE.Color('#fff2d8') },
    uSunPower: { value: 1 },
  }
  const waterMat = track(
    new THREE.ShaderMaterial({ uniforms, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, toneMapped: false, fog: false }),
  )
  const water = new THREE.Mesh(waterGeo, waterMat)
  water.name = 'Pond water'
  water.renderOrder = 2
  water.userData.noMerge = true
  water.frustumCulled = false
  root.add(water)

  // ---------- Rocks and pebbles round the waterline ----------
  const rockGeo = (seed: number) => {
    const r = mulberry32(seed)
    const g = new THREE.IcosahedronGeometry(1, 3)
    const p = g.attributes.position
    const v = new THREE.Vector3()
    const off = [r() * 9, r() * 9, r() * 9]
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize()
      // Lumpy: low-frequency bumps plus a flattened underside, so it sits on the ground rather than floating.
      const bump = 1 + 0.2 * Math.sin(v.x * 2.7 + off[0]) * Math.cos(v.y * 2.3 + off[1]) + 0.12 * Math.sin(v.z * 4.1 + off[2]) + 0.05 * Math.sin(v.x * 9 + v.z * 7 + off[0])
      v.multiplyScalar(bump)
      if (v.y < -0.3) v.y = -0.3 + (v.y + 0.3) * 0.3
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return track(g)
  }
  // A speckled grey map breaks up the flat faces so the rocks read as stone rather than plastic.
  const grain = track(
    canvasTexture(128, 128, (x) => {
      const r = mulberry32(5)
      x.fillStyle = '#c9c6bf'
      x.fillRect(0, 0, 128, 128)
      for (let i = 0; i < 2600; i++) {
        const v = 150 + Math.floor(r() * 90)
        x.fillStyle = `rgba(${v},${v - 3},${v - 8},${0.25 + r() * 0.4})`
        const sz = 1 + r() * 3
        x.fillRect(r() * 128, r() * 128, sz, sz)
      }
      for (let i = 0; i < 40; i++) {
        x.strokeStyle = `rgba(70,66,60,${0.15 + r() * 0.2})`
        x.lineWidth = 0.6
        x.beginPath()
        const x0 = r() * 128
        const y0 = r() * 128
        x.moveTo(x0, y0)
        x.lineTo(x0 + (r() - 0.5) * 30, y0 + (r() - 0.5) * 30)
        x.stroke()
      }
    }, true),
  )
  const rockMat = track(new THREE.MeshStandardMaterial({ color: '#ffffff', map: grain, roughness: 0.93 }))
  const rockCols = ['#8f8b82', '#a39e93', '#77746d', '#9a9388', '#6f6c66', '#b0a99b']
  type Placed = { x: number; z: number; r: number }
  const placed: Placed[] = []
  const rockTrs: { x: number; y: number; z: number; sx: number; sy: number; sz: number; ry: number; tilt: number; c: string }[] = []
  const APPROACH = 1.45 // where the flat stone is, on the south shore: kept clear of big rocks
  for (let tries = 0; tries < 400 && rockTrs.length < 38; tries++) {
    const theta = rand() * TAU
    const near = Math.abs(Math.atan2(Math.sin(theta - APPROACH), Math.cos(theta - APPROACH)))
    const size = Math.exp(gauss() * 0.55) * 0.2 // a few big ones among many small
    const r = Math.min(Math.max(size, 0.09), near < 0.4 ? 0.13 : 0.42)
    const s = 0.98 + rand() * 0.14
    const [x, z] = pondPoint(theta, s)
    if (placed.some((q) => Math.hypot(q.x - x, q.z - z) < (q.r + r) * 0.85)) continue
    placed.push({ x, z, r })
    rockTrs.push({ x, y: bedHeight(theta, s) + r * 0.12, z, sx: r * (1 + rand() * 0.35), sy: r * (0.5 + rand() * 0.3), sz: r * (0.85 + rand() * 0.3), ry: rand() * TAU, tilt: (rand() - 0.5) * 0.4, c: rockCols[Math.floor(rand() * rockCols.length)] })
  }
  const dummy = new THREE.Object3D()
  const rockMeshes: THREE.InstancedMesh[] = []
  const variants = [rockGeo(11), rockGeo(23)]
  variants.forEach((g, vi) => {
    const list = rockTrs.filter((_, i) => i % 2 === vi)
    const inst = new THREE.InstancedMesh(g, rockMat, list.length + (vi === 0 ? 1 : 0))
    list.forEach((t, i) => {
      dummy.position.set(t.x, t.y, t.z)
      dummy.rotation.set(t.tilt, t.ry, -t.tilt * 0.6)
      dummy.scale.set(t.sx, t.sy, t.sz)
      dummy.updateMatrix()
      inst.setMatrixAt(i, dummy.matrix)
      inst.setColorAt(i, col.set(t.c))
    })
    if (vi === 0) {
      // A flat stone to stand beside, where the stepping stones from the lawn end on the south shore.
      const [x, z] = pondPoint(APPROACH, 1.1)
      dummy.position.set(x, -0.04, z)
      dummy.rotation.set(0, 0.5, 0)
      dummy.scale.set(0.42, 0.1, 0.32)
      dummy.updateMatrix()
      inst.setMatrixAt(list.length, dummy.matrix)
      inst.setColorAt(list.length, col.set('#a8a399'))
    }
    inst.name = 'Pond rocks'
    inst.castShadow = true
    inst.receiveShadow = true
    root.add(inst)
    rockMeshes.push(inst)
  })
  // Pebbles in the wet band, partly under the water.
  const PEBBLES = 150
  const pebbles = new THREE.InstancedMesh(track(new THREE.IcosahedronGeometry(1, 1)), rockMat, PEBBLES)
  pebbles.name = 'Pond pebbles'
  pebbles.receiveShadow = true
  for (let i = 0; i < PEBBLES; i++) {
    const theta = rand() * TAU
    const s = 0.9 + rand() * 0.2
    const [x, z] = pondPoint(theta, s)
    const r = 0.025 + rand() * 0.04
    dummy.position.set(x, bedHeight(theta, s) + r * 0.1, z)
    dummy.rotation.set(rand() * 3, rand() * 6, rand() * 3)
    dummy.scale.set(r * (1 + rand() * 0.5), r * 0.55, r * (0.8 + rand() * 0.4))
    dummy.updateMatrix()
    pebbles.setMatrixAt(i, dummy.matrix)
    pebbles.setColorAt(i, col.set(rockCols[Math.floor(rand() * rockCols.length)]).multiplyScalar(0.7 + rand() * 0.4))
  }
  root.add(pebbles)

  // ---------- Reeds, grasses and cattails: clumps along part of the edge, none on the viewing side ----------
  const swayUniform = { value: 0 }
  const sway = (m: THREE.MeshStandardMaterial) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uSway = swayUniform
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uSway;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat ph = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3;\ntransformed.x += sin(uSway * 1.3 + ph) * 0.07 * position.y * position.y;\ntransformed.z += cos(uSway * 0.9 + ph * 1.3) * 0.05 * position.y * position.y;')
    }
    m.customProgramCacheKey = () => 'reed-sway'
    return m
  }
  const bladeGeo = (() => {
    const g = new THREE.BufferGeometry()
    const P: number[] = []
    const C: number[] = []
    const I: number[] = []
    const N = 5
    for (let i = 0; i <= N; i++) {
      const y = i / N
      const w = 0.026 * Math.pow(1 - y, 0.7) + 0.0015
      const z = y * y * 0.22
      P.push(-w, y, z, w, y, z)
      const shade = 0.5 + 0.5 * y
      C.push(shade, shade, shade, shade, shade, shade)
      if (i < N) I.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3))
    g.setIndex(I)
    g.computeVertexNormals()
    return track(g)
  })()
  const bladeMat = track(sway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide })))
  const greens = ['#6f8f3d', '#7c9a45', '#5f8438', '#8aa54e', '#a0a85a', '#4f7a35']
  const clumps: { theta: number; spread: number; count: number; hMin: number; hMax: number; cat: number }[] = [
    { theta: 3.55, spread: 0.3, count: 110, hMin: 0.8, hMax: 1.6, cat: 9 }, // north-west: the thickest
    { theta: 4.15, spread: 0.22, count: 80, hMin: 0.7, hMax: 1.5, cat: 7 },
    { theta: 4.95, spread: 0.3, count: 90, hMin: 0.7, hMax: 1.5, cat: 6 },
    { theta: 5.65, spread: 0.16, count: 45, hMin: 0.6, hMax: 1.2, cat: 2 },
    { theta: 0.12, spread: 0.2, count: 50, hMin: 0.5, hMax: 1.1, cat: 3 }, // east, by the house wall
    { theta: 2.35, spread: 0.14, count: 36, hMin: 0.4, hMax: 0.9, cat: 0 }, // a small tuft, south-west
    { theta: 3.0, spread: 0.12, count: 24, hMin: 0.35, hMax: 0.7, cat: 0 },
  ]
  const bladeTrs: THREE.Matrix4[] = []
  const bladeCols: THREE.Color[] = []
  const catTrs: THREE.Matrix4[] = []
  const q = new THREE.Quaternion()
  const qt = new THREE.Quaternion()
  const AX = new THREE.Vector3(1, 0, 0)
  const AY = new THREE.Vector3(0, 1, 0)
  const stalk = (x: number, y: number, z: number, h: number, wScale: number, toCentre: number, out: THREE.Matrix4[]) => {
    const ry = Math.atan2(POND.x - x, POND.z - z) + (rand() - 0.5) * 1.4 + (toCentre < 0.5 ? Math.PI : 0)
    q.setFromAxisAngle(AY, ry)
    qt.setFromAxisAngle(AX, 0.02 + rand() * 0.28)
    q.multiply(qt)
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(wScale, h, wScale))
    out.push(m)
  }
  for (const c of clumps) {
    for (let i = 0; i < c.count; i++) {
      const theta = c.theta + gauss() * c.spread
      const s = 1.0 + Math.abs(gauss()) * 0.16 + rand() * 0.04
      const [x, z] = pondPoint(theta, s)
      stalk(x, bedHeight(theta, s) - 0.02, z, c.hMin + rand() * (c.hMax - c.hMin), 0.6 + rand() * 0.9, 1, bladeTrs)
      bladeCols.push(new THREE.Color(greens[Math.floor(rand() * greens.length)]).offsetHSL(0, 0, (rand() - 0.5) * 0.06))
    }
    for (let i = 0; i < c.cat; i++) {
      const theta = c.theta + gauss() * c.spread * 0.8
      const s = 1.0 + Math.abs(gauss()) * 0.1
      const [x, z] = pondPoint(theta, s)
      const h = c.hMax * (0.95 + rand() * 0.3)
      stalk(x, bedHeight(theta, s) - 0.02, z, h, 1, 1, catTrs)
    }
  }
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, bladeTrs.length)
  bladeTrs.forEach((m, i) => {
    blades.setMatrixAt(i, m)
    blades.setColorAt(i, bladeCols[i])
  })
  blades.name = 'Pond reeds'
  blades.receiveShadow = true
  root.add(blades)
  // Cattails: a thin stem with a brown head near the top.
  const stem = new THREE.CylinderGeometry(0.007, 0.011, 1, 4, 1)
  stem.translate(0, 0.5, 0)
  const head = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 7, 1)
  head.translate(0, 0.82, 0)
  const paint = (g: THREE.BufferGeometry, hex: string) => {
    const c = new THREE.Color(hex)
    const arr: number[] = []
    for (let i = 0; i < g.attributes.position.count; i++) arr.push(c.r, c.g, c.b)
    g.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3))
  }
  paint(stem, '#6d8a3e')
  paint(head, '#4a2f1c')
  const catGeo = track(mergeGeometries([stem, head])!)
  const cats = new THREE.InstancedMesh(catGeo, track(sway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }))), catTrs.length)
  catTrs.forEach((m, i) => cats.setMatrixAt(i, m))
  cats.name = 'Cattails'
  cats.receiveShadow = true
  root.add(cats)

  // ---------- Lily pads and flowers ----------
  const padGeo = track(new THREE.CircleGeometry(1, 24, 0.3, TAU - 0.6))
  padGeo.rotateX(-Math.PI / 2)
  {
    const p = padGeo.attributes.position
    for (let i = 0; i < p.count; i++) p.setY(i, Math.hypot(p.getX(i), p.getZ(i)) ** 2 * 0.05) // the rim curls up a little
    padGeo.computeVertexNormals()
  }
  const padMat = track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, side: THREE.DoubleSide }))
  const padCols = ['#2f6f3a', '#3a7d40', '#2a5f34', '#4a8a46', '#55703a', '#3a5f3e']
  const pads: { x: number; z: number; r: number; ry: number; c: string }[] = []
  const groups: [number, number][] = [
    [0.85, 0.5],
    [2.7, 0.55],
    [4.3, 0.45],
    [5.6, 0.62],
  ]
  for (let tries = 0; tries < 300 && pads.length < 13; tries++) {
    const [gt, gs] = groups[pads.length % groups.length]
    const theta = gt + gauss() * 0.55
    const s = Math.min(0.8, Math.max(0.2, gs + gauss() * 0.22))
    const [x, z] = pondPoint(theta, ringScale(s, theta))
    const r = 0.09 + rand() * 0.11
    if (pads.some((p) => Math.hypot(p.x - x, p.z - z) < (p.r + r) * 0.95)) continue
    pads.push({ x, z, r, ry: rand() * TAU, c: padCols[Math.floor(rand() * padCols.length)] })
  }
  const padInst = new THREE.InstancedMesh(padGeo, padMat, pads.length)
  pads.forEach((p, i) => {
    dummy.position.set(p.x, W + 0.006, p.z)
    dummy.rotation.set(0, p.ry, 0)
    dummy.scale.setScalar(p.r)
    dummy.updateMatrix()
    padInst.setMatrixAt(i, dummy.matrix)
    padInst.setColorAt(i, col.set(p.c))
  })
  padInst.name = 'Lily pads'
  padInst.receiveShadow = true
  root.add(padInst)
  // A flower: two rings of pointed petals round a yellow heart, baked into one shape.
  const petals: THREE.BufferGeometry[] = []
  const tint = (g: THREE.BufferGeometry, hex: string) => paint(g, hex)
  for (const [n, tilt, len, off] of [
    [9, 1.0, 0.13, 0],
    [7, 0.5, 0.1, 0.3],
  ]) {
    for (let i = 0; i < n; i++) {
      const g = new THREE.SphereGeometry(1, 6, 4)
      g.scale(0.032, 0.012, len)
      g.translate(0, 0, len)
      g.applyMatrix4(new THREE.Matrix4().makeRotationX(-tilt))
      g.applyMatrix4(new THREE.Matrix4().makeRotationY(((i + off) / n) * TAU))
      tint(g, i % 2 ? '#fff6f6' : '#ffffff')
      petals.push(g)
    }
  }
  const heart = new THREE.SphereGeometry(0.03, 8, 6)
  heart.translate(0, 0.03, 0)
  tint(heart, '#ffc233')
  petals.push(heart)
  const flowerGeo = track(mergeGeometries(petals)!)
  const flowerTints = ['#ffffff', '#ffc2da', '#ffd6e6', '#fff4f4']
  const flowers = new THREE.InstancedMesh(flowerGeo, track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide })), 3)
  ;[0, 4, 9].forEach((pi, i) => {
    const p = pads[pi % pads.length]
    dummy.position.set(p.x + 0.04, W + 0.02, p.z + 0.03)
    dummy.rotation.set(0, rand() * TAU, 0)
    dummy.scale.setScalar(0.55 + rand() * 0.2)
    dummy.updateMatrix()
    flowers.setMatrixAt(i, dummy.matrix)
    flowers.setColorAt(i, col.set(flowerTints[i]))
  })
  flowers.name = 'Water lilies'
  root.add(flowers)

  // ---------- Koi: four slow shapes under the surface ----------
  const bits: THREE.BufferGeometry[] = []
  const body = new THREE.SphereGeometry(1, 12, 8)
  body.scale(0.26, 0.07, 0.085)
  const tail = new THREE.ConeGeometry(0.09, 0.2, 4)
  tail.rotateZ(-Math.PI / 2) // tip towards the body (+x), wide end behind
  tail.scale(1, 1, 0.16)
  tail.translate(-0.33, 0, 0)
  const fin = new THREE.SphereGeometry(1, 6, 4)
  fin.scale(0.07, 0.01, 0.035)
  const finL = fin.clone().rotateY(0.6).translate(0.1, -0.02, 0.09)
  const finR = fin.clone().rotateY(-0.6).translate(0.1, -0.02, -0.09)
  const nz = (x: number, z: number) => Math.sin(x * 23 + 1.3) * Math.cos(z * 31 + 0.4) + 0.5 * Math.sin(x * 11 - z * 17)
  for (const g of [body, tail, finL, finR]) {
    const p = g.attributes.position
    const arr: number[] = []
    for (let i = 0; i < p.count; i++) {
      const orange = nz(p.getX(i), p.getZ(i)) > 0.15 || p.getX(i) > 0.2
      const c = new THREE.Color(orange ? (p.getX(i) > 0.2 ? '#e8421c' : '#ff7a24') : '#f4efe6')
      arr.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3))
    bits.push(g)
  }
  const koiGeo = track(mergeGeometries(bits.map((g) => g.toNonIndexed()))!)
  const koiMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, side: THREE.DoubleSide }))
  const KOI = 4
  const koi = new THREE.InstancedMesh(koiGeo, koiMat, KOI)
  koi.name = 'Koi'
  koi.frustumCulled = false
  const koiTints = ['#ffffff', '#ffe0c0', '#fff0d8', '#e8d8c8']
  for (let i = 0; i < KOI; i++) koi.setColorAt(i, col.set(koiTints[i]))
  root.add(koi)
  const koiSeed = Array.from({ length: KOI }, (_, i) => ({ ph: i * 1.7 + rand(), w: 0.11 + rand() * 0.05, ax: 0.38 + rand() * 0.12, az: 0.34 + rand() * 0.12, depth: -0.3 - i * 0.03 }))
  const koiPos = (i: number, t: number) => {
    const s = koiSeed[i]
    const th = t * s.w + s.ph
    return [POND.x + Math.sin(th) * POND.a * s.ax, POND.z + Math.sin(th * 1.37 + 1) * POND.b * s.az] as const
  }
  const moveKoi = (t: number) => {
    for (let i = 0; i < KOI; i++) {
      const [x, z] = koiPos(i, t)
      const [x2, z2] = koiPos(i, t + 0.15)
      const heading = -Math.atan2(z2 - z, x2 - x)
      dummy.position.set(x, koiSeed[i].depth + Math.sin(t * 0.6 + i) * 0.01, z)
      dummy.rotation.set(0, heading + Math.sin(t * 4 + i * 2) * 0.1, 0)
      dummy.scale.setScalar(0.9 + (i % 2) * 0.25)
      dummy.updateMatrix()
      koi.setMatrixAt(i, dummy.matrix)
    }
    koi.instanceMatrix.needsUpdate = true
  }
  moveKoi(0)

  // ---------- Time of day ----------
  const look = {
    day: { shallow: '#4f7d5c', deep: '#0c2c30', light: 1, refl: 1, sun: new THREE.Color('#fff2d8'), power: 1 },
    evening: { shallow: '#4c5a46', deep: '#0d2229', light: 0.5, refl: 1.35, sun: new THREE.Color('#ff9a5c'), power: 1.6 },
  }
  const setNight = (night: boolean) => {
    const l = night ? look.evening : look.day
    uniforms.uShallow.value.set(l.shallow)
    uniforms.uDeep.value.set(l.deep)
    uniforms.uLight.value = l.light
    uniforms.uReflGain.value = l.refl
    uniforms.uSunColor.value.copy(l.sun)
    uniforms.uSunPower.value = l.power
  }
  setNight(false)

  return {
    root,
    water,
    /** The point the cube map is taken from, and the water's own shape, for room.ts's reflection capture. */
    centre: new THREE.Vector3(POND.x, 0.3, POND.z),
    setNight,
    setSun(dir: THREE.Vector3) {
      uniforms.uSunDir.value.copy(dir).normalize()
    },
    setReflection(tex: THREE.Texture, centre: THREE.Vector3) {
      uniforms.uEnv.value = tex
      uniforms.uCentre.value.copy(centre)
    },
    /** Hide what must not be in its own reflection (the water, the fish under it) while the cube map is taken. */
    hideForCapture(hide: boolean) {
      water.visible = !hide
      koi.visible = !hide
    },
    update(t: number) {
      uniforms.uTime.value = t
      swayUniform.value = t
      moveKoi(t)
    },
  }
}

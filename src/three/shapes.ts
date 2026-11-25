// Pure point-cloud generators (no three.js import, so 2D icons can use them
// without pulling the WebGL chunk into the main bundle). Each returns
// n * 3 floats roughly inside a radius-2.5 box centred on the origin.

export type ShapeName =
  | 'sphere'
  | 'lattice'
  | 'knot'
  | 'helix'
  | 'cloud'
  | 'antibody'
  | 'grid'
  | 'network'
  | 'spiral'
  | 'browser'
  | 'landscape'

// Deterministic PRNG so shapes are identical between renders.
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sphere(n: number) {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n)
    const th = Math.PI * (1 + Math.sqrt(5)) * i
    const r = 2.3
    a[i * 3] = r * Math.sin(phi) * Math.cos(th)
    a[i * 3 + 1] = r * Math.sin(phi) * Math.sin(th)
    a[i * 3 + 2] = r * Math.cos(phi)
  }
  return a
}

function lattice(n: number) {
  const r = rng(2)
  const layers = [4, 7, 7, 3]
  const nodes = layers.map((count, li) =>
    Array.from({ length: count }, (_, j) => [-3 + li * 2, (j - (count - 1) / 2) * 0.75, 0] as const),
  )
  const edges: [readonly number[], readonly number[]][] = []
  for (let l = 0; l < nodes.length - 1; l++) for (const p of nodes[l]) for (const q of nodes[l + 1]) edges.push([p, q])
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const [p, q] = edges[i % edges.length]
    const node = r() < 0.25
    const t = node ? (r() < 0.5 ? 0 : 1) : r()
    const j = node ? 0.12 : 0.03
    a[i * 3] = p[0] + (q[0] - p[0]) * t + (r() - 0.5) * j
    a[i * 3 + 1] = p[1] + (q[1] - p[1]) * t + (r() - 0.5) * j
    a[i * 3 + 2] = (r() - 0.5) * 0.25
  }
  return a
}

function knot(n: number) {
  const r = rng(3)
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    const rad = 1.35 + 0.55 * Math.cos(3 * t)
    a[i * 3] = rad * Math.cos(2 * t) + (r() - 0.5) * 0.18
    a[i * 3 + 1] = rad * Math.sin(2 * t) + (r() - 0.5) * 0.18
    a[i * 3 + 2] = 0.6 * Math.sin(3 * t) + (r() - 0.5) * 0.18
  }
  return a
}

function helix(n: number) {
  const r = rng(4)
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const strand = i % 3
    const t = (i / n) * 2 - 1
    const ang = t * Math.PI * 4
    if (strand < 2) {
      const o = strand * Math.PI
      a[i * 3] = Math.cos(ang + o) * 1.1
      a[i * 3 + 1] = t * 2.8
      a[i * 3 + 2] = Math.sin(ang + o) * 1.1
    } else {
      const s = r() * 2 - 1
      const step = Math.round(ang / 0.45) * 0.45
      a[i * 3] = Math.cos(step) * 1.1 * s
      a[i * 3 + 1] = Math.round((t * 2.8) / 0.32) * 0.32
      a[i * 3 + 2] = Math.sin(step) * 1.1 * s
    }
  }
  return a
}

/** Unhaze: a puffy cloud made of overlapping spheres. */
function cloud(n: number) {
  const r = rng(5)
  const puffs = [
    [-1.4, -0.3, 0, 0.95],
    [-0.4, 0.35, 0, 1.25],
    [0.85, 0.1, 0, 1.05],
    [1.8, -0.35, 0, 0.7],
    [0.2, -0.55, 0.2, 0.9],
  ]
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const [cx, cy, cz, rad] = puffs[i % puffs.length]
    const u = r() * 2 - 1
    const th = r() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    a[i * 3] = cx + rad * s * Math.cos(th)
    a[i * 3 + 1] = Math.max(-1.05, cy + rad * u) // flat cloud base
    a[i * 3 + 2] = cz + rad * s * Math.sin(th) * 0.6
  }
  return a
}

/** Antibody: the Y-shaped molecule (two arms, one stem). */
function antibody(n: number) {
  const r = rng(6)
  const segs: [number, number, number, number][] = [
    [0, -2.4, 0, -0.2], // stem
    [0, -0.2, -1.7, 1.9], // left arm
    [0, -0.2, 1.7, 1.9], // right arm
    [-0.45, -0.1, -2.05, 1.6], // left light chain
    [0.45, -0.1, 2.05, 1.6], // right light chain
  ]
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const [x0, y0, x1, y1] = segs[i % segs.length]
    const t = r()
    const rad = 0.28 * Math.sqrt(r())
    const th = r() * Math.PI * 2
    a[i * 3] = x0 + (x1 - x0) * t + Math.cos(th) * rad
    a[i * 3 + 1] = y0 + (y1 - y0) * t + Math.sin(th) * rad * 0.6
    a[i * 3 + 2] = Math.sin(th) * rad
  }
  return a
}

/** Computer vision: an image plane of pixels with a soft blob. */
function grid(n: number) {
  const side = Math.ceil(Math.sqrt(n))
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const gx = (i % side) / (side - 1) - 0.5
    const gy = Math.floor(i / side) / (side - 1) - 0.5
    const d = Math.hypot(gx + 0.08, gy - 0.05)
    a[i * 3] = gx * 4.4
    a[i * 3 + 1] = gy * 4.4
    a[i * 3 + 2] = Math.exp(-(d * d) / 0.03) * 1.1
  }
  return a
}

/** Network traffic: clustered hosts joined by links. */
function network(n: number) {
  const r = rng(8)
  const hubs = Array.from({ length: 9 }, (_, i) => {
    const ang = (i / 9) * Math.PI * 2
    const rad = i === 0 ? 0 : 1.7 + r() * 0.6
    return [Math.cos(ang) * rad, Math.sin(ang) * rad * 0.8, (r() - 0.5) * 1.2]
  })
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const h = hubs[i % hubs.length]
    if (r() < 0.45) {
      // link to the central hub
      const t = r()
      a[i * 3] = h[0] * t
      a[i * 3 + 1] = h[1] * t
      a[i * 3 + 2] = h[2] * t
    } else {
      const rad = 0.35 * Math.cbrt(r())
      const u = r() * 2 - 1
      const th = r() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      a[i * 3] = h[0] + rad * s * Math.cos(th)
      a[i * 3 + 1] = h[1] + rad * u
      a[i * 3 + 2] = h[2] + rad * s * Math.sin(th)
    }
  }
  return a
}

/** Plants: phyllotaxis spiral, the seed pattern of a sunflower head. */
function spiral(n: number) {
  const a = new Float32Array(n * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const rad = 2.5 * Math.sqrt(i / n)
    const th = i * golden
    a[i * 3] = Math.cos(th) * rad
    a[i * 3 + 1] = Math.sin(th) * rad
    a[i * 3 + 2] = -0.35 * rad * rad + 0.9
  }
  return a
}

/** Websites: a browser window outline with content blocks. */
function browser(n: number) {
  const r = rng(10)
  const W = 4.4
  const H = 3
  const rects = [
    [-W / 2, H / 2 - 0.45, W, 0.45, 0.06], // title bar
    [-W / 2 + 0.3, 0.55, 2.4, 0.35, 0.02], // headline
    [-W / 2 + 0.3, 0.05, 1.8, 0.18, 0.02],
    [-W / 2 + 0.3, -0.3, 1.5, 0.18, 0.02],
    [0.35, -1.25, 1.6, 1.6, 0.02], // image
  ]
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const k = i % 3
    if (k === 0) {
      // frame
      const t = r() * 2 * (W + H)
      let x: number, y: number
      if (t < W) [x, y] = [-W / 2 + t, H / 2]
      else if (t < W + H) [x, y] = [W / 2, H / 2 - (t - W)]
      else if (t < 2 * W + H) [x, y] = [W / 2 - (t - W - H), -H / 2]
      else [x, y] = [-W / 2, -H / 2 + (t - 2 * W - H)]
      a[i * 3] = x
      a[i * 3 + 1] = y
    } else {
      const [x, y, w, h] = rects[Math.floor(r() * rects.length)]
      a[i * 3] = x + r() * w
      a[i * 3 + 1] = y + r() * h
    }
    a[i * 3 + 2] = (r() - 0.5) * 0.08
  }
  return a
}

/**
 * A loss landscape: a wireframe surface with a deep valley, a shallow trap and a gentle bowl, plus the path
 * gradient descent takes from a far corner down into the deepest valley (the same idea as the Find the minimum game).
 */
function landscape(n: number) {
  const r = rng(11)
  const f = (x: number, z: number) =>
    0.9 - 1.9 * Math.exp(-((x - 0.7) ** 2 + (z + 0.5) ** 2) / 1.0) - 0.9 * Math.exp(-((x + 1.3) ** 2 + (z - 1.0) ** 2) / 0.45) + 0.07 * (x * x + z * z)
  // The descent path: small steps down the gradient from the far corner.
  const path: [number, number][] = []
  let x = -2.1
  let z = -2.0
  for (let k = 0; k < 140; k++) {
    path.push([x, z])
    const e = 1e-3
    const gx = (f(x + e, z) - f(x - e, z)) / (2 * e)
    const gz = (f(x, z + e) - f(x, z - e)) / (2 * e)
    x -= gx * 0.09
    z -= gz * 0.09
  }
  const S = 2.4
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    let px: number, pz: number, lift: number
    if (i % 7 === 0) {
      // On the path, floating a touch above the surface so it reads as a trail.
      const [qx, qz] = path[Math.floor(r() * path.length)]
      px = qx + (r() - 0.5) * 0.06
      pz = qz + (r() - 0.5) * 0.06
      lift = 0.1
    } else {
      // Grid lines: every point sits on a line of constant x or constant z.
      const line = Math.round((r() * 2 - 1) * 9) / 9
      const along = r() * 2 - 1
      ;[px, pz] = r() < 0.5 ? [line * S, along * S] : [along * S, line * S]
      lift = 0
    }
    a[i * 3] = px
    a[i * 3 + 1] = f(px, pz) * 1.1 + lift - 0.2
    a[i * 3 + 2] = pz
  }
  return a
}

const GENERATORS: Record<ShapeName, (n: number) => Float32Array> = {
  sphere,
  lattice,
  knot,
  helix,
  cloud,
  antibody,
  grid,
  network,
  spiral,
  browser,
  landscape,
}

const cache = new Map<string, Float32Array>()
export function shape(name: ShapeName, n: number): Float32Array {
  const key = `${name}:${n}`
  let v = cache.get(key)
  if (!v) {
    v = GENERATORS[name](n)
    cache.set(key, v)
  }
  return v
}

import * as THREE from 'three'
import type { Kit } from './kit'
import { grassTexture, woodTexture } from './textures'
import { DECK, GARDEN, TREES } from './layout'

export interface VineSpot {
  pos: [number, number, number]
  scale: number
  rotY: number
}

// The garden sits outside the left wall (x < -4.2), reached through the door. Its size lives in layout.ts.
const X0 = GARDEN.x0 // far edge
const X1 = GARDEN.x1 // the house wall
const Z0 = GARDEN.z0
const Z1 = GARDEN.z1

const LEAF_GREENS = ['#3f7d3a', '#4f9144', '#2f6a35', '#5fa04a', '#3a7440']
const HEDGE_GREENS = ['#2f6a35', '#35753a', '#2a5f30', '#3f7d3a']

export function buildGarden(k: Kit) {
  const { scene, track, rand, mat, mesh, box, tbox, cyl } = k
  const garden = new THREE.Group()
  garden.name = 'Garden'
  scene.add(garden)

  // ---------- Lawn ----------
  const grassTex = track(grassTexture())
  const grass = mat('#ffffff', { map: grassTex, roughness: 1 })
  const soil = mat('#5b4030', { roughness: 1 })
  const lawn = tbox(X1 - X0, 0.2, Z1 - Z0, [soil, soil, grass, soil, soil, soil], (X0 + X1) / 2, -0.13, (Z0 + Z1) / 2, 3, garden)
  lawn.name = 'Lawn'
  lawn.castShadow = false

  // Blades of grass: three crossed slivers per tuft, lit like the ground under them.
  const tuft = track(new THREE.BufferGeometry())
  {
    const pos: number[] = []
    const nor: number[] = []
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI + 0.3
      const dx = Math.cos(a) * 0.022
      const dz = Math.sin(a) * 0.022
      const lean = 0.05 * (i - 1)
      pos.push(-dx, 0, -dz, dx, 0, dz, lean, 0.13, lean * 0.6)
      nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0)
    }
    tuft.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    tuft.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  }
  const TUFTS = 12000
  const blades = new THREE.InstancedMesh(tuft, mat('#ffffff', { roughness: 1, side: THREE.DoubleSide }), TUFTS)
  blades.name = 'Grass'
  blades.receiveShadow = true
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const col = new THREE.Color()
  const UP = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < TUFTS; i++) {
    const x = X0 + 0.9 + rand() * (X1 - X0 - 1.0)
    const z = Z0 + 0.9 + rand() * (Z1 - Z0 - 1.1)
    if (x > DECK.x0 - 0.05 && z > DECK.z0 - 0.05 && z < DECK.z1 + 0.05) {
      blades.setMatrixAt(i, m4.makeScale(0, 0, 0)) // under the deck: none
      continue
    }
    const s = 0.6 + rand() * 0.9
    q.setFromAxisAngle(UP, rand() * Math.PI)
    m4.compose(new THREE.Vector3(x, -0.03, z), q, new THREE.Vector3(s, s * (0.7 + rand() * 0.8), s))
    blades.setMatrixAt(i, m4)
    blades.setColorAt(i, col.setHSL(0.26 + rand() * 0.07, 0.45 + rand() * 0.2, 0.16 + rand() * 0.12))
  }
  garden.add(blades)

  // ---------- Foliage: many small leaves scattered over a shape ----------
  const leafGeo = track(new THREE.BufferGeometry())
  leafGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, -0.5, 0, 0.36, 0, 0.1, 0, 0.5, 0, 0, -0.5, 0, 0, 0.5, 0, -0.36, 0, 0.1], 3))
  leafGeo.computeVertexNormals()
  const leafMat = mat('#ffffff', { roughness: 0.8, side: THREE.DoubleSide })
  type Sample = { p: THREE.Vector3; n: THREE.Vector3 }
  const basis = new THREE.Matrix4()
  const tmp = new THREE.Vector3()
  const foliage = (samples: Sample[], size: number, palette: string[], parent: THREE.Object3D = garden) => {
    const inst = new THREE.InstancedMesh(leafGeo, leafMat, samples.length)
    // Leaves receive shadow but do not cast it: thousands of slivers cost a lot in the shadow pass and
    // the dark core under them already gives the mass its shadow.
    inst.receiveShadow = true
    samples.forEach(({ p, n }, i) => {
      const zAxis = n.clone().add(tmp.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.9)).normalize()
      const xAxis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).cross(zAxis).normalize()
      const yAxis = zAxis.clone().cross(xAxis)
      basis.makeBasis(xAxis, yAxis, zAxis)
      const s = size * (0.7 + rand() * 0.7)
      basis.scale(tmp.set(s, s, s))
      basis.setPosition(p)
      inst.setMatrixAt(i, basis)
      inst.setColorAt(i, col.set(palette[Math.floor(rand() * palette.length)]).offsetHSL(0, 0, (rand() - 0.5) * 0.08))
    })
    parent.add(inst)
    return inst
  }
  const onBlob = (c: THREE.Vector3, r: THREE.Vector3, count: number): Sample[] =>
    Array.from({ length: count }, () => {
      const n = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize()
      const d = 0.88 + rand() * 0.22
      return { p: new THREE.Vector3(c.x + n.x * r.x * d, c.y + n.y * r.y * d, c.z + n.z * r.z * d), n }
    })
  const innerMat = mat('#27552c', { roughness: 1 })
  const blobGeo = track(new THREE.IcosahedronGeometry(1, 2))
  /** A leafy mass: a dark core so you cannot see through it, wrapped in leaves. */
  const bush = (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, count: number, size: number, palette = LEAF_GREENS, parent: THREE.Object3D = garden) => {
    const core = new THREE.Mesh(blobGeo, innerMat)
    core.position.set(cx, cy, cz)
    core.scale.set(rx * 0.86, ry * 0.86, rz * 0.86)
    core.castShadow = true
    parent.add(core)
    foliage(onBlob(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(rx, ry, rz), count), size, palette, parent)
  }

  // ---------- Trees ----------
  const bark = mat('#5d4331', { roughness: 1 })
  const crowns: THREE.Object3D[] = []
  const drawnTrees = new THREE.Group() // stand-ins until the tree models load
  garden.add(drawnTrees)
  const treeSpots: { x: number; z: number; h: number }[] = []
  const tree = (x: number, z: number, h: number, spread: number) => {
    treeSpots.push({ x, z, h })
    const trunkH = h * 0.6
    cyl(0.13 * spread, 0.24 * spread, trunkH, bark, x, trunkH / 2, z, drawnTrees, 10)
    const crown = new THREE.Group()
    crown.position.set(x, trunkH, z)
    drawnTrees.add(crown)
    crowns.push(crown)
    for (const [dx, dz, lean] of [
      [0.5, 0.2, -0.6],
      [-0.4, 0.3, 0.55],
      [0.1, -0.5, 0.2],
    ]) {
      const b = cyl(0.05 * spread, 0.1 * spread, 1.3 * spread, bark, dx * spread * 0.5, 0.2, dz * spread * 0.5, crown, 6)
      b.rotation.set(dz * 0.9, 0, lean)
    }
    const blobs: [number, number, number, number][] = [
      [0, 1.0, 0, 1.25],
      [0.9, 0.6, 0.3, 0.95],
      [-0.85, 0.7, 0.2, 0.9],
      [0.2, 0.5, -0.9, 0.9],
      [-0.1, 0.55, 0.9, 0.85],
      [0.3, 1.75, -0.1, 0.8],
    ]
    for (const [bx, by, bz, br] of blobs) {
      const r = br * spread
      bush(bx * spread, by * spread, bz * spread, r, r * 0.85, r, Math.round(520 * br), 0.17 * spread, LEAF_GREENS, crown)
    }
  }
  // The back of the garden is left clear for the greenhouse model (placed by room.ts).
  for (const [x, z, h, spread] of TREES) tree(x, z, h, spread)

  // ---------- Hedge along the far side and the back end ----------
  const hedgeCore = mat('#234a28', { roughness: 1 })
  const hedge = (x: number, z: number, w: number, d: number, h: number) => {
    box(w, h, d, hedgeCore, x, h / 2 - 0.03, z, garden)
    const samples: Sample[] = []
    const area = w * d + 2 * (w + d) * h
    const n = Math.round(area * 90)
    for (let i = 0; i < n; i++) {
      const pick = rand() * area
      const p = new THREE.Vector3()
      const nrm = new THREE.Vector3()
      if (pick < w * d) {
        p.set(x + (rand() - 0.5) * w, h - 0.03, z + (rand() - 0.5) * d)
        nrm.set(0, 1, 0)
      } else if (pick < w * d + 2 * w * h) {
        const s = rand() < 0.5 ? -1 : 1
        p.set(x + (rand() - 0.5) * w, rand() * h, z + (s * d) / 2)
        nrm.set(0, 0, s)
      } else {
        const s = rand() < 0.5 ? -1 : 1
        p.set(x + (s * w) / 2, rand() * h, z + (rand() - 0.5) * d)
        nrm.set(s, 0, 0)
      }
      samples.push({ p, n: nrm })
    }
    foliage(samples, 0.17, HEDGE_GREENS)
  }
  hedge(X0 + 0.45, (Z0 + Z1) / 2, 0.7, Z1 - Z0 - 0.2, 2.2)
  hedge((X0 + X1) / 2 - 0.2, Z0 + 0.45, X1 - X0 - 1.6, 0.7, 2.2)

  // ---------- Picket fence along the front ----------
  const fenceWood = mat('#f1ece2', { roughness: 0.8 })
  const FZ = Z1 - 0.25
  box(X1 - X0 - 1.0, 0.07, 0.05, fenceWood, (X0 + X1) / 2 + 0.3, 0.35, FZ - 0.04, garden)
  box(X1 - X0 - 1.0, 0.07, 0.05, fenceWood, (X0 + X1) / 2 + 0.3, 0.85, FZ - 0.04, garden)
  const picketGeo = track(new THREE.BoxGeometry(0.13, 1.15, 0.04))
  const PICKETS = Math.floor((X1 - X0 - 1.0) / 0.2)
  const pickets = new THREE.InstancedMesh(picketGeo, fenceWood, PICKETS)
  pickets.castShadow = pickets.receiveShadow = true
  for (let i = 0; i < PICKETS; i++) {
    m4.makeTranslation(X0 + 0.95 + i * 0.2, 0.55 + (i % 2) * 0.03, FZ)
    pickets.setMatrixAt(i, m4)
  }
  garden.add(pickets)

  // ---------- Stepping stones from the door ----------
  const stone = mat('#a8a39a', { roughness: 0.95 })
  const stoneGeo = track(new THREE.CylinderGeometry(0.42, 0.46, 0.06, 9))
  // From the deck's step, round the big tree, to the shed.
  const path: [number, number][] = [
    [-7.95, 2.7],
    [-8.75, 2.4],
    [-9.6, 2.45],
    [-10.45, 2.05],
    [-11.1, 1.3],
    [-11.5, 0.35],
    [-11.75, -0.65],
    [-11.85, -1.7],
    [-11.9, -2.7],
  ]
  path.forEach(([x, z], i) => {
    const s = new THREE.Mesh(stoneGeo, stone)
    s.position.set(x, 0, z)
    s.rotation.y = i * 1.3
    s.scale.set(1 + (i % 2) * 0.12, 1, 0.82 + (i % 3) * 0.08)
    s.receiveShadow = true
    garden.add(s)
  })

  // ---------- Bench ----------
  const benchTex = track(woodTexture(24, 40, 38, 9))
  const benchWood = mat('#ffffff', { map: benchTex, roughness: 0.7 })
  const bench = new THREE.Group()
  bench.name = 'Bench'
  // On the deck, facing out over the lawn.
  bench.position.set(-6.3, DECK.y - 0.03, 4.45)
  bench.rotation.y = Math.PI
  garden.add(bench)
  for (const dz of [-0.17, 0, 0.17]) tbox(1.7, 0.05, 0.15, benchWood, 0, 0.62, dz, 1.2, bench)
  for (const dy of [0.95, 1.15]) {
    const slat = tbox(1.7, 0.14, 0.04, benchWood, 0, dy, -0.3, 1.2, bench)
    slat.rotation.x = -0.15
  }
  const iron = mat('#22252c', { roughness: 0.5, metalness: 0.6 })
  for (const dx of [-0.75, 0.75]) {
    box(0.06, 0.62, 0.5, iron, dx, 0.3, 0, bench)
    box(0.06, 0.7, 0.06, iron, dx, 0.92, -0.29, bench).rotation.x = -0.15
  }

  // ---------- Flower bed under the window ----------
  tbox(0.75, 0.16, 2.6, soil, -4.62, 0.03, -1.7, 2, garden)
  for (let i = 0; i < 5; i++) bush(-4.62 + (rand() - 0.5) * 0.15, 0.36, -2.75 + i * 0.52, 0.34, 0.3, 0.32, 160, 0.12)
  const petalGeo = track(new THREE.IcosahedronGeometry(0.07, 1))
  const FLOWERS = 46
  const flowers = new THREE.InstancedMesh(petalGeo, mat('#ffffff', { roughness: 0.6 }), FLOWERS)
  const petals = ['#ffffff', '#ffd1dc', '#ffcf5c', '#ff8a5c', '#b9a6ff']
  for (let i = 0; i < FLOWERS; i++) {
    const s = 0.7 + rand() * 0.7
    m4.compose(new THREE.Vector3(-4.62 + (rand() - 0.3) * 0.7, 0.42 + rand() * 0.3, -2.9 + rand() * 2.4), q.identity(), new THREE.Vector3(s, s * 0.7, s))
    flowers.setMatrixAt(i, m4)
    flowers.setColorAt(i, col.set(petals[Math.floor(rand() * petals.length)]))
  }
  flowers.castShadow = false // tiny: not worth a place in the shadow pass
  garden.add(flowers)

  // ---------- Pots by the door ----------
  const terracotta = mat('#b8623f', { roughness: 0.9 })
  for (const z of [1.72, 3.9]) {
    cyl(0.3, 0.22, 0.5, terracotta, -4.72, 0.25 + DECK.y - 0.03, z, garden, 16)
    bush(-4.72, 0.95 + DECK.y - 0.03, z, 0.4, 0.5, 0.4, 260, 0.13)
  }

  // ---------- Pergola over the door, with string lights ----------
  const pergolaTex = track(woodTexture(26, 30, 26, 5))
  const beam = mat('#ffffff', { map: pergolaTex, roughness: 0.8 })
  const post = mat('#4a3324', { roughness: 0.85 })
  const PX = -5.9 // posts
  const PZ = [1.8, 3.8]
  for (const z of PZ) {
    box(0.14, 3.2, 0.14, post, PX, 1.6, z, garden)
    tbox(X1 - PX + 0.3, 0.14, 0.1, beam, (X1 + PX) / 2 - 0.15, 3.2, z, 1.5, garden)
  }
  for (let i = 0; i < 6; i++) tbox(0.07, 0.1, 2.5, beam, X1 - 0.2 - i * 0.33, 3.32, 2.8, 1.5, garden)
  const bulbMat = track(new THREE.MeshBasicMaterial({ color: '#f3ead9', toneMapped: false }))
  const bulbGeo = track(new THREE.SphereGeometry(0.045, 8, 6))
  const BULBS = 11
  const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, BULBS)
  const wirePts: THREE.Vector3[] = []
  for (let i = 0; i < BULBS; i++) {
    const u = i / (BULBS - 1)
    const p = new THREE.Vector3(PX - 0.02, 3.05 - Math.sin(u * Math.PI) * 0.22, PZ[0] + u * (PZ[1] - PZ[0]))
    wirePts.push(p)
    m4.makeTranslation(p.x, p.y - 0.05, p.z)
    bulbs.setMatrixAt(i, m4)
  }
  garden.add(bulbs)
  const wire = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(wirePts)), track(new THREE.LineBasicMaterial({ color: '#1b1b1f' })))
  garden.add(wire)
  const stringLight = new THREE.PointLight('#ffc98a', 0, 6, 1.8)
  stringLight.position.set(PX + 0.5, 2.7, 2.8)
  garden.add(stringLight)

  // ---------- Lamp post ----------
  cyl(0.04, 0.06, 2.3, iron, -6.5, 1.15, 0.5, garden, 10)
  cyl(0.16, 0.2, 0.06, iron, -6.5, 0.03, 0.5, garden, 12)
  const lanternMat = track(new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffb86b', emissiveIntensity: 0, roughness: 0.4 }))
  box(0.2, 0.28, 0.2, lanternMat, -6.5, 2.42, 0.5, garden).castShadow = false
  const cap = mesh(new THREE.ConeGeometry(0.2, 0.14, 4), iron, -6.5, 2.63, 0.5, garden)
  cap.rotation.y = Math.PI / 4
  const postLight = new THREE.PointLight('#ffb86b', 0, 9, 1.6)
  postLight.position.set(-6.5, 2.45, 0.5)
  garden.add(postLight)

  // ---------- Fireflies (night only) ----------
  const FLIES = 26
  const flyGeo = track(new THREE.BufferGeometry())
  const flyPos = new Float32Array(FLIES * 3)
  const flyBase = Array.from({ length: FLIES }, () => [X0 + 1.4 + rand() * (X1 - X0 - 2.4), 0.5 + rand() * 1.9, Z0 + 1.6 + rand() * 11, rand() * 6.28])
  flyBase.forEach(([x, y, z], i) => flyPos.set([x, y, z], i * 3))
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3))
  const flyMat = track(new THREE.PointsMaterial({ color: '#f6ff9a', size: 0.07, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }))
  const flies = new THREE.Points(flyGeo, flyMat)
  flies.name = 'Fireflies'
  flies.visible = false
  garden.add(flies)

  // Where vines hang: over the wall top, under the pergola, and by the window.
  const vineSpots: VineSpot[] = [
    { pos: [-4.22, 5.02, -3.3], scale: 2.1, rotY: 1.6 },
    { pos: [-4.2, 5.02, 0.4], scale: 1.8, rotY: 4.4 },
    { pos: [-4.22, 5.02, 1.5], scale: 2.2, rotY: 0.4 },
    { pos: [-4.6, 3.3, 2.1], scale: 1.25, rotY: 2.2 },
    { pos: [-5.2, 3.3, 3.5], scale: 1.4, rotY: 5.1 },
    { pos: [-5.75, 3.25, 2.6], scale: 1.1, rotY: 3.3 },
  ]

  return {
    root: garden,
    /** Parts of the garden that move on their own (trees sway): they must not be merged with the rest. */
    moving: () => [drawnTrees, ...crowns],
    vineSpots,
    /** Swap the stand-in grass blades and trees for the real models (garden.glb). */
    useModels(root: THREE.Object3D) {
      const cutout = (m: THREE.Material) => {
        const material = m as THREE.MeshStandardMaterial
        material.transparent = false
        material.alphaTest = 0.45
        material.side = THREE.DoubleSide
        return material
      }
      // Longer grass along the hedges and the fence, where a mower would not reach. The lawn keeps its own blades.
      const scatter = (name: string, count: number, height: number) => {
        const src = root.getObjectByName(name) as THREE.Mesh | undefined
        if (!src || !src.isMesh) return
        src.geometry.computeBoundingBox()
        const k = height / (src.geometry.boundingBox!.max.y - src.geometry.boundingBox!.min.y)
        const inst = new THREE.InstancedMesh(src.geometry, cutout(src.material as THREE.Material), count)
        inst.name = name
        inst.receiveShadow = true
        for (let i = 0; i < count; i++) {
          const s = k * (0.6 + rand() * 0.8)
          q.setFromAxisAngle(UP, rand() * Math.PI * 2)
          // Along the far hedge, the back hedge or the front fence.
          const edge = rand()
          const along = rand()
          const off = rand() * 0.45
          const x = edge < 0.45 ? X0 + 0.95 + off : X0 + 1.0 + along * (X1 - X0 - 1.4)
          const z = edge < 0.45 ? Z0 + 1.0 + along * (Z1 - Z0 - 1.4) : edge < 0.7 ? Z0 + 0.95 + off : Z1 - 0.5 - off
          m4.compose(new THREE.Vector3(x, -0.03, z), q, new THREE.Vector3(s, s, s))
          inst.setMatrixAt(i, m4)
        }
        garden.add(inst)
      }
      scatter('GrassClump', 260, 0.42)
      // Trees: one of the two models at each spot, sized to the stand-in it replaces.
      const kinds = ['TreeA', 'TreeB'].map((n) => root.getObjectByName(n)).filter((o): o is THREE.Object3D => !!o)
      if (kinds.length) {
        crowns.length = 0
        treeSpots.forEach(({ x, z, h }, i) => {
          const tree = kinds[i % kinds.length].clone()
          tree.traverse((o) => {
            const mesh = o as THREE.Mesh
            if (mesh.isMesh && (mesh.material as THREE.Material).name === 'TreeLeaves') cutout(mesh.material as THREE.Material)
          })
          const size = new THREE.Box3().setFromObject(tree).getSize(new THREE.Vector3())
          tree.scale.setScalar(h / size.y)
          tree.position.set(x, -0.03, z)
          tree.rotation.y = i * 2.1
          garden.add(tree)
          crowns.push(tree)
        })
        drawnTrees.visible = false
      }
    },
    setNight(night: boolean) {
      flies.visible = night
      bulbMat.color.set(night ? '#ffd79a' : '#f3ead9')
      stringLight.intensity = night ? 7 : 0
      postLight.intensity = night ? 16 : 0
      lanternMat.emissiveIntensity = night ? 2.4 : 0
    },
    update(t: number) {
      crowns.forEach((c, i) => {
        c.rotation.z = Math.sin(t * 0.7 + i * 2) * 0.008
        c.rotation.x = Math.cos(t * 0.5 + i) * 0.006
      })
      if (flies.visible) {
        flyBase.forEach(([x, y, z, ph], i) => {
          flyPos[i * 3] = x + Math.sin(t * 0.5 + ph) * 0.5
          flyPos[i * 3 + 1] = y + Math.sin(t * 0.9 + ph * 2) * 0.25
          flyPos[i * 3 + 2] = z + Math.cos(t * 0.4 + ph) * 0.5
        })
        flyGeo.attributes.position.needsUpdate = true
        flyMat.opacity = 0.55 + 0.35 * Math.sin(t * 2.2)
      }
    },
  }
}

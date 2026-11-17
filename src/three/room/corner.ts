import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Kit } from './kit'
import { canvasTexture, mulberry32 } from './textures'
import { READING } from './layout'

/** A round, flat-woven rug: concentric bands, drawn so the cylinder's flat top maps the circle edge to edge. */
function roundRugTexture() {
  const r = mulberry32(57)
  return canvasTexture(512, 512, (x) => {
    const c = 256
    x.fillStyle = '#e9dfcf'
    x.fillRect(0, 0, 512, 512)
    const ring = (radius: number, w: number, color: string) => {
      x.strokeStyle = color
      x.lineWidth = w
      x.beginPath()
      x.arc(c, c, radius, 0, Math.PI * 2)
      x.stroke()
    }
    ring(236, 22, '#c9714f')
    ring(204, 6, '#2c3566')
    ring(188, 3, '#c9714f')
    ring(112, 14, '#2c3566')
    // A sunburst in the middle: sixteen petals.
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      x.strokeStyle = i % 2 ? '#c9714f' : '#2c3566'
      x.lineWidth = 5
      x.beginPath()
      x.moveTo(c + Math.cos(a) * 28, c + Math.sin(a) * 28)
      x.lineTo(c + Math.cos(a) * 92, c + Math.sin(a) * 92)
      x.stroke()
    }
    for (let y = 0; y < 512; y += 3) {
      x.fillStyle = `rgba(60,40,20,${0.03 + r() * 0.05})`
      x.fillRect(0, y, 512, 1)
    }
    for (let i = 0; i < 2000; i++) {
      x.fillStyle = `rgba(255,255,255,${r() * 0.08})`
      x.fillRect(r() * 512, r() * 512, 2, 2)
    }
  })
}

const SLEEVES = ['#2f45ff', '#d9825b', '#0c0f14', '#e8c58f', '#8c99ff', '#c4452c', '#1f7a56', '#f1ece2', '#3a3f55']

/**
 * The reading and listening corner: an armchair, a side table with a lamp, a record cabinet with a turntable
 * and a round rug, all in the room's palette. Everything is static and shares a few materials, so it merges
 * into a handful of draw calls (merge.ts, with this group as a container).
 */
export function buildCorner(k: Kit, parent: THREE.Object3D, wall: THREE.Object3D, walnut: THREE.Material, brass: THREE.Material) {
  const { track, mat, mesh, box, tbox, cyl } = k
  const corner = new THREE.Group()
  corner.name = 'Reading corner'
  parent.add(corner)

  const terracotta = mat('#c46a42', { roughness: 0.9 })
  const terracottaSoft = mat('#d27a50', { roughness: 0.95 })
  const cream = mat('#e9d3b0', { roughness: 1 })
  const navy = mat('#2f3b68', { roughness: 0.95 })
  const dark = mat('#1b1c22', { roughness: 0.6 })
  const legWood = mat('#6a4630', { roughness: 0.6 })
  const small = (o: THREE.Mesh) => {
    o.castShadow = false
    return o
  }
  const rbox = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, p: THREE.Object3D, radius = 0.07) =>
    mesh(new RoundedBoxGeometry(w, h, d, 2, radius), m, x, y, z, p)

  // ---------- Round rug ----------
  const R = READING.rug
  const rugTop = mat('#ffffff', { map: track(roundRugTexture()), roughness: 1 })
  const rugEdge = mat('#c9714f', { roughness: 1 })
  const rug = mesh(new THREE.CylinderGeometry(R.r, R.r, 0.03, 48), [rugEdge, rugTop, rugEdge], R.x, 0.015, R.z, corner)
  rug.name = 'Round rug'
  rug.castShadow = false

  // ---------- Armchair (built facing +z, then turned to face into the room) ----------
  const chair = new THREE.Group()
  chair.name = 'Armchair'
  chair.position.set(READING.chair.x, 0, READING.chair.z)
  chair.rotation.y = READING.chair.yaw
  corner.add(chair)
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = cyl(0.026, 0.036, 0.32, legWood, sx * 0.5, 0.15, sz * 0.42, chair, 8)
      leg.rotation.set(sz * 0.1, 0, -sx * 0.1) // splayed a touch
    }
  rbox(1.3, 0.3, 1.2, terracotta, 0, 0.45, 0, chair) // frame
  rbox(0.98, 0.2, 0.88, terracottaSoft, 0, 0.7, 0.1, chair, 0.08) // seat cushion
  const back = rbox(1.3, 0.95, 0.3, terracotta, 0, 1.0, -0.47, chair)
  back.rotation.x = -0.16
  const backCushion = rbox(0.96, 0.6, 0.2, cream, 0, 1.06, -0.3, chair, 0.08)
  backCushion.rotation.x = -0.16
  for (const s of [-1, 1]) rbox(0.22, 0.5, 1.0, terracotta, s * 0.55, 0.75, 0.05, chair)
  const pillow = rbox(0.4, 0.4, 0.13, navy, 0.3, 1.0, -0.1, chair, 0.05)
  pillow.rotation.set(-0.35, -0.35, 0.2)
  small(pillow)

  // ---------- Side table with a lamp ----------
  const T = READING.table
  cyl(0.4, 0.4, 0.06, walnut, T.x, 0.77, T.z, corner, 28)
  cyl(0.045, 0.045, 0.74, dark, T.x, 0.37, T.z, corner, 10)
  cyl(0.27, 0.29, 0.04, dark, T.x, 0.02, T.z, corner, 24).castShadow = false
  // A book and the lamp
  box(0.26, 0.04, 0.34, mat('#3a3f55', { roughness: 0.85 }), T.x + 0.15, 0.82, T.z - 0.12, corner).rotation.y = 0.5
  small(cyl(0.1, 0.12, 0.05, brass, T.x - 0.1, 0.83, T.z + 0.06, corner, 16))
  small(cyl(0.016, 0.016, 0.42, brass, T.x - 0.1, 1.07, T.z + 0.06, corner, 8))
  const shadeMat = track(new THREE.MeshStandardMaterial({ color: '#f3e3c4', emissive: '#ffb27a', emissiveIntensity: 0, roughness: 0.9, side: THREE.DoubleSide }))
  const shade = mesh(new THREE.CylinderGeometry(0.15, 0.24, 0.3, 24, 1, true), shadeMat, T.x - 0.1, 1.38, T.z + 0.06, corner)
  shade.name = 'Reading lamp shade'
  shade.castShadow = false
  // No shadow from this light: a point light's shadow is six extra renders of the scene.
  const light = new THREE.PointLight('#ffb27a', 0, 6.5, 1.6)
  light.position.set(T.x - 0.1, 1.35, T.z + 0.06)
  corner.add(light)

  // ---------- Record cabinet, turntable on top (built facing +z, long along x, then turned to face -x) ----------
  const C = READING.cabinet
  const cab = new THREE.Group()
  cab.name = 'Record cabinet'
  cab.position.set(C.x, 0, C.z)
  cab.rotation.y = -Math.PI / 2
  corner.add(cab)
  const L = C.len
  const D = C.depth
  tbox(L, 0.05, D, walnut, 0, 0.8, 0, 1.2, cab) // top
  tbox(L - 0.08, 0.04, D - 0.04, walnut, 0, 0.24, 0, 1.2, cab) // base shelf
  tbox(L, 0.58, 0.03, walnut, 0, 0.52, -D / 2 + 0.015, 1.2, cab) // back
  for (const sx of [-1, 1]) tbox(0.04, 0.6, D, walnut, (sx * (L - 0.04)) / 2, 0.52, 0, 1.2, cab)
  const inner = L - 0.08
  const cubby = inner / 3
  for (const i of [1, 2]) tbox(0.03, 0.56, D - 0.04, walnut, -inner / 2 + cubby * i, 0.52, 0, 1.2, cab)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.025, 0.018, 0.23, dark, sx * (L / 2 - 0.12), 0.115, sz * (D / 2 - 0.1), cab, 8).castShadow = false
  // Records standing in each cubby, edge-on: a row of coloured sleeves. A couple lean over at the end.
  const r = mulberry32(88)
  const sleeveMats = SLEEVES.map((c) => mat(c, { roughness: 0.8 }))
  for (let c = 0; c < 3; c++) {
    const x0 = -inner / 2 + cubby * c + 0.04
    const n = 14 - c * 2 // the last cubby is half empty
    for (let i = 0; i < n; i++) {
      const lean = i >= n - 2 && c < 2 ? 0.2 : 0
      const rec = box(0.03, 0.46, 0.44, sleeveMats[Math.floor(r() * sleeveMats.length)], x0 + 0.03 + i * 0.047 + lean * 0.12, 0.28 + 0.23, 0.02, cab)
      rec.rotation.z = lean
      rec.castShadow = false
    }
  }
  // On top: speakers at each end, the turntable between them, and a vase.
  const top = 0.825
  const speakerMat = mat('#2b2a30', { roughness: 0.7 })
  for (const sx of [-1, 1]) {
    const sx0 = sx * (L / 2 - 0.2)
    rbox(0.34, 0.6, 0.32, speakerMat, sx0, top + 0.3, 0.02, cab, 0.03)
    cyl(0.1, 0.1, 0.02, dark, sx0, top + 0.22, 0.19, cab, 18).rotation.x = Math.PI / 2
    cyl(0.035, 0.035, 0.02, dark, sx0, top + 0.46, 0.19, cab, 12).rotation.x = Math.PI / 2
  }
  const TX = -0.05
  rbox(0.9, 0.07, 0.5, mat('#2a2220', { roughness: 0.5 }), TX, top + 0.035, 0, cab, 0.02).castShadow = false
  const platter = mat('#9a9ea8', { roughness: 0.3, metalness: 0.7 })
  const vinyl = mat('#0e0e12', { roughness: 0.25, metalness: 0.2 })
  small(cyl(0.2, 0.2, 0.025, platter, TX - 0.12, top + 0.085, 0.01, cab, 28))
  small(cyl(0.19, 0.19, 0.012, vinyl, TX - 0.12, top + 0.104, 0.01, cab, 28))
  small(cyl(0.065, 0.065, 0.014, mat('#d9825b', { roughness: 0.6 }), TX - 0.12, top + 0.112, 0.01, cab, 16))
  // The tonearm: a pivot at the back corner and a thin arm laid over the record.
  const pivot = new THREE.Group()
  pivot.position.set(TX + 0.3, top + 0.1, -0.15)
  pivot.rotation.y = Math.atan2(-0.24, -0.34) // points towards the record's edge
  cab.add(pivot)
  small(cyl(0.03, 0.03, 0.05, platter, 0, 0, 0, pivot, 12))
  const arm = small(cyl(0.007, 0.007, 0.32, platter, 0.16, 0.02, 0, pivot, 6))
  arm.rotation.z = Math.PI / 2
  small(box(0.05, 0.015, 0.03, dark, 0.32, 0.02, 0, pivot))
  // A small vase with dried stems.
  small(mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.26, 14), mat('#e7e1d5', { roughness: 0.5 }), L / 2 - 0.55, top + 0.13, 0.02, cab))
  for (let i = 0; i < 5; i++) {
    const stem = small(cyl(0.006, 0.006, 0.5, mat('#b59a63', { roughness: 0.9 }), L / 2 - 0.55 + (i - 2) * 0.025, top + 0.5, 0.02, cab, 4))
    stem.rotation.z = (i - 2) * 0.13
  }

  // ---------- Prints above the cabinet (on the right wall, so they come and go with it) ----------
  const frame = mat('#15161b', { roughness: 0.4 })
  const mount = mat('#fbfaf6', { roughness: 0.9 })
  const arts = ['#2f45ff', '#d9825b', '#1f7a56']
  arts.forEach((c, i) => {
    const z = C.z + (i - 1) * 0.72
    const f = box(0.04, 0.62, 0.62, frame, 5.975, 2.4, z, wall)
    f.castShadow = false
    box(0.03, 0.5, 0.5, mount, 5.96, 2.4, z, wall).castShadow = false
    const disc = mesh(new THREE.CircleGeometry(0.17, 24), mat(c, { roughness: 0.7 }), 5.94, 2.4, z, wall)
    disc.rotation.y = -Math.PI / 2
    disc.castShadow = false
  })

  return {
    corner,
    /** The reading lamp comes on in the evening. */
    setNight(night: boolean) {
      light.intensity = night ? 9 : 0
      shadeMat.emissiveIntensity = night ? 1.6 : 0
    },
  }
}

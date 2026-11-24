import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Kit } from './kit'
import { canvasTexture, mulberry32 } from './textures'
import { FIRE, HAMMOCK, fireSeatAt } from './layout'

// What the far end of the garden holds: a hammock between two trees and a fire pit with seats (the pond is in pond.ts).
// Static pieces share materials, so merge.ts fuses them with the rest of the garden;
// whatever moves (the hammock, the flames) is handed back in `moving` so it is left alone.

/** Bands along the length of the hammock. */
function hammockTexture() {
  const r = mulberry32(14)
  return canvasTexture(64, 64, (x) => {
    const bands = ['#f1ece2', '#d9825b', '#f1ece2', '#2f3b68', '#f1ece2', '#d9825b', '#f1ece2']
    bands.forEach((c, i) => {
      x.fillStyle = c
      x.fillRect(0, (i / bands.length) * 64, 64, 64 / bands.length + 1)
    })
    for (let i = 0; i < 600; i++) {
      x.fillStyle = `rgba(60,40,20,${r() * 0.06})`
      x.fillRect(r() * 64, r() * 64, 1, 1)
    }
  })
}

export function buildFeatures(k: Kit, garden: THREE.Group, bark: THREE.Material) {
  const { track, rand, mat, mesh } = k
  const moving: THREE.Object3D[] = []
  /** Bake a few meshes into one geometry (they will always move as one). */
  const bake = (items: THREE.Mesh[]) => {
    const geos = items.map((m) => {
      m.updateMatrix()
      return m.geometry.clone().applyMatrix4(m.matrix)
    })
    const merged = mergeGeometries(geos)!
    geos.forEach((g) => g.dispose())
    items.forEach((m) => m.geometry.dispose())
    return track(merged)
  }

  // Stones for the fire pit's edge.
  const rock = mat('#a8a39a', { roughness: 0.95 })
  const rockDark = mat('#8d8a84', { roughness: 0.95 })
  const rockGeo = track(new THREE.DodecahedronGeometry(1, 0))

  // ---------- Hammock ----------
  const hammock = new THREE.Group()
  hammock.name = 'Hammock'
  const span = HAMMOCK.xa - HAMMOCK.xb
  hammock.position.set((HAMMOCK.xa + HAMMOCK.xb) / 2, HAMMOCK.y, HAMMOCK.z)
  garden.add(hammock)
  moving.push(hammock)
  const SAG = 0.95
  const U = 28
  const V = 8
  const cloth = track(new THREE.BufferGeometry())
  {
    const pos: number[] = []
    const uv: number[] = []
    for (let i = 0; i <= U; i++) {
      const u = i / U
      const s = Math.sin(Math.PI * u)
      const w = 0.98 * (0.24 + 0.76 * Math.pow(s, 0.45))
      for (let j = 0; j <= V; j++) {
        const v = (j / V) * 2 - 1
        pos.push((0.5 - u) * span, -SAG * s + 0.2 * v * v * s, (v * w) / 2)
        uv.push(u * 2, j / V)
      }
    }
    const index: number[] = []
    for (let i = 0; i < U; i++)
      for (let j = 0; j < V; j++) {
        const a = i * (V + 1) + j
        const b = a + V + 1
        index.push(a, a + 1, b, a + 1, b + 1, b) // faces up
      }
    cloth.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    cloth.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    cloth.setIndex(index)
    cloth.computeVertexNormals()
  }
  const clothMat = track(new THREE.MeshStandardMaterial({ map: track(hammockTexture()), roughness: 0.95, side: THREE.DoubleSide }))
  const body = new THREE.Mesh(cloth, clothMat)
  body.name = 'Hammock cloth'
  body.castShadow = false // soft and thin; the shadow map is not redrawn as it sways
  body.receiveShadow = true
  hammock.add(body)
  // Hardware: a ring at each hook, and two ropes from it to the cloth's gathered ends.
  const rope = mat('#d8c9a8', { roughness: 1 })
  const bits: THREE.Mesh[] = []
  for (const sx of [-1, 1]) {
    const hx = sx * (span / 2)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 12), rope)
    ring.position.set(hx, 0, 0)
    ring.rotation.y = Math.PI / 2
    bits.push(ring)
    for (const sz of [-1, 1]) {
      const ex = sx * (span / 2 - 0.42)
      const len = Math.hypot(hx - ex, 0.2)
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, len, 4), rope)
      line.position.set((hx + ex) / 2, -0.1, sz * 0.09)
      line.rotation.z = Math.PI / 2 + Math.atan2(0.2, Math.abs(hx - ex)) * sx
      bits.push(line)
    }
  }
  const hardware = new THREE.Mesh(bake(bits), rope)
  hardware.castShadow = false
  hammock.add(hardware)
  // A cushion at the near end.
  const pillow = new THREE.Mesh(track(new RoundedBoxGeometry(0.5, 0.17, 0.34, 2, 0.07)), mat('#f1ece2', { roughness: 1 }))
  pillow.position.set(span * 0.26, -SAG * Math.sin(Math.PI * 0.24) + 0.13, 0)
  pillow.rotation.z = 0.28
  pillow.castShadow = false
  hammock.add(pillow)

  // ---------- Fire pit ----------
  const fire = new THREE.Group()
  fire.name = 'Fire pit'
  fire.position.set(FIRE.x, -0.03, FIRE.z)
  garden.add(fire)
  const ash = mat('#1f1b19', { roughness: 1 })
  mesh(track(new THREE.CylinderGeometry(0.68, 0.68, 0.05, 24)), ash, 0, 0.025, 0, fire).castShadow = false
  const emberMat = track(new THREE.MeshStandardMaterial({ color: '#2a1a14', emissive: '#ff5a1a', emissiveIntensity: 0, roughness: 0.9 }))
  const embers = mesh(track(new THREE.CylinderGeometry(0.4, 0.4, 0.02, 16)), emberMat, 0, 0.06, 0, fire)
  embers.castShadow = false
  embers.userData.noMerge = true
  // Two courses of stones round the edge.
  for (let layer = 0; layer < 2; layer++) {
    const n = layer ? 11 : 13
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + layer * 0.24
      const s = 0.2 + rand() * 0.05
      const st = new THREE.Mesh(rockGeo, (i + layer) % 3 ? rock : rockDark)
      st.position.set(Math.cos(a) * 0.76, 0.1 + layer * 0.17, Math.sin(a) * 0.76)
      st.rotation.set(rand() * 3, -a + (rand() - 0.5) * 0.4, rand() * 3)
      st.scale.set(s * 1.1, s * 0.85, s * 1.25)
      st.castShadow = layer === 0 && i % 2 === 0
      st.receiveShadow = true
      fire.add(st)
    }
  }
  // Logs standing against each other.
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3
    const lean = 0.5 + rand() * 0.15
    const dir = new THREE.Vector3(-Math.cos(a) * Math.sin(lean), Math.cos(lean), -Math.sin(a) * Math.sin(lean))
    const len = 0.85 + rand() * 0.2
    const log = new THREE.Mesh(track(new THREE.CylinderGeometry(0.065, 0.075, len, 7)), bark)
    log.position.set(Math.cos(a) * 0.42, 0.07, Math.sin(a) * 0.42).addScaledVector(dir, len / 2)
    log.quaternion.setFromUnitVectors(up, dir)
    log.castShadow = false
    log.receiveShadow = true
    fire.add(log)
  }
  // Seats: stumps (sat on from the first two) and long logs.
  const stumpWood = mat('#cfae82', { roughness: 0.85 })
  FIRE.seats.forEach((seat, i) => {
    const { x, z } = fireSeatAt(i)
    const lx = x - FIRE.x
    const lz = z - FIRE.z
    if (seat.kind === 'stump') {
      const stump = mesh(track(new THREE.CylinderGeometry(0.3, 0.34, 0.52, 14)), [bark, stumpWood, bark], lx, 0.26, lz, fire)
      stump.scale.set(1 + (i % 2) * 0.1, 1, 1)
      stump.castShadow = false
    } else {
      const log = mesh(track(new THREE.CylinderGeometry(0.22, 0.22, 1.2, 12)), [bark, stumpWood, stumpWood], lx, 0.22, lz, fire)
      log.rotation.set(0, Math.atan2(-Math.cos(seat.angle), -Math.sin(seat.angle)), Math.PI / 2)
      log.castShadow = false
    }
  })

  // Night only: flames (a few tongues, baked into two shapes that flicker as wholes), sparks and the light.
  const flames = new THREE.Group()
  flames.position.y = 0.1
  flames.visible = false
  fire.add(flames)
  moving.push(flames)
  const tongues = (count: number, r: number, h: number, spread: number) => {
    const items: THREE.Mesh[] = []
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + 0.4
      const hh = h * (0.7 + rand() * 0.5)
      const t = new THREE.Mesh(new THREE.ConeGeometry(r * (0.8 + rand() * 0.4), hh, 7, 1), undefined)
      t.position.set(Math.cos(a) * spread, hh / 2, Math.sin(a) * spread)
      t.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18)
      items.push(t)
    }
    return bake(items)
  }
  const flameMat = (color: string, opacity: number) => track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }))
  const outer = new THREE.Mesh(tongues(5, 0.2, 0.8, 0.2), flameMat('#ff6a1a', 0.8))
  const inner = new THREE.Mesh(tongues(3, 0.13, 0.55, 0.08), flameMat('#ffd27a', 0.85))
  outer.userData.noMerge = inner.userData.noMerge = true
  flames.add(outer, inner)
  const SPARKS = 16
  const sparkGeo = track(new THREE.BufferGeometry())
  const sparkPos = new Float32Array(SPARKS * 3)
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3))
  const sparkSeed = Array.from({ length: SPARKS }, () => [rand() * 6.28, 0.1 + rand() * 0.25, rand()])
  const sparkMat = track(new THREE.PointsMaterial({ color: '#ffb347', size: 0.06, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }))
  const sparks = new THREE.Points(sparkGeo, sparkMat)
  sparks.frustumCulled = false
  flames.add(sparks)
  const fireLight = new THREE.PointLight('#ff8a3d', 0, 12, 1.5)
  fireLight.position.set(FIRE.x, 0.9, FIRE.z)
  garden.add(fireLight)
  let night = false
  let flicker = 0

  return {
    /** Things in here that move on their own, which merge.ts must leave alone. */
    moving,
    setNight(n: boolean) {
      night = n
      flames.visible = n
      fireLight.intensity = n ? 26 : 0
      emberMat.emissiveIntensity = n ? 1.6 : 0.05
      if (!n) flicker = 0
    },
    update(t: number) {
      // The hammock rocks a little on its hooks.
      hammock.rotation.x = Math.sin(t * 0.55) * 0.035
      if (!night) return
      flicker = Math.sin(t * 11) * 0.5 + Math.sin(t * 17.3 + 1) * 0.3 + Math.sin(t * 5.1) * 0.2
      fireLight.intensity = 26 + flicker * 6
      outer.scale.set(1 + flicker * 0.06, 1 + flicker * 0.22, 1 + flicker * 0.06)
      outer.rotation.y = t * 0.8
      inner.scale.set(1 - flicker * 0.05, 1 + flicker * 0.3, 1 - flicker * 0.05)
      inner.rotation.y = -t * 1.1
      emberMat.emissiveIntensity = 1.5 + flicker * 0.3
      for (let i = 0; i < SPARKS; i++) {
        const [ph, r, off] = sparkSeed[i]
        const life = (t * 0.35 + off) % 1
        sparkPos[i * 3] = Math.cos(ph + t * 0.5) * (r + life * 0.25)
        sparkPos[i * 3 + 1] = 0.5 + life * 1.5
        sparkPos[i * 3 + 2] = Math.sin(ph + t * 0.5) * (r + life * 0.25)
      }
      sparkGeo.attributes.position.needsUpdate = true
      sparkMat.opacity = 0.85
    },
  }
}

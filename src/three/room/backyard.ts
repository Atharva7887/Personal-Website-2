import * as THREE from 'three'
import type { Kit } from './kit'
import { woodTexture } from './textures'
import { DECK, GARDEN, NEIGHBOUR, SHED, isFree } from './layout'

// The backyard: a timber deck outside the door, a shed in the corner, the neighbour's house over the back
// hedge, and a dog who wanders the lawn. All built here, in the room's own style.

export function buildBackyard(k: Kit, garden: THREE.Group) {
  const { track, rand, mat, mesh, box, tbox } = k

  // ---------- Deck ----------
  const deckWood = mat('#ffffff', { map: track(woodTexture(28, 34, 44, 41)), roughness: 0.8 })
  const deckFrame = mat('#6b4a33', { roughness: 0.9 })
  const DW = DECK.x1 - DECK.x0
  const DD = DECK.z1 - DECK.z0
  const top = DECK.y - 0.03 // the lawn is at -0.03
  // The frame under the boards, then the boards (running out from the house, with gaps between).
  box(DW, DECK.y - 0.05, DD, deckFrame, (DECK.x0 + DECK.x1) / 2, (DECK.y - 0.05) / 2 - 0.03, (DECK.z0 + DECK.z1) / 2, garden).castShadow = false
  const BOARD = 0.3
  const boards = Math.floor(DD / BOARD)
  for (let i = 0; i < boards; i++) {
    const z = DECK.z0 + BOARD / 2 + i * BOARD + (DD - boards * BOARD) / 2
    const b = tbox(DW, 0.05, BOARD - 0.035, deckWood, (DECK.x0 + DECK.x1) / 2, top - 0.025, z, 3, garden)
    b.castShadow = false
  }
  // A step down to the lawn on the garden side.
  tbox(0.42, 0.1, 1.3, deckWood, DECK.x0 - 0.21, 0.02, 2.75, 3, garden)

  // ---------- Shed ----------
  const shed = new THREE.Group()
  shed.name = 'Shed'
  shed.position.set(SHED.x, -0.03, SHED.z)
  garden.add(shed)
  const sage = mat('#7f9c8f', { roughness: 0.85 })
  const trim = mat('#f1ece2', { roughness: 0.7 })
  const shingle = mat('#3f3e46', { roughness: 0.9 })
  const WH = 2.0 // wall height
  box(SHED.w, WH, SHED.d, sage, 0, WH / 2, 0, shed)
  // Vertical boards: thin battens over the walls.
  for (let i = 0; i <= 8; i++) {
    const x = -SHED.w / 2 + (i / 8) * SHED.w
    box(0.04, WH, 0.03, sage, x, WH / 2, SHED.d / 2 + 0.015, shed)
    box(0.04, WH, 0.03, sage, x, WH / 2, -SHED.d / 2 - 0.015, shed)
  }
  // Gables front and back, and a pitched roof with the ridge running front to back.
  const RISE = 0.85
  const gable = new THREE.Shape([new THREE.Vector2(-SHED.w / 2, 0), new THREE.Vector2(SHED.w / 2, 0), new THREE.Vector2(0, RISE)])
  const gableGeo = track(new THREE.ShapeGeometry(gable))
  for (const s of [1, -1]) {
    const g = new THREE.Mesh(gableGeo, sage)
    g.position.set(0, WH, (s * SHED.d) / 2)
    if (s < 0) g.rotation.y = Math.PI
    g.castShadow = true
    shed.add(g)
  }
  const slope = Math.hypot(SHED.w / 2 + 0.2, RISE + 0.12)
  const ang = Math.atan2(RISE + 0.12, SHED.w / 2 + 0.2)
  for (const s of [1, -1]) {
    const r = box(slope, 0.07, SHED.d + 0.4, shingle, (s * (SHED.w / 2 + 0.2)) / 2, WH + RISE / 2 + 0.02, 0, shed)
    r.rotation.z = -s * ang
  }
  // Door with a little window beside it.
  box(0.8, 1.6, 0.05, mat('#5a6f66', { roughness: 0.8 }), -0.35, 0.82, SHED.d / 2 + 0.04, shed)
  box(0.86, 1.66, 0.03, trim, -0.35, 0.83, SHED.d / 2 + 0.02, shed)
  cyl(0.03, 0.03, 0.05, mat('#c9a35b', { metalness: 0.8, roughness: 0.3 }), -0.05, 0.85, SHED.d / 2 + 0.08)
  function cyl(rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number) {
    const c = mesh(new THREE.CylinderGeometry(rt, rb, h, 10), m, x, y, z, shed)
    c.rotation.x = Math.PI / 2
    return c
  }
  box(0.56, 0.5, 0.04, trim, 0.55, 1.25, SHED.d / 2 + 0.03, shed)
  const shedPane = track(new THREE.MeshStandardMaterial({ color: '#9fb4c8', roughness: 0.2, emissive: '#ffc77a', emissiveIntensity: 0 }))
  box(0.46, 0.4, 0.02, shedPane, 0.55, 1.25, SHED.d / 2 + 0.055, shed).castShadow = false
  // A watering can and a couple of pots by the door.
  const terracotta = mat('#b8623f', { roughness: 0.9 })
  for (const [x, s] of [
    [0.75, 1],
    [0.98, 0.75],
  ] as const) {
    const p = mesh(new THREE.CylinderGeometry(0.16 * s, 0.12 * s, 0.26 * s, 14), terracotta, x, 0.13 * s, SHED.d / 2 + 0.35, shed)
    p.castShadow = true
  }
  const can = mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.3, 16), mat('#3f6fb0', { roughness: 0.5, metalness: 0.3 }), -1.0, 0.15, SHED.d / 2 + 0.4, shed)
  const spout = mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.32, 8), can.material as THREE.Material, -1.2, 0.27, SHED.d / 2 + 0.4, shed)
  spout.rotation.z = 0.9

  // ---------- The neighbour's house, over the back hedge ----------
  const nb = new THREE.Group()
  nb.name = 'Neighbour'
  garden.add(nb)
  // Their own patch of lawn, so the house has something to stand on.
  const NB_Z0 = NEIGHBOUR.z - NEIGHBOUR.d / 2 - 2.2
  const nbSoil = mat('#5b4030', { roughness: 1 })
  const nbLawn = box(GARDEN.x1 - 1.6 - GARDEN.x0, 0.2, GARDEN.z0 - NB_Z0, [nbSoil, nbSoil, mat('#6c8f55', { roughness: 1 }), nbSoil, nbSoil, nbSoil], (GARDEN.x0 + GARDEN.x1 - 1.6) / 2, -0.13, (GARDEN.z0 + NB_Z0) / 2, nb)
  nbLawn.castShadow = false
  const render = mat('#d8cdbd', { roughness: 0.95 })
  const roofMat = mat('#5c4740', { roughness: 0.85 })
  const H = 5.0
  const front = NEIGHBOUR.z + NEIGHBOUR.d / 2
  box(NEIGHBOUR.w, H, NEIGHBOUR.d, render, NEIGHBOUR.x, H / 2 - 0.03, NEIGHBOUR.z, nb)
  // Gable roof, ridge along x.
  const NR = 1.9
  const nbGable = new THREE.Shape([new THREE.Vector2(-NEIGHBOUR.d / 2, 0), new THREE.Vector2(NEIGHBOUR.d / 2, 0), new THREE.Vector2(0, NR)])
  const nbGableGeo = track(new THREE.ShapeGeometry(nbGable))
  for (const s of [1, -1]) {
    const g = new THREE.Mesh(nbGableGeo, render)
    g.position.set(NEIGHBOUR.x + (s * NEIGHBOUR.w) / 2, H - 0.03, NEIGHBOUR.z)
    g.rotation.y = (s * Math.PI) / 2
    nb.add(g)
  }
  const nbSlope = Math.hypot(NEIGHBOUR.d / 2 + 0.35, NR + 0.2)
  const nbAng = Math.atan2(NR + 0.2, NEIGHBOUR.d / 2 + 0.35)
  for (const s of [1, -1]) {
    const r = box(NEIGHBOUR.w + 0.5, 0.12, nbSlope, roofMat, NEIGHBOUR.x, H + NR / 2 - 0.05, NEIGHBOUR.z + (s * (NEIGHBOUR.d / 2 + 0.35)) / 2, nb)
    r.rotation.x = s * nbAng
  }
  box(0.5, 1.6, 0.5, mat('#8a5a46', { roughness: 0.9 }), NEIGHBOUR.x + 1.9, H + 1.4, NEIGHBOUR.z - 0.6, nb) // chimney
  // Windows on the side facing the garden: two floors of three, a door in the middle below.
  const frame = mat('#f4f1ea', { roughness: 0.6 })
  const lit = track(new THREE.MeshStandardMaterial({ color: '#8fa6bd', roughness: 0.15, metalness: 0.2, emissive: '#ffc27a', emissiveIntensity: 0 }))
  const dark = track(new THREE.MeshStandardMaterial({ color: '#7f95ab', roughness: 0.15, metalness: 0.2, emissive: '#ffc27a', emissiveIntensity: 0 }))
  const windows: [number, number, boolean][] = [
    [-2.0, 1.5, true],
    [2.0, 1.5, false],
    [-2.0, 3.6, false],
    [0, 3.6, true],
    [2.0, 3.6, true],
  ]
  for (const [dx, y, on] of windows) {
    box(1.1, 1.3, 0.06, frame, NEIGHBOUR.x + dx, y, front + 0.02, nb)
    box(0.94, 1.14, 0.04, on ? lit : dark, NEIGHBOUR.x + dx, y, front + 0.05, nb).castShadow = false
    box(0.04, 1.14, 0.03, frame, NEIGHBOUR.x + dx, y, front + 0.075, nb)
    box(0.94, 0.04, 0.03, frame, NEIGHBOUR.x + dx, y, front + 0.075, nb)
  }
  box(1.0, 2.1, 0.08, mat('#3d5a73', { roughness: 0.6 }), NEIGHBOUR.x, 1.03, front + 0.03, nb) // door
  const porchMat = track(new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffb86b', emissiveIntensity: 0, roughness: 0.4 }))
  box(0.16, 0.22, 0.12, porchMat, NEIGHBOUR.x + 0.75, 2.3, front + 0.1, nb).castShadow = false
  const porchLight = new THREE.PointLight('#ffb86b', 0, 6, 1.8)
  porchLight.position.set(NEIGHBOUR.x + 0.75, 2.2, front + 0.6)
  nb.add(porchLight)

  // ---------- Dog ----------
  const dog = buildDog(k)
  garden.add(dog.root)

  return {
    dog: dog.root,
    /** The neighbour's house steps aside when the camera swings round behind it (like the room's back wall). */
    showNeighbour(viewer: THREE.Vector3) {
      nb.visible = viewer.z > NEIGHBOUR.z - NEIGHBOUR.d / 2 - 0.5
    },
    neighbourVisible: () => nb.visible,
    setNight(night: boolean) {
      lit.emissiveIntensity = night ? 1.6 : 0
      porchMat.emissiveIntensity = night ? 2.2 : 0
      porchLight.intensity = night ? 6 : 0
      shedPane.emissiveIntensity = night ? 0.5 : 0
    },
    update(t: number, dt: number, viewer: THREE.Vector3) {
      dog.update(t, dt, viewer)
    },
    /** A click on the dog: a happy hop. */
    poke(ray: THREE.Raycaster) {
      if (!ray.intersectObject(dog.root, true).length) return false
      dog.hop()
      return true
    },
  }

  /** A friendly, slightly round dog, built from capsules. Wanders, sniffs, sits; comes over to say hello. */
  function buildDog(kit: Kit) {
    const coat = kit.mat('#ead6ad', { roughness: 0.95 })
    const ear = kit.mat('#cf9f62', { roughness: 0.95 })
    const black = kit.mat('#1e1a19', { roughness: 0.4 })
    const root = new THREE.Group()
    root.name = 'Dog'
    const body = new THREE.Group() // everything above the legs, tilts when sitting
    body.position.y = 0.62
    root.add(body)
    const torso = kit.mesh(new THREE.CapsuleGeometry(0.19, 0.5, 6, 14), coat, 0, 0, 0, body)
    torso.rotation.x = Math.PI / 2
    torso.scale.set(1, 1, 0.95)
    // Head
    const head = new THREE.Group()
    head.position.set(0, 0.2, 0.42)
    body.add(head)
    kit.mesh(new THREE.SphereGeometry(0.16, 16, 12), coat, 0, 0.04, 0, head).scale.set(1, 0.95, 1.05)
    const snout = kit.mesh(new THREE.CapsuleGeometry(0.075, 0.1, 4, 10), coat, 0, -0.02, 0.15, head)
    snout.rotation.x = Math.PI / 2
    kit.mesh(new THREE.SphereGeometry(0.035, 10, 8), black, 0, 0.0, 0.27, head)
    for (const s of [-1, 1]) {
      kit.mesh(new THREE.SphereGeometry(0.024, 8, 6), black, s * 0.065, 0.08, 0.13, head)
      const e = kit.mesh(new THREE.SphereGeometry(0.075, 10, 8), ear, s * 0.13, 0.04, -0.01, head)
      e.scale.set(0.45, 1.25, 0.8)
      e.rotation.z = s * 0.35
    }
    // Tail
    const tail = new THREE.Group()
    tail.position.set(0, 0.08, -0.42)
    body.add(tail)
    const tailMesh = kit.mesh(new THREE.CapsuleGeometry(0.04, 0.24, 4, 8), coat, 0, 0.13, -0.04, tail)
    tailMesh.rotation.x = -0.5
    // Legs: pivots at the hips and shoulders.
    const legs: THREE.Group[] = []
    for (const [x, z] of [
      [-0.11, 0.24],
      [0.11, 0.24],
      [-0.11, -0.24],
      [0.11, -0.24],
    ]) {
      const leg = new THREE.Group()
      leg.position.set(x, 0.52, z)
      root.add(leg)
      kit.mesh(new THREE.CapsuleGeometry(0.055, 0.34, 4, 8), coat, 0, -0.24, 0, leg)
      legs.push(leg)
    }
    // The dog moves, and the shadow map is only redrawn when the room changes, so it casts a soft blob
    // on the lawn instead of a real shadow.
    root.traverse((o) => ((o as THREE.Mesh).castShadow = false))
    const blobCanvas = document.createElement('canvas')
    blobCanvas.width = blobCanvas.height = 64
    const bc = blobCanvas.getContext('2d')!
    const grad = bc.createRadialGradient(32, 32, 2, 32, 32, 32)
    grad.addColorStop(0, 'rgba(0,0,0,0.55)')
    grad.addColorStop(0.6, 'rgba(0,0,0,0.25)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    bc.fillStyle = grad
    bc.fillRect(0, 0, 64, 64)
    const blobMat = kit.track(new THREE.MeshBasicMaterial({ map: kit.track(new THREE.CanvasTexture(blobCanvas)), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }))
    const blob = new THREE.Mesh(kit.track(new THREE.PlaneGeometry(1.5, 1.9)), blobMat)
    blob.rotation.x = -Math.PI / 2
    blob.position.set(0, 0.015, -0.05)
    blob.renderOrder = 1
    root.add(blob)
    root.position.set(-9.2, -0.03, 3.6)

    // Behaviour
    type State = 'walk' | 'sniff' | 'sit' | 'greet'
    let state: State = 'sit'
    let timer = 2
    const target = new THREE.Vector2(root.position.x, root.position.z)
    let heading = 0.6
    let walkPhase = 0
    let sitAmount = 1
    let hopT = 0
    let wagSpeed = 6
    const pickTarget = () => {
      for (let i = 0; i < 40; i++) {
        const x = GARDEN.x0 + 1.3 + rand() * (GARDEN.x1 - GARDEN.x0 - 2.0)
        const z = GARDEN.z0 + 1.3 + rand() * (GARDEN.z1 - GARDEN.z0 - 2.0)
        if (x > DECK.x0 - 0.6 && z > DECK.z0 - 0.5 && z < DECK.z1 + 0.5) continue // keep off the deck
        if (!isFree(x, z, 0.45)) continue
        // Straight line must stay clear.
        let clear = true
        for (let s = 1; s <= 10 && clear; s++) {
          const u = s / 10
          clear = isFree(root.position.x + (x - root.position.x) * u, root.position.z + (z - root.position.z) * u, 0.4)
        }
        if (!clear) continue
        target.set(x, z)
        return true
      }
      return false
    }
    const update = (t: number, dt: number, viewer: THREE.Vector3) => {
      const p = root.position
      const near = Math.hypot(viewer.x - p.x, viewer.z - p.z) < 2.6 && viewer.y < 4
      if (near && state !== 'greet') {
        state = 'greet'
        timer = 0
      }
      timer -= dt
      let moving = false
      if (state === 'greet') {
        // Turn to the visitor, sit, wag hard.
        const want = Math.atan2(viewer.x - p.x, viewer.z - p.z)
        heading += angleTo(heading, want) * Math.min(1, dt * 4)
        wagSpeed = 16
        if (!near) {
          state = 'sit'
          timer = 1.5
        }
      } else if (state === 'walk') {
        const dx = target.x - p.x
        const dz = target.y - p.z
        const d = Math.hypot(dx, dz)
        const want = Math.atan2(dx, dz)
        heading += angleTo(heading, want) * Math.min(1, dt * 3)
        if (d < 0.15) {
          state = rand() < 0.5 ? 'sniff' : 'sit'
          timer = 2 + rand() * 3
        } else {
          const speed = 0.9 * Math.max(0, Math.cos(angleTo(heading, want)))
          const nx = p.x + Math.sin(heading) * speed * dt
          const nz = p.z + Math.cos(heading) * speed * dt
          if (isFree(nx, nz, 0.4)) {
            p.x = nx
            p.z = nz
            moving = speed > 0.05
            walkPhase += dt * 9 * (speed / 0.9)
          } else {
            state = 'sit'
            timer = 1
          }
        }
        wagSpeed = 7
      } else if (timer <= 0) {
        state = pickTarget() ? 'walk' : 'sit'
        timer = 3
      } else {
        wagSpeed = state === 'sit' ? 9 : 5
      }
      root.rotation.y = heading
      const sitting = state === 'sit' || state === 'greet'
      sitAmount += ((sitting ? 1 : 0) - sitAmount) * Math.min(1, dt * 5)
      // Legs: diagonal pairs swing while walking; the back legs fold when sitting.
      legs.forEach((leg, i) => {
        const pair = i === 0 || i === 3 ? 0 : Math.PI
        const swing = moving ? Math.sin(walkPhase + pair) * 0.5 : 0
        leg.rotation.x = swing + (i >= 2 ? -1.1 * sitAmount : 0)
        leg.position.y = 0.52 - (i >= 2 ? 0.18 * sitAmount : 0)
      })
      body.rotation.x = -0.42 * sitAmount
      body.position.y = 0.62 - 0.08 * sitAmount + (moving ? Math.abs(Math.sin(walkPhase)) * 0.025 : 0)
      head.rotation.x = state === 'sniff' ? 0.75 + Math.sin(t * 7) * 0.08 : 0.32 * sitAmount
      head.rotation.y = state === 'sniff' ? Math.sin(t * 2) * 0.35 : 0
      tail.rotation.y = Math.sin(t * wagSpeed) * 0.6
      // The hop, when clicked.
      if (hopT > 0) {
        hopT = Math.max(0, hopT - dt * 2.2)
        root.position.y = -0.03 + Math.sin((1 - hopT) * Math.PI) * 0.35
      } else root.position.y = -0.03
      blob.position.y = 0.015 - (root.position.y + 0.03) // stays on the grass while the dog hops
    }
    return {
      root,
      update,
      hop() {
        hopT = 1
        wagSpeed = 18
      },
    }
  }
}

const angleTo = (from: number, to: number) => {
  let d = (to - from) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

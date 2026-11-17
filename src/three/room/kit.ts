import * as THREE from 'three'
import { mulberry32 } from './textures'

type Mats = THREE.Material | THREE.Material[]

/** Small building helpers shared by the room and the garden. Everything made here is disposed with the room. */
export function makeKit(scene: THREE.Scene) {
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(d: T) => {
    disposables.push(d)
    return d
  }
  const rand = mulberry32(2026)

  // Materials with the same colour and settings are one shared material (fewer programs and state changes,
  // and it lets static meshes be merged). Anything whose properties are changed later (emissive glow, a
  // colour set on hover) must pass { unique: true } or be made with `new` directly.
  const matCache = new Map<string, THREE.MeshStandardMaterial>()
  const matKey = (color: string, extra: THREE.MeshStandardMaterialParameters) =>
    color +
    Object.entries(extra)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]: [string, any]) => `|${k}=${v && v.isTexture ? v.uuid : v && v.isColor ? v.getHexString() : String(v)}`) // textures by identity, never serialised
      .join('')
  const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}, opts: { unique?: boolean } = {}) => {
    if (opts.unique) return track(new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra }))
    const key = matKey(color, extra)
    let m = matCache.get(key)
    if (!m) {
      m = track(new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra }))
      matCache.set(key, m)
    }
    return m
  }

  const mesh = (geo: THREE.BufferGeometry, m: Mats, x: number, y: number, z: number, parent: THREE.Object3D = scene) => {
    track(geo)
    const o = new THREE.Mesh(geo, m)
    o.position.set(x, y, z)
    o.castShadow = true
    o.receiveShadow = true
    parent.add(o)
    return o
  }

  const box = (w: number, h: number, d: number, m: Mats, x: number, y: number, z: number, parent: THREE.Object3D = scene) =>
    mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent)

  /** A box whose texture coordinates follow world position, so a tiling texture lines up across neighbouring boxes. */
  const tbox = (w: number, h: number, d: number, m: Mats, x: number, y: number, z: number, tile: number, parent: THREE.Object3D = scene) => {
    const geo = new THREE.BoxGeometry(w, h, d)
    const p = geo.attributes.position
    const n = geo.attributes.normal
    const uv = geo.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const wx = p.getX(i) + x
      const wy = p.getY(i) + y
      const wz = p.getZ(i) + z
      if (Math.abs(n.getX(i)) > 0.5) uv.setXY(i, wz / tile, wy / tile)
      else if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, wx / tile, wz / tile)
      else uv.setXY(i, wx / tile, wy / tile)
    }
    return mesh(geo, m, x, y, z, parent)
  }

  const cyl = (rTop: number, rBottom: number, h: number, m: Mats, x: number, y: number, z: number, parent: THREE.Object3D = scene, seg = 20) =>
    mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), m, x, y, z, parent)

  return { scene, track, rand, mat, mesh, box, tbox, cyl, dispose: () => disposables.forEach((d) => d.dispose()) }
}

export type Kit = ReturnType<typeof makeKit>

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Fewer, bigger draw calls: static meshes that share a material are baked into one mesh per material.
//
// Merging happens inside a container (a group that moves, hides or hovers as one thing), and the merged
// mesh is added to that same container. So lift and squash, visibility rules and picking still work on the
// group as before; only its insides are fused. Anything that moves on its own (a swinging door leaf, swaying
// plants, the dog, a tree crown) is passed in `skip` and left exactly as it is.

const KEEP = ['position', 'normal', 'uv']

type Part = { geo: THREE.BufferGeometry; material: THREE.Material; key: string; source: THREE.Mesh; mesh: THREE.Mesh }

/** Give every mesh in these trees the same material object when two materials are the same in every way that shows. */
export function dedupeMaterials(roots: THREE.Object3D[]) {
  const canon = new Map<string, THREE.Material>()
  const id = (t: THREE.Texture | null | undefined) => (t ? t.uuid : '-')
  const sig = (m: THREE.MeshStandardMaterial) =>
    [
      m.color.getHexString(), m.emissive.getHexString(), m.emissiveIntensity, m.roughness, m.metalness, m.opacity, m.transparent, m.alphaTest,
      m.side, m.flatShading, m.vertexColors, m.depthWrite, m.blending, m.envMapIntensity, m.bumpScale, m.normalScale.x, m.normalScale.y,
      id(m.map), id(m.normalMap), id(m.roughnessMap), id(m.metalnessMap), id(m.aoMap), id(m.emissiveMap), id(m.alphaMap), id(m.bumpMap),
    ].join('|')
  const same = (m: THREE.Material) => {
    const s = m as THREE.MeshStandardMaterial
    if (s.type !== 'MeshStandardMaterial' || Object.keys(s.userData).length) return m
    const key = sig(s)
    const known = canon.get(key)
    if (!known) {
      canon.set(key, m)
      return m
    }
    return known
  }
  for (const root of roots)
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(same) : same(mesh.material)
    })
}

export function mergeStatic(containers: THREE.Object3D[], skip: THREE.Object3D[], keepGeometry: (g: THREE.BufferGeometry) => void) {
  const skipSet = new Set<THREE.Object3D>(skip)
  const containerSet = new Set<THREE.Object3D>(containers)
  const stats = { before: 0, after: 0 }
  const rel = new THREE.Matrix4()

  for (const c of containers) {
    c.updateMatrixWorld(true)
    const inv = c.matrixWorld.clone().invert()
    const parts: Part[] = []
    const visit = (o: THREE.Object3D) => {
      for (const child of o.children) {
        if (skipSet.has(child) || containerSet.has(child) || !child.visible) continue
        const m = child as THREE.Mesh
        if (!m.isMesh) {
          visit(child)
          continue
        }
        if ((m as THREE.InstancedMesh).isInstancedMesh || (m as THREE.SkinnedMesh).isSkinnedMesh || m.children.length || m.userData.noMerge) continue
        if (m.matrixWorld.determinant() <= 0) continue // mirrored: the winding would flip
        const geo = m.geometry
        if (!geo.attributes.position) continue
        const mats = Array.isArray(m.material) ? m.material : [m.material]
        if (mats.some((x) => (x as THREE.MeshStandardMaterial).vertexColors)) continue
        const array = Array.isArray(m.material)
        if (array && !geo.index) continue
        rel.multiplyMatrices(inv, m.matrixWorld)
        const raycastable = m.raycast === THREE.Mesh.prototype.raycast
        const groups = array ? geo.groups : [{ start: 0, count: geo.index ? geo.index.count : geo.attributes.position.count, materialIndex: 0 }]
        for (const g of groups) {
          const material = mats[g.materialIndex ?? 0]
          if (!material) continue
          const piece = new THREE.BufferGeometry()
          for (const name of KEEP) if (geo.attributes[name]) piece.setAttribute(name, geo.attributes[name].clone())
          if (geo.index) piece.setIndex(new THREE.BufferAttribute(geo.index.array.slice(g.start, g.start + g.count), 1))
          else if (array) continue
          if (!piece.attributes.normal) piece.computeVertexNormals()
          if (!piece.attributes.uv) piece.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(piece.attributes.position.count * 2), 2))
          piece.applyMatrix4(rel)
          parts.push({ geo: piece, material, key: [material.uuid, m.castShadow, m.receiveShadow, raycastable, m.renderOrder].join('|'), source: m, mesh: m })
        }
      }
    }
    visit(c)

    const count = new Map<string, number>()
    for (const p of parts) count.set(p.key, (count.get(p.key) ?? 0) + 1)
    // A mesh with one material that nothing else shares gains nothing: leave it. (Multi-material boxes always
    // go in: their faces are separate draw calls today.)
    const buckets = new Map<string, Part[]>()
    const sources = new Set<THREE.Mesh>()
    for (const p of parts) {
      const multi = Array.isArray(p.source.material)
      if (!multi && (count.get(p.key) ?? 0) < 2) continue
      sources.add(p.source)
      let b = buckets.get(p.key)
      if (!b) buckets.set(p.key, (b = []))
      b.push(p)
    }
    const made: { geo: THREE.BufferGeometry; part: Part }[] = []
    let ok = true
    for (const b of buckets.values()) {
      const indexed = b.every((p) => p.geo.index)
      const list = b.map((p) => (indexed || !p.geo.index ? p.geo : p.geo.toNonIndexed()))
      const geo = mergeGeometries(list, false)
      if (!geo) {
        ok = false
        break
      }
      made.push({ geo, part: b[0] })
    }
    stats.before += sources.size
    if (!ok) {
      console.warn('Studio room: a merge failed, leaving that group as it was')
      made.forEach((m) => m.geo.dispose())
      continue
    }
    for (const s of sources) {
      s.removeFromParent()
      s.geometry.dispose()
    }
    for (const { geo, part } of made) {
      keepGeometry(geo)
      const merged = new THREE.Mesh(geo, part.material)
      merged.name = `Merged ${c.name || 'group'}`
      merged.castShadow = part.source.castShadow
      merged.receiveShadow = part.source.receiveShadow
      merged.renderOrder = part.source.renderOrder
      if (part.source.raycast !== THREE.Mesh.prototype.raycast) merged.raycast = part.source.raycast
      merged.matrixAutoUpdate = false // static from here on
      merged.updateMatrix()
      c.add(merged)
      stats.after++
    }
  }
  return stats
}

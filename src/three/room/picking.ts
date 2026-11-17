import * as THREE from 'three'
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'

// Below this a mesh is cheaper to test triangle by triangle than to build a tree for.
const MIN_TRIANGLES = 128

/**
 * Gives every mesh under `root` a bounding-volume tree, so a pointer ray visits a handful of triangles instead
 * of all of them. Only meshes that already use three's own raycast get one: the models' parts opt out of picking
 * (the pick boxes stand in for them), instanced meshes (the grass) keep their per-instance test, and tiny meshes
 * such as boxes are quicker without. Hits are the same as before, only found sooner.
 * Call it once the geometry is final: the tree does not follow later edits to the vertices.
 */
export function accelerateRaycasts(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || (m as THREE.SkinnedMesh).isSkinnedMesh) return
    if (m.raycast !== THREE.Mesh.prototype.raycast) return
    const geo = m.geometry
    if (!geo.boundsTree) {
      const triangles = (geo.index ? geo.index.count : geo.attributes.position.count) / 3
      if (triangles < MIN_TRIANGLES) return
      computeBoundsTree.call(geo)
    }
    m.raycast = acceleratedRaycast
  })
}

/** Frees the trees built by accelerateRaycasts (the geometry itself is disposed elsewhere). */
export function releaseRaycasts(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && m.geometry.boundsTree) disposeBoundsTree.call(m.geometry)
  })
}

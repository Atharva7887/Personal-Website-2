import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

/**
 * The glTF loader for the room's models. Their geometry is meshopt-compressed and their textures are KTX2
 * (scripts/room-assets/compress.mjs). The meshopt decoder is a few KB with its WebAssembly inlined. The Basis
 * transcoder (public/basis, copied from three) turns the KTX2 textures into whatever compressed format the GPU
 * reads directly, so they stay compressed in video memory too; it is fetched when the first texture needs it.
 */
export function createModelLoader(renderer: THREE.WebGLRenderer) {
  const ktx2 = new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer)
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx2)
  return { loader, dispose: () => ktx2.dispose() }
}

type Attribute = THREE.BufferAttribute | THREE.InterleavedBufferAttribute

const toFloat = (a: Attribute) => {
  const n = a.itemSize
  const out = new Float32Array(a.count * n)
  for (let i = 0; i < a.count; i++) {
    out[i * n] = a.getX(i)
    if (n > 1) out[i * n + 1] = a.getY(i)
    if (n > 2) out[i * n + 2] = a.getZ(i)
    if (n > 3) out[i * n + 3] = a.getW(i)
  }
  return new THREE.BufferAttribute(out, n)
}

const orig = new THREE.Matrix4()
const undo = new THREE.Matrix4()

/**
 * Undoes the quantisation of a freshly loaded model, so the rest of the room can treat it like any other mesh.
 *
 * The compressor stores vertices as 16-bit integers and moves the scale and offset that decode them onto each
 * node, which would change every node's position and scale and leave integer attributes that the merge step
 * and the instanced grass cannot handle. So: put each node's real transform back (the compressor saved it in
 * the node's extras), apply the difference to the geometry, and turn the attributes back into plain floats.
 * The result is what the model looked like before it was compressed.
 */
export function restoreModel(root: THREE.Object3D) {
  const done = new Set<THREE.BufferGeometry>()
  const floatify = (geo: THREE.BufferGeometry) => {
    for (const [name, attribute] of Object.entries(geo.attributes)) {
      if (!(attribute.array instanceof Float32Array) || attribute.normalized) geo.setAttribute(name, toFloat(attribute))
    }
  }
  root.traverse((node) => {
    const saved = node.userData.unquantised as { t: number[]; r: number[]; s: number[] } | undefined
    if (!saved) return
    node.updateMatrix()
    orig.compose(new THREE.Vector3().fromArray(saved.t), new THREE.Quaternion().fromArray(saved.r), new THREE.Vector3().fromArray(saved.s))
    undo.copy(orig).invert().multiply(node.matrix)
    // A node with several primitives is a group of meshes that carry no transform of their own.
    const meshes = (node as THREE.Mesh).isMesh ? [node as THREE.Mesh] : (node.children.filter((c) => (c as THREE.Mesh).isMesh && !c.userData.unquantised) as THREE.Mesh[])
    for (const m of meshes) {
      if (done.has(m.geometry)) continue
      done.add(m.geometry)
      floatify(m.geometry)
      m.geometry.applyMatrix4(undo)
    }
    node.position.fromArray(saved.t)
    node.quaternion.fromArray(saved.r)
    node.scale.fromArray(saved.s)
    node.updateMatrix()
  })
  // Anything the compressor left alone (a node with no saved transform) still needs plain floats.
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && !done.has(m.geometry)) floatify(m.geometry)
  })
}

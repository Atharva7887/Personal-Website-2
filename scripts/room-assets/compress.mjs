// Squeezes the Studio room's .glb files for the web: meshopt geometry and (optionally) KTX2 textures.
//
// Run it after prepare.py (which writes plain geometry and WebP textures to public/models):
//     node scripts/room-assets/compress.mjs public/models                   meshopt + KTX2
//     node scripts/room-assets/compress.mjs public/models --textures keep   meshopt only, textures untouched
//     node scripts/room-assets/compress.mjs <in-folder> --out <out-folder>  leave the inputs alone
//
// KTX2 needs the KTX-Software command line tools (toktx, v4.4+) on PATH:
//     https://github.com/KhronosGroup/KTX-Software/releases
// Files that are already meshopt-compressed are skipped, so re-running it is harmless (compressing twice
// would quantise twice). Draco input is read too (draco3dgltf is a dev dependency for that).
//
// What it does to each file:
//   1. converts textures to PNG for toktx, nudging any whose sides are not multiples of 4 (GPUs store compressed
//      textures in 4x4 blocks);
//   2. KTX2 (unless --textures keep), as ETC1S: small files, and the GPU keeps them compressed (1 byte a pixel
//      instead of 4). Normal maps get a higher quality than the rest. UASTC looks better still but was 5-10x the
//      size of the WebP it replaced, so it is only there as --normal-maps uastc. Colour spaces follow each map's
//      slot, so sRGB and linear stay right. This step is the glTF-Transform CLI;
//   3. reorders triangles for the GPU's vertex cache;
//   4. quantises vertex data to integers. glTF stores the position scale and offset on the node, so the
//      node's real transform is saved in its extras first and src/three/room/assets.ts puts it back on load;
//   5. writes the geometry with EXT_meshopt_compression.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRDracoMeshCompression } from '@gltf-transform/extensions'
import { quantize, reorder } from '@gltf-transform/functions'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i < 0 ? undefined : args.splice(i, 2)[1]
}
const textures = flag('--textures') ?? 'ktx2'
const outDir = flag('--out')
const quality = Number(flag('--quality') ?? 128) // ETC1S, 1-255
const normalMaps = flag('--normal-maps') ?? 'etc1s'
const normalQuality = Number(flag('--normal-quality') ?? 192)
const inDir = args[0]
if (!inDir || !['ktx2', 'keep'].includes(textures) || !['etc1s', 'uastc'].includes(normalMaps)) {
  console.error('usage: node compress.mjs <models folder> [--out <folder>] [--textures ktx2|keep] [--quality 1-255] [--normal-maps etc1s|uastc] [--normal-quality 1-255]')
  process.exit(1)
}
if (textures === 'ktx2' && spawnSync('toktx', ['--version'], { shell: true }).status !== 0) {
  console.error('toktx not found: install KTX-Software (https://github.com/KhronosGroup/KTX-Software/releases) and put its bin folder on PATH')
  process.exit(1)
}

const cli = fileURLToPath(new URL('../../node_modules/@gltf-transform/cli/bin/cli.js', import.meta.url))
const gltfTransform = (...a) => {
  const r = spawnSync(process.execPath, [cli, ...a], { stdio: ['ignore', 'inherit', 'inherit'] })
  if (r.status !== 0) throw new Error(`gltf-transform ${a[0]} failed`)
}

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready])
const dependencies = { 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder }
try {
  const draco3d = (await import('draco3dgltf')).default
  dependencies['draco3d.decoder'] = await draco3d.createDecoderModule()
} catch {
  // No Draco support: only needed for models exported with Draco.
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies(dependencies)

const nearest4 = (n) => Math.max(4, Math.round(n / 4) * 4)
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'room-compress-'))
const stage = (name, n) => path.join(scratch, `${n}-${name}`)

for (const file of fs.readdirSync(inDir).filter((f) => f.endsWith('.glb'))) {
  const src = path.join(inDir, file)
  const dst = path.join(outDir ?? inDir, file)
  const before = fs.statSync(src).size
  let doc = await io.read(src)
  if (doc.getRoot().listExtensionsUsed().some((e) => e.extensionName === 'EXT_meshopt_compression')) {
    console.log(`${file}: already meshopt-compressed, skipped`)
    continue
  }
  // The decoder is only needed to read: writing must not try to encode with Draco.
  doc.getRoot().listExtensionsUsed().filter((e) => e instanceof KHRDracoMeshCompression).forEach((e) => e.dispose())

  for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh()) continue
    node.setExtras({ ...node.getExtras(), unquantised: { t: node.getTranslation(), r: node.getRotation(), s: node.getScale() } })
  }
  if (textures === 'ktx2') {
    // toktx reads PNG and JPEG but not WebP, so every texture goes through sharp as a lossless PNG.
    for (const t of doc.getRoot().listTextures()) {
      const [w, h] = t.getSize() ?? [0, 0]
      const to = nearest4(w) === w && nearest4(h) === h ? [w, h] : [nearest4(w), nearest4(h)]
      const png = await sharp(Buffer.from(t.getImage())).resize(to[0], to[1], { fit: 'fill' }).png().toBuffer()
      t.setImage(new Uint8Array(png)).setMimeType('image/png')
      if (to[0] !== w || to[1] !== h) console.log(`${file}: resized ${t.getName()} ${w}x${h} -> ${to[0]}x${to[1]}`)
    }
  }
  let current = stage(file, 1)
  await io.write(current, doc)

  if (textures === 'ktx2' && doc.getRoot().listTextures().length) {
    // Normal maps first, then everything else (colour, emissive, occlusion, metal-rough) as ETC1S.
    if (normalMaps === 'uastc') gltfTransform('uastc', current, stage(file, 2), '--slots', 'normalTexture', '--level', '2', '--zstd', '18')
    else gltfTransform('etc1s', current, stage(file, 2), '--slots', 'normalTexture', '--quality', String(normalQuality))
    gltfTransform('etc1s', stage(file, 2), stage(file, 3), '--quality', String(quality))
    current = stage(file, 3)
    doc = await io.read(current)
  }

  await doc.transform(reorder({ encoder: MeshoptEncoder, level: 'high' }))
  // The same precision the Draco export used (14-bit positions, 10-bit normals, 12-bit UVs), so the geometry is unchanged.
  await doc.transform(quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeColor: 8, quantizeGeneric: 12 }))
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER })
  fs.mkdirSync(path.dirname(dst), { recursive: true })
  await io.write(dst, doc)
  console.log(`${file}: ${(before / 1024).toFixed(0)} KB -> ${(fs.statSync(dst).size / 1024).toFixed(0)} KB`)
}
fs.rmSync(scratch, { recursive: true, force: true })

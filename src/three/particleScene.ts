import * as THREE from 'three'
import { shape, type ShapeName } from './shapes'

export interface ParticleOptions {
  shapes: ShapeName[]
  /** Cycle through `shapes` on a timer (hero). Otherwise call setShape(). */
  autoplay?: boolean
  colors: { base: string; accent: string }
  reduced: boolean
  /** Shift the cloud in world units, per aspect ratio. */
  layout?: (aspect: number) => { x: number; y: number; z: number }
  density?: number
}

export interface ParticleHandle {
  setShape: (name: ShapeName) => void
  dispose: () => void
}

/**
 * A point cloud that moves pose to pose between shapes.
 *
 * Rotation is applied on the CPU and the Points object stays unrotated, so
 * the pointer test happens in the same screen-aligned x/y plane the visitor
 * sees: the gap always opens right under the cursor, whatever the angle.
 * Pointer and rotation are both eased (slow in, slow out); each point's
 * displacement springs back with a little overshoot (follow-through); the
 * effect fades out when the pointer leaves the canvas.
 */
export function mountParticles(canvas: HTMLCanvasElement, opts: ParticleOptions): ParticleHandle {
  const small = Math.min(canvas.clientWidth, window.innerWidth) < 700
  const COUNT = Math.round((small ? 2400 : 5000) * (opts.density ?? 1))
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 0, 9)

  const pos = new Float32Array(COUNT * 3)
  const from = new Float32Array(shape(opts.shapes[0], COUNT))
  let to = shape(opts.shapes[0], COUNT)
  const disp = new Float32Array(COUNT * 2) // spring displacement x, y
  const vel = new Float32Array(COUNT * 2)
  const seeds = new Float32Array(COUNT)
  for (let i = 0; i < COUNT; i++) seeds[i] = ((i * 2654435761) % 1000) / 1000

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('seed', new THREE.BufferAttribute(seeds, 1))
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSize: { value: 2.6 * renderer.getPixelRatio() },
      uBase: { value: new THREE.Color(opts.colors.base) },
      uAccent: { value: new THREE.Color(opts.colors.accent) },
    },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uSize;
      varying float vSeed;
      varying float vDepth;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.6 + seed * 0.9) * (9.0 / -mv.z);
        vSeed = seed;
        vDepth = clamp((-mv.z - 6.0) / 6.0, 0.0, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBase;
      uniform vec3 uAccent;
      varying float vSeed;
      varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 c = vSeed > 0.86 ? uAccent : uBase;
        gl_FragColor = vec4(c, (1.0 - vDepth * 0.7) * smoothstep(0.5, 0.35, d));
      }`,
  })
  const points = new THREE.Points(geo, mat)
  scene.add(points)

  // Pointer, in normalised device coords; eased copy drives everything.
  const ptr = { x: 0, y: 0, active: 0 }
  const ease = { x: 0, y: 0, active: 0 }
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1
    ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1
    ptr.active = inside && e.pointerType === 'mouse' ? 1 : 0
  }
  const onLeave = () => (ptr.active = 0)
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)

  const offset = new THREE.Vector3()
  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const o = opts.layout ? opts.layout(camera.aspect) : { x: 0, y: 0, z: 9 }
    camera.position.z = o.z
    offset.set(o.x, o.y, 0)
    points.position.copy(offset)
    camera.updateProjectionMatrix()
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)

  // World-space size of the view at z=0, to map the pointer onto the plane.
  const viewAt = () => {
    const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
    return { w: h * camera.aspect, h }
  }

  let shapeIdx = 0
  let morphStart = -10
  let morphing = false
  const HOLD = 3.4
  const MORPH = 1.6
  let spin = 0
  let tiltX = 0
  let tiltY = 0
  let last = performance.now()
  let clock = 0

  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const easeOutBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)

  const beginMorph = (next: Float32Array) => {
    // Start from wherever the cloud currently is (interruptible).
    for (let i = 0; i < COUNT * 3; i++) from[i] = pos[i] - (i % 3 === 0 ? offset.x : i % 3 === 1 ? offset.y : 0)
    // `pos` already includes rotation; store un-rotated by resetting spin reference.
    to = next
    morphStart = clock
    morphing = true
    fromIsRotated = true
  }
  let fromIsRotated = false

  const frame = () => {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    clock += dt

    if (opts.autoplay && !morphing && clock - morphStart > HOLD) {
      shapeIdx = (shapeIdx + 1) % opts.shapes.length
      beginMorph(shape(opts.shapes[shapeIdx], COUNT))
    }
    const mt = morphing ? Math.min(1, (clock - morphStart) / MORPH) : 1
    if (morphing && mt >= 1) {
      morphing = false
      from.set(to)
      fromIsRotated = false
    }

    // Eased pointer and rotation.
    const k = 1 - Math.pow(0.001, dt) // ~frame-rate independent lerp
    ease.x += (ptr.x - ease.x) * k * 0.6
    ease.y += (ptr.y - ease.y) * k * 0.6
    ease.active += (ptr.active - ease.active) * k * 0.5
    spin += dt * 0.12
    tiltY += (ease.x * 0.35 - tiltY) * k * 0.3
    tiltX += (-ease.y * 0.2 - tiltX) * k * 0.3
    const cy = Math.cos(spin + tiltY)
    const sy = Math.sin(spin + tiltY)
    const cx = Math.cos(tiltX)
    const sx = Math.sin(tiltX)

    const view = viewAt()
    const px = (ease.x * view.w) / 2 - offset.x
    const py = (ease.y * view.h) / 2 - offset.y
    const R2 = 1.3
    const stiffness = 60
    const damping = 9

    for (let i = 0; i < COUNT; i++) {
      const k3 = i * 3
      const lt = morphing ? Math.max(0, Math.min(1, mt * 1.6 - seeds[i] * 0.6)) : 1
      const e = lt < 1 ? easeOutBack(easeInOut(lt)) : 1
      // Target shape point, rotated on the CPU.
      const tx0 = to[k3]
      const ty0 = to[k3 + 1]
      const tz0 = to[k3 + 2]
      const rx = tx0 * cy + tz0 * sy
      const rz = -tx0 * sy + tz0 * cy
      const ry = ty0 * cx - rz * sx
      const rz2 = ty0 * sx + rz * cx
      let x: number, y: number, z: number
      if (morphing && lt < 1) {
        // `from` holds positions already in view space when interrupted.
        const fx = fromIsRotated ? from[k3] : from[k3] * cy + from[k3 + 2] * sy
        const fy = fromIsRotated ? from[k3 + 1] : from[k3 + 1] * cx - (-from[k3] * sy + from[k3 + 2] * cy) * sx
        const fz = fromIsRotated ? from[k3 + 2] : from[k3 + 1] * sx + (-from[k3] * sy + from[k3 + 2] * cy) * cx
        const arc = Math.sin(lt * Math.PI) * 0.8 * (seeds[i] - 0.5)
        x = fx + (rx - fx) * e + arc
        y = fy + (ry - fy) * e + arc * 0.6
        z = fz + (rz2 - fz) * e
      } else {
        x = rx
        y = ry
        z = rz2
      }
      x += Math.sin(clock * 0.6 + seeds[i] * 20) * 0.02
      y += Math.cos(clock * 0.5 + seeds[i] * 17) * 0.02

      // Spring displacement toward a repel target (screen-aligned x/y).
      const d2 = (x - px) * (x - px) + (y - py) * (y - py)
      let gx = 0
      let gy = 0
      if (ease.active > 0.01 && d2 < R2) {
        const f = ((R2 - d2) / R2) * 0.9 * ease.active
        const inv = 1 / Math.sqrt(d2 + 0.0001)
        gx = (x - px) * inv * f
        gy = (y - py) * inv * f
      }
      const j = i * 2
      vel[j] += ((gx - disp[j]) * stiffness - vel[j] * damping) * dt
      vel[j + 1] += ((gy - disp[j + 1]) * stiffness - vel[j + 1] * damping) * dt
      disp[j] += vel[j] * dt
      disp[j + 1] += vel[j + 1] * dt

      pos[k3] = x + disp[j] + offset.x
      pos[k3 + 1] = y + disp[j + 1] + offset.y
      pos[k3 + 2] = z
    }
    // Positions already include the offset; keep the object at the origin.
    points.position.set(0, 0, 0)
    geo.attributes.position.needsUpdate = true
    renderer.render(scene, camera)
  }

  let raf = 0
  let visible = true
  const loop = () => {
    frame()
    raf = requestAnimationFrame(loop)
  }
  const start = () => {
    cancelAnimationFrame(raf)
    if (visible && !document.hidden && !opts.reduced) {
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
  }
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    start()
  })
  io.observe(canvas)
  document.addEventListener('visibilitychange', start)

  // Initialise positions; reduced motion renders a single still frame.
  frame()

  return {
    setShape(name) {
      const next = shape(name, COUNT)
      if (next === to) return
      if (opts.reduced) {
        to = next
        from.set(next)
        morphing = false
        fromIsRotated = false
        frame()
        return
      }
      for (let i = 0; i < COUNT * 3; i++) from[i] = pos[i] - (i % 3 === 0 ? offset.x : i % 3 === 1 ? offset.y : 0)
      to = next
      morphStart = clock
      morphing = true
      fromIsRotated = true
    },
    dispose() {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', start)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
    },
  }
}

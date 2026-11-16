import * as THREE from 'three'
import { groundAt, isFree } from './layout'

// First-person walking: WASD or the arrow keys (Shift to hurry), drag to look, the mouse wheel steps forward
// and back, and on touch screens a stick from the page (setStick). Eye height is about 1.6 m.

const EYE = 2.4 // room units above the ground (1.5 units per metre)
const SPEED = 2.4 // units per second, about 1.6 m/s
const LOOK = 0.0042 // radians per pixel dragged

export interface Pose {
  x: number
  z: number
  yaw: number
  pitch: number
}

export function createWalker(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, reduced: boolean) {
  let active = false
  const pose: Pose = { x: 0, z: 0, yaw: 0, pitch: 0 }
  let eyeY = EYE
  const keys = new Set<string>()
  const stick = { x: 0, y: 0 }
  let wheel = 0 // pending forward distance from the mouse wheel
  let bob = 0
  let dragging: { x: number; y: number; id: number } | null = null

  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    if (!active || e.metaKey || e.ctrlKey || e.altKey) return
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
    if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift'].includes(k)) {
      if (down) keys.add(k)
      else keys.delete(k)
      if (k.startsWith('Arrow')) e.preventDefault()
    }
  }
  const onKeyDown = onKey(true)
  const onKeyUp = onKey(false)
  const onBlur = () => keys.clear()
  // Drag to look: the view turns the way the pointer moves, like a game.
  const onDown = (e: PointerEvent) => {
    if (!active) return
    dragging = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  const onMove = (e: PointerEvent) => {
    if (!active || !dragging || e.pointerId !== dragging.id) return
    pose.yaw -= (e.clientX - dragging.x) * LOOK
    pose.pitch = THREE.MathUtils.clamp(pose.pitch - (e.clientY - dragging.y) * LOOK, -1.2, 1.2)
    dragging.x = e.clientX
    dragging.y = e.clientY
  }
  const onUp = (e: PointerEvent) => {
    if (dragging && e.pointerId === dragging.id) dragging = null
  }
  const onWheel = (e: WheelEvent) => {
    if (!active || e.ctrlKey) return
    wheel = THREE.MathUtils.clamp(wheel - e.deltaY * 0.006, -2.5, 2.5)
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  canvas.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  canvas.addEventListener('wheel', onWheel, { passive: true })

  /** Slide along walls: try the full step, then each axis on its own. */
  const tryMove = (dx: number, dz: number) => {
    if (isFree(pose.x + dx, pose.z + dz)) {
      pose.x += dx
      pose.z += dz
      return true
    }
    if (isFree(pose.x + dx, pose.z)) {
      pose.x += dx
      return true
    }
    if (isFree(pose.x, pose.z + dz)) {
      pose.z += dz
      return true
    }
    return false
  }

  const apply = () => {
    const look = new THREE.Vector3(Math.sin(pose.yaw) * Math.cos(pose.pitch), Math.sin(pose.pitch), Math.cos(pose.yaw) * Math.cos(pose.pitch))
    camera.position.set(pose.x, eyeY + (reduced ? 0 : Math.sin(bob) * 0.035), pose.z)
    camera.lookAt(camera.position.clone().add(look))
  }

  return {
    get active() {
      return active
    },
    pose,
    /** Start walking from a pose (snapped to the nearest free spot). */
    start(p: Pose) {
      Object.assign(pose, p)
      // If that spot is inside something, step to the nearest free one.
      if (!isFree(pose.x, pose.z)) {
        search: for (let r = 0.15; r < 3; r += 0.15) {
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2
            if (isFree(pose.x + Math.cos(a) * r, pose.z + Math.sin(a) * r)) {
              pose.x += Math.cos(a) * r
              pose.z += Math.sin(a) * r
              break search
            }
          }
        }
      }
      eyeY = groundAt(pose.x, pose.z) + EYE
      active = true
      keys.clear()
      wheel = 0
      apply()
    },
    stop() {
      active = false
      keys.clear()
      dragging = null
      stick.x = stick.y = 0
    },
    /** From the on-screen stick: x is strafe, y is forward, each -1..1. */
    setStick(x: number, y: number) {
      stick.x = x
      stick.y = y
    },
    /** Moves the camera; returns true while walking. */
    update(dt: number) {
      if (!active) return false
      let fwd = (keys.has('w') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('s') || keys.has('ArrowDown') ? 1 : 0) + stick.y
      let side = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0) + stick.x
      // Left and right arrows turn rather than step, as in most games.
      const turn = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0)
      pose.yaw += turn * dt * 1.8
      const len = Math.hypot(fwd, side)
      if (len > 1) {
        fwd /= len
        side /= len
      }
      const speed = SPEED * (keys.has('Shift') ? 1.7 : 1)
      let moved = false
      if (len > 0.01) {
        const sx = Math.sin(pose.yaw)
        const cz = Math.cos(pose.yaw)
        // Forward is (sin yaw, cos yaw); right is (-cos yaw, sin yaw) in this frame.
        moved = tryMove((sx * fwd - cz * side) * speed * dt, (cz * fwd + sx * side) * speed * dt)
      }
      if (Math.abs(wheel) > 0.01) {
        const step = wheel * Math.min(1, dt * 6)
        wheel -= step
        if (!tryMove(Math.sin(pose.yaw) * step, Math.cos(pose.yaw) * step)) wheel = 0
        moved = true
      }
      if (moved) bob += dt * 9
      // Step up on to the deck (and down) smoothly.
      const want = groundAt(pose.x, pose.z) + EYE
      eyeY += (want - eyeY) * Math.min(1, dt * 10)
      apply()
      return true
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('wheel', onWheel)
    },
  }
}

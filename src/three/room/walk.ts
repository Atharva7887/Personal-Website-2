import * as THREE from 'three'
import { groundAt, isFree } from './layout'

// First-person walking, like a game:
// - With a mouse: click once and the mouse is captured (pointer lock), so moving it turns your head; aim at
//   things with the dot in the middle and click them. Esc lets the mouse go.
// - W A S D or the arrow keys to walk (left/right arrows turn), Shift to hurry, the wheel steps.
// - On touch screens: drag to look and the on-screen stick to walk (setStick).
// - E (or the page's Sit button) sits on a seat you are standing next to; E or any step stands you up.

const EYE = 2.4 // room units above the ground (1.5 units per metre): about 1.6 m
const SPEED = 2.4 // units per second, about 1.6 m/s
const DRAG_LOOK = 0.0042 // radians per pixel dragged (touch)
const MOUSE_LOOK = 0.0022 // radians per pixel of mouse movement (captured)
const REACH = 1.7 // how close you need to be to sit

export interface Pose {
  x: number
  z: number
  yaw: number
  pitch: number
}

export interface Seat {
  id: string
  label: string // "the sofa"
  x: number
  z: number
  eyeY: number
  yaw: number
  pitch: number
}

export interface WalkEvents {
  /** The seat you could sit on now (or null), and the one you are sitting on (or null). */
  onSeat?: (near: Seat | null, seated: Seat | null) => void
  /** The mouse was captured or let go. */
  onLock?: (locked: boolean) => void
}

export function createWalker(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, reduced: boolean, ev: WalkEvents = {}) {
  let active = false
  const pose: Pose = { x: 0, z: 0, yaw: 0, pitch: 0 }
  let eyeY = EYE
  const keys = new Set<string>()
  const stick = { x: 0, y: 0 }
  let wheel = 0 // pending forward distance from the mouse wheel
  let bob = 0
  let dragging: { x: number; y: number; id: number } | null = null
  let swallow = false // the click that captured the mouse should not also click something
  let seats: () => Seat[] = () => []
  let near: Seat | null = null
  let seated: Seat | null = null
  let standFrom: Pose | null = null // where you were before sitting
  let glide: { x: number; z: number } | null = null // moving to or from a seat
  const locked = () => document.pointerLockElement === canvas

  const emitSeat = () => ev.onSeat?.(seated ? null : near, seated)

  const sit = (seat: Seat) => {
    standFrom = { ...pose }
    seated = seat
    glide = { x: seat.x, z: seat.z }
    pose.yaw = seat.yaw
    pose.pitch = seat.pitch
    emitSeat()
  }
  const standUp = () => {
    if (!seated) return
    seated = null
    if (standFrom) glide = { x: standFrom.x, z: standFrom.z }
    emitSeat()
  }

  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    if (!active || e.metaKey || e.ctrlKey || e.altKey) return
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
    if (down && k === 'e' && !e.repeat) {
      if (seated) standUp()
      else if (near) sit(near)
      return
    }
    if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift'].includes(k)) {
      if (down) keys.add(k)
      else keys.delete(k)
      if (k.startsWith('Arrow')) e.preventDefault()
    }
  }
  const onKeyDown = onKey(true)
  const onKeyUp = onKey(false)
  const onBlur = () => keys.clear()

  const onDown = (e: PointerEvent) => {
    if (!active) return
    if (e.pointerType === 'mouse') {
      // First click captures the mouse; after that, clicks aim with the dot in the middle.
      if (!locked()) {
        swallow = true
        const r = canvas.requestPointerLock() as unknown
        if (r instanceof Promise) r.catch(() => {})
      }
      return
    }
    dragging = { x: e.clientX, y: e.clientY, id: e.pointerId } // touch: drag to look
  }
  const onMove = (e: PointerEvent) => {
    if (!active) return
    if (locked()) {
      pose.yaw -= e.movementX * MOUSE_LOOK
      pose.pitch = THREE.MathUtils.clamp(pose.pitch - e.movementY * MOUSE_LOOK, -1.25, 1.25)
      return
    }
    if (!dragging || e.pointerId !== dragging.id) return
    pose.yaw -= (e.clientX - dragging.x) * DRAG_LOOK
    pose.pitch = THREE.MathUtils.clamp(pose.pitch - (e.clientY - dragging.y) * DRAG_LOOK, -1.2, 1.2)
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
  const onLockChange = () => ev.onLock?.(locked())
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  canvas.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  canvas.addEventListener('wheel', onWheel, { passive: true })
  document.addEventListener('pointerlockchange', onLockChange)

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
    camera.position.set(pose.x, eyeY + (reduced || seated ? 0 : Math.sin(bob) * 0.035), pose.z)
    camera.lookAt(camera.position.clone().add(look))
  }

  return {
    get active() {
      return active
    },
    get seated() {
      return seated
    },
    pose,
    /** Where the seats are (read each frame, since the chair's spot is known only once its model loads). */
    setSeats(fn: () => Seat[]) {
      seats = fn
    },
    /** Sit on the seat you're next to, or stand up (for the page's button). */
    toggleSit() {
      if (seated) standUp()
      else if (near) sit(near)
    },
    /** True once for the click that captured the mouse. */
    takeSwallowedClick() {
      const s = swallow
      swallow = false
      return s
    },
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
      seated = null
      near = null
      glide = null
      keys.clear()
      wheel = 0
      emitSeat()
      apply()
    },
    stop() {
      active = false
      keys.clear()
      dragging = null
      stick.x = stick.y = 0
      seated = null
      near = null
      glide = null
      emitSeat()
      if (locked()) document.exitPointerLock()
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
      const turn = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0)
      pose.yaw += turn * dt * 1.8
      const len = Math.hypot(fwd, side)
      if (len > 1) {
        fwd /= len
        side /= len
      }
      // Any step while sitting stands you up first.
      if (seated && (len > 0.01 || Math.abs(wheel) > 0.05)) {
        standUp()
        wheel = 0
      }
      let moved = false
      if (glide) {
        // Ease to (or back from) the seat, ignoring collisions on the way.
        const k = Math.min(1, dt * 6)
        pose.x += (glide.x - pose.x) * k
        pose.z += (glide.z - pose.z) * k
        if (Math.hypot(glide.x - pose.x, glide.z - pose.z) < 0.01) glide = null
      } else if (!seated) {
        const speed = SPEED * (keys.has('Shift') ? 1.7 : 1)
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
      }
      if (moved) bob += dt * 9
      // Eye height: standing (stepping up on to the deck smoothly) or seated.
      const want = seated ? seated.eyeY : groundAt(pose.x, pose.z) + EYE
      eyeY += (want - eyeY) * Math.min(1, dt * (seated || glide ? 6 : 10))
      // Is there a seat within reach?
      if (!seated) {
        let best: Seat | null = null
        let bestD = REACH
        for (const s of seats()) {
          const d = Math.hypot(s.x - pose.x, s.z - pose.z)
          if (d < bestD) {
            best = s
            bestD = d
          }
        }
        if (best?.id !== near?.id) {
          near = best
          emitSeat()
        }
      }
      apply()
      return true
    },
    dispose() {
      if (locked()) document.exitPointerLock()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('wheel', onWheel)
      document.removeEventListener('pointerlockchange', onLockChange)
    },
  }
}

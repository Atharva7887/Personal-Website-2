// Tiny synthesised sound effects for the games. Everything is generated with Web Audio, so there are no
// files to download. Sound is off until the visitor turns it on, and that choice is remembered.
import { useSyncExternalStore } from 'react'

const KEY = 'play:sound'

let enabled = false
try {
  enabled = localStorage.getItem(KEY) === 'on'
} catch {
  /* no storage (server render, private mode): stay muted */
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

let ctx: AudioContext | null = null
let master: GainNode | null = null

// Browsers only allow audio after a gesture, so the context is made on the first sound, never earlier.
function audio(): AudioContext | null {
  if (!enabled) return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.35
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface Tone {
  f: number
  to?: number
  dur?: number
  type?: OscillatorType
  vol?: number
  delay?: number
}

function tone({ f, to, dur = 0.12, type = 'sine', vol = 0.5, delay = 0 }: Tone) {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
  // A short attack and an exponential tail, so nothing clicks.
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function hiss(dur: number, vol: number, from: number, to: number) {
  const c = audio()
  if (!c || !master) return
  const n = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, n, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 0.9
  const t = c.currentTime
  filter.frequency.setValueAtTime(from, t)
  filter.frequency.exponentialRampToValueAtTime(to, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(g).connect(master)
  src.start(t)
}

// A pentatonic ladder, so any run of rising notes sounds friendly.
const LADDER = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
const note = (base: number, step: number) => base * Math.pow(2, LADDER[Math.max(0, Math.min(step, LADDER.length - 1))] / 12)
const run = (steps: number[], fn: (step: number, i: number) => void) => steps.forEach(fn)

export const sfx = {
  /** Orb or point collected; a higher streak climbs the ladder. */
  collect(step = 0) {
    const f = note(523, step)
    tone({ f, to: f * 1.5, dur: 0.14, type: 'triangle', vol: 0.5 })
    tone({ f: f * 2, dur: 0.18, type: 'sine', vol: 0.2, delay: 0.05 })
  },
  boost() {
    hiss(0.35, 0.5, 400, 3200)
    tone({ f: 180, to: 520, dur: 0.3, type: 'sawtooth', vol: 0.12 })
  },
  bump() {
    tone({ f: 140, to: 60, dur: 0.12, type: 'sine', vol: 0.6 })
  },
  tick() {
    tone({ f: 880, dur: 0.05, type: 'square', vol: 0.12 })
  },
  win() {
    run([0, 2, 4, 5, 7], (s, i) => tone({ f: note(523, s), dur: 0.22, type: 'triangle', vol: 0.45, delay: i * 0.09 }))
    tone({ f: note(523, 7) * 2, dur: 0.5, type: 'sine', vol: 0.25, delay: 0.5 })
  },
  lose() {
    run([7, 4, 2, 0], (s, i) => tone({ f: note(392, s) / 2, to: note(392, s) / 2.3, dur: 0.24, type: 'sawtooth', vol: 0.18, delay: i * 0.13 }))
  },
  place(y = 0.5) {
    tone({ f: note(330, Math.round(y * 6)), dur: 0.1, type: 'triangle', vol: 0.5 })
  },
  remove() {
    tone({ f: 420, to: 180, dur: 0.1, type: 'triangle', vol: 0.4 })
  },
  grab() {
    tone({ f: 600, dur: 0.04, type: 'sine', vol: 0.25 })
  },
  reveal(i = 0) {
    tone({ f: note(392, i % 8), dur: 0.07, type: 'sine', vol: 0.3 })
  },
  click() {
    tone({ f: 660, dur: 0.05, type: 'triangle', vol: 0.3 })
  },
  /** Plays when a round is judged: bright for a good score, low for a poor one. */
  verdict(good: boolean) {
    if (good) run([0, 4, 7], (s, i) => tone({ f: note(523, s), dur: 0.2, type: 'triangle', vol: 0.4, delay: i * 0.08 }))
    else tone({ f: 220, to: 130, dur: 0.4, type: 'sawtooth', vol: 0.18 })
  },
}

export function setSound(on: boolean) {
  enabled = on
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
  emit()
  // A confirming blip when it comes on, because the toggle itself is silent when it goes off.
  if (on) sfx.click()
}

export function useSound(): [boolean, () => void] {
  const on = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => enabled,
    () => false,
  )
  return [on, () => setSound(!enabled)]
}

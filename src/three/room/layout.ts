// Where things are on the ground: the room, the door, the garden and what stands in them.
// Shared by the garden (to build), the dog (to wander) and first-person walking (to not walk through things).

/** The room's floor, inside the walls: 10 wide and 9 deep. The left and back walls are fixed; it grows towards +x and +z. */
export const ROOM = { x0: -4, x1: 6, z0: -4, z1: 5 }
/** The reading and listening corner by the right-hand window: armchair, side table with a lamp, record cabinet, round rug. */
export const READING = {
  chair: { x: 5.1, z: 2.4, yaw: -1.82 }, // the armchair, facing into the room
  table: { x: 5.38, z: 3.88 }, // the side table (and its lamp), on the chair's left
  cabinet: { x: 5.71, z: -0.95, len: 2.3, depth: 0.54 }, // the low record cabinet against the right wall, turntable on top
  rug: { x: 4.5, z: 2.55, r: 1.45 },
}
/** The garden: outside the room's left wall (x < -4.2), reached through the door. It runs on to x = -18.2. */
export const GARDEN = { x0: -18.2, x1: -4.2, z0: -6.2, z1: 6.8 }
/** The timber deck outside the door; its top is DECK.y above the lawn. */
export const DECK = { x0: -7.2, x1: -4.2, z0: 0.7, z1: 4.75, y: 0.2 }
/** The garden shed, in the far back corner (its door faces the lawn, +z). */
export const SHED = { x: -11.9, z: -4.35, w: 2.1, d: 2.3 }
/** Trees: x, z, height, spread. */
export const TREES: [number, number, number, number][] = [
  [-9.7, 0.9, 5.6, 1.1],
  [-5.2, -5.0, 4.2, 0.9],
  [-12.6, 4.6, 4.8, 1.0], // one end of the hammock
  [-17.0, 4.6, 4.6, 1.0], // the other
]

/**
 * The pond where the greenhouse used to be, seen from the room's window and the garden stand. a x b are its
 * semi-axes in room units (1.5 units = 1 m), so it is roughly 5 x 3.5 units across before the outline wanders.
 */
export const POND = { x: -8.0, z: -3.0, a: 2.4, b: 1.7 }
/** The water's surface, a hand's width below the lawn (which sits at -0.03). */
export const POND_WATER_Y = -0.17
/** Where the bank meets the lawn, as a multiple of the shoreline: the lawn has a hole this big for the pond. */
export const POND_BANK = 1.17
/** How far out the shoreline is in direction theta, as a multiple of a and b (so it is not an ellipse; the west lobe is pinched in, away from the shed). */
export const pondShore = (theta: number) =>
  1 + 0.08 * Math.sin(2 * theta + 1) + 0.06 * Math.sin(3 * theta + 2) + 0.035 * Math.sin(5 * theta) + 0.025 * Math.sin(7 * theta + 0.5) - 0.08 * Math.max(0, -Math.cos(theta))
/** The point on the shoreline (scaled in or out from the centre) in direction theta. */
export const pondPoint = (theta: number, scale = 1) => {
  const f = pondShore(theta) * scale
  return [POND.x + Math.cos(theta) * POND.a * f, POND.z + Math.sin(theta) * POND.b * f] as const
}
/** Is the point in the pond (grown by `pad` room units)? */
export function inPond(x: number, z: number, pad = 0) {
  const dx = (x - POND.x) / POND.a
  const dz = (z - POND.z) / POND.b
  return Math.hypot(dx, dz) < pondShore(Math.atan2(dz, dx)) + pad / Math.min(POND.a, POND.b)
}
/** A hammock strung between the two trees at x -12.6 and -17.0: hook x for each end, hook height and z. */
export const HAMMOCK = { xa: -12.88, xb: -16.72, z: 4.6, y: 2.0 }
/** The fire pit in the far garden, with its seats: stumps and logs around it (angle round the fire, distance). */
export const FIRE = {
  x: -14.8,
  z: 1.9,
  seats: [
    { angle: 0.35, r: 2.0, kind: 'stump' as const },
    { angle: 1.95, r: 2.0, kind: 'stump' as const },
    { angle: 3.6, r: 2.1, kind: 'log' as const },
    { angle: 5.2, r: 2.1, kind: 'log' as const },
  ],
}
/** The two stumps you can sit on, as spots on the ground (the first two seats). */
export const fireSeatAt = (i: number) => ({ x: FIRE.x + Math.cos(FIRE.seats[i].angle) * FIRE.seats[i].r, z: FIRE.z + Math.sin(FIRE.seats[i].angle) * FIRE.seats[i].r })

export type Rect = { x0: number; x1: number; z0: number; z1: number }
export type Circle = { x: number; z: number; r: number }

/** Things you cannot walk through, as rectangles and circles on the ground. */
export const BLOCKERS: { rects: Rect[]; circles: Circle[] } = {
  rects: [
    // In the room
    { x0: -0.85, x1: 1.25, z0: -4, z1: -2.35 }, // desk
    { x0: 1.6, x1: 2.3, z0: -4, z1: -2.75 }, // GPU tower
    { x0: -2.5, x1: -0.95, z0: -4, z1: -3.4 }, // sideboard
    { x0: 4.05, x1: 5.15, z0: -4, z1: -3.0 }, // arcade
    { x0: -4, x1: -3.35, z0: -0.45, z1: 2.05 }, // bookshelves
    { x0: -0.5, x1: 2.85, z0: 2.4, z1: 3.9 }, // sofa
    { x0: 4.4, x1: 5.85, z0: 1.65, z1: 3.15 }, // armchair
    { x0: READING.cabinet.x - READING.cabinet.depth / 2 - 0.1, x1: ROOM.x1, z0: READING.cabinet.z - READING.cabinet.len / 2, z1: READING.cabinet.z + READING.cabinet.len / 2 }, // record cabinet
    // In the garden
    { x0: SHED.x - SHED.w / 2 - 0.1, x1: SHED.x + SHED.w / 2 + 0.1, z0: SHED.z - SHED.d / 2 - 0.1, z1: SHED.z + SHED.d / 2 + 0.1 },
    { x0: -5.05, x1: -4.2, z0: -3.05, z1: -0.35 }, // flower bed under the window
    { x0: -7.1, x1: -5.45, z0: 4.15, z1: 4.75 }, // bench on the deck
    { x0: HAMMOCK.xb + 0.25, x1: HAMMOCK.xa - 0.25, z0: HAMMOCK.z - 0.6, z1: HAMMOCK.z + 0.6 }, // the hammock
  ],
  circles: [
    { x: 1.2, z: -2.0, r: 0.45 }, // desk chair
    { x: -3.05, z: -3.05, r: 0.55 }, // monstera
    { x: -2.9, z: -0.5, r: 0.3 }, // floor lamp
    { x: 3.4, z: 0.5, r: 0.45 }, // side table
    { x: 3.62, z: -0.45, r: 0.3 }, // console
    { x: READING.table.x, z: READING.table.z, r: 0.45 }, // side table with the lamp
    { x: -3.38, z: 3.72, r: 0.35 }, // pothos
    ...TREES.map(([x, z]) => ({ x, z, r: 0.35 })),
    { x: FIRE.x, z: FIRE.z, r: 0.95 }, // fire pit
    ...FIRE.seats.map((_, i) => ({ ...fireSeatAt(i), r: 0.32 })),
    { x: -6.5, z: 0.5, r: 0.2 }, // lamp post
    { x: -5.9, z: 1.8, r: 0.15 }, // pergola posts
    { x: -5.9, z: 3.8, r: 0.15 },
    { x: -4.72, z: 1.72, r: 0.35 }, // pots by the door
    { x: -4.72, z: 3.9, r: 0.35 },
  ],
}

/** Places you can stand: the room's floor, the doorway and the garden's lawn. */
export const WALKABLE: Rect[] = [
  { x0: ROOM.x0 + 0.3, x1: ROOM.x1 - 0.25, z0: ROOM.z0 + 0.35, z1: ROOM.z1 - 0.25 }, // room
  { x0: -4.75, x1: -3.5, z0: 2.4, z1: 3.2 }, // doorway
  { x0: GARDEN.x0 + 1.05, x1: -4.55, z0: GARDEN.z0 + 1.05, z1: GARDEN.z1 - 0.55 }, // lawn
]

const inRect = (r: Rect, x: number, z: number, pad = 0) => x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad

/** Can something of radius `r` stand at x, z? */
export function isFree(x: number, z: number, r = 0.28) {
  if (!WALKABLE.some((w) => inRect(w, x, z))) return false
  if (BLOCKERS.rects.some((b) => inRect(b, x, z, r))) return false
  if (inPond(x, z, r + 0.2)) return false // the pond is not walkable (nor the dog's), and so is a little of its bank
  return !BLOCKERS.circles.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + r)
}

/** Height of the ground at x, z: the deck is raised, the lawn sits a touch below the room floor. */
export function groundAt(x: number, z: number) {
  if (inRect(DECK, x, z)) return DECK.y - 0.03
  return x < -4.2 ? -0.03 : 0
}

/** Is the point in the garden (rather than the room)? */
export const inGarden = (x: number) => x < -4.3

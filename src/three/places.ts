// The places a visitor can stand in. To add a room later: add an entry here, give its things
// their stop ids (room.ts VIEWS and Studio.tsx STOPS) and list them under `stops`.
// Kept free of three.js so the page can import it without pulling in the 3D bundle.

export type PlaceId = 'room' | 'garden'

export interface Place {
  id: PlaceId
  /** Short name, for the place switcher. */
  label: string
  /** Button text on the intro. */
  cta: string
  /** Where you stand (eye height is ~1.6 m: the room is drawn at 1.5 units per metre) and where you first look. */
  stand: { pos: [number, number, number]; look: [number, number, number] }
  /** The tour stops that belong here, in tour order. */
  stops: string[]
}

export const PLACES: Place[] = [
  {
    id: 'room',
    label: 'Room',
    cta: 'Stand in the room',
    stand: { pos: [4.3, 2.4, 4.3], look: [-0.5, 1.7, -2.6] },
    stops: ['window', 'desk', 'gpu', 'poster', 'gallery', 'phone', 'plant', 'shelf', 'arcade', 'door', 'mug'],
  },
  {
    id: 'garden',
    label: 'Garden',
    cta: 'Stand in the garden',
    stand: { pos: [-6.4, 2.4, 5.4], look: [-8.2, 1.4, -2.6] },
    stops: ['garden'],
  },
]

export const placeOf = (stop: string): PlaceId => PLACES.find((p) => p.stops.includes(stop))?.id ?? 'room'

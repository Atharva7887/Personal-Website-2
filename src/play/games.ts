// The three games: the hub, the routes and each intro screen read from this one list.
export interface GameInfo {
  id: 'minimum' | 'overfit' | 'cluster'
  path: string
  title: string
  /** The line above the title on the intro screen. */
  kicker: string
  /** One sentence for the hub card and the meta description. */
  blurb: string
  /** What to do, in plain words. */
  how: string
  time: string
  controls: string
  /** Where the intro's colour glow sits, so the three screens feel related but not identical. */
  glow: string
  startLabel: string
  /** Where the best score is stored, when it differs from the id (a game whose scoring changed). */
  bestKey?: string
}

export const GAMES: GameInfo[] = [
  {
    id: 'minimum',
    path: '/play/minimum/',
    title: 'Find the minimum',
    kicker: 'A small 3D game about how machine learning learns.',
    blurb: 'Roll a ball down a loss landscape, chase a streak, dodge the local minima and beat the clock.',
    how: 'You’re the optimiser: a ball on a loss landscape. Gravity pulls you downhill, but the obvious valleys are traps, and the noise grows with every orb. Grab all seven (each one is a project of mine), keep your streak alive, then fall into the global minimum before the clock runs out. Boost raises your learning rate: faster, but you will overshoot.',
    time: '60–90 s',
    controls: 'Arrow keys or WASD, Space to boost. Drag to steer on a phone.',
    glow: 'radial-gradient(120% 80% at 80% 10%, #2f45ff 0%, #0b0d1a 55%)',
    startLabel: 'Start rolling',
  },
  {
    id: 'overfit',
    path: '/play/overfit/',
    title: 'Overfit',
    kicker: 'A game about the one mistake every model makes.',
    blurb: 'One slider, five mystery shapes. Make the curve wiggly enough to catch the pattern, but not so wiggly it memorises the noise.',
    how: 'Each round hides a shape (a line, a bowl, a wave…) behind noisy dots. Drag the wiggliness slider and the curve fits itself to the dots. The more wiggly, the better it fits the dots you see, so it’s tempting to max it out. Lock it in and new dots from the same shape drop in: a curve that chased the noise misses them. Five rounds, 15 seconds each.',
    time: '60–90 s',
    controls: 'Drag the slider, or use the arrow keys. Enter locks it in.',
    glow: 'radial-gradient(110% 80% at 15% 15%, rgb(255 210 154 / 0.55) 0%, #0b0d1a 58%)',
    startLabel: 'Start fitting',
    bestKey: 'overfit-v2', // scores out of 1,000 since the slider version; the old game scored out of 3,000
  },
  {
    id: 'cluster',
    path: '/play/cluster/',
    title: 'Cluster',
    kicker: 'K-means, by hand.',
    blurb: 'Drag the centroids to where the clusters really are before time runs out. Outliers will try to drag you astray.',
    how: 'There are groups hiding in this data. Drag each centroid to the middle of a group and the points take its colour. Press Step to let k-means do one iteration for you, at a cost of two seconds. Get close to the optimum and you converge early for a time bonus. Three rounds, with more clusters and more strays each time.',
    time: '45–75 s',
    controls: 'Drag a centroid, or Tab to one and use the arrow keys. Press K to step.',
    glow: 'radial-gradient(100% 80% at 85% 85%, #2f45ff 0%, #0b0d1a 58%)',
    startLabel: 'Start clustering',
  },
]

export const gameById = (id: GameInfo['id']) => GAMES.find((g) => g.id === id)!

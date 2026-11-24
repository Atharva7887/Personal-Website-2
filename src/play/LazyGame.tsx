import { useEffect, useState, type ComponentType } from 'react'
import { gameById, type GameInfo } from './games'
import { GameIntro, PlayBar } from './ui'

// The games load on demand, so the home page and the hub never pay for three.js or the game code.
const LOADERS: Record<GameInfo['id'], () => Promise<{ default: ComponentType }>> = {
  minimum: () => import('../pages/games/Minimum'),
  overfit: () => import('../pages/games/Overfit'),
  cluster: () => import('../pages/games/Cluster'),
}

/** Renders the game's intro screen (also what is prerendered for search engines) until the game's code arrives. */
export function PlayGame({ id }: { id: GameInfo['id'] }) {
  const [Game, setGame] = useState<ComponentType | null>(null)
  useEffect(() => {
    let live = true
    LOADERS[id]().then((m) => live && setGame(() => m.default))
    return () => {
      live = false
    }
  }, [id])
  if (Game) return <Game />
  return (
    <main id="main" className="dark relative h-[100svh] overflow-hidden bg-[#0b0d1a] text-fog">
      <PlayBar overlay />
      <GameIntro game={gameById(id)} />
    </main>
  )
}

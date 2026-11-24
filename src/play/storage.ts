// Best scores, one key per game. Storage can be missing or blocked, so every call is guarded.
const key = (id: string) => `play:best:${id}`

export function loadBest(id: string): number | null {
  try {
    const v = Number(localStorage.getItem(key(id)))
    return v > 0 ? v : null
  } catch {
    return null
  }
}

/** Saves the score if it beats the old best; says whether it did. */
export function saveBest(id: string, score: number): { best: number; isNew: boolean; previous: number | null } {
  const previous = loadBest(id)
  const isNew = score > 0 && (previous === null || score > previous)
  if (isNew) {
    try {
      localStorage.setItem(key(id), String(score))
    } catch {
      /* private mode: the score still shows this run */
    }
  }
  return { best: isNew ? score : (previous ?? score), isNew, previous }
}

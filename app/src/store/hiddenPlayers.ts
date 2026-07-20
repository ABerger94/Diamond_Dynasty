import { useCallback } from 'react'
import { createLocalStorageStore } from './createLocalStorageStore'

const store = createLocalStorageStore<string[]>('the-lineup:hidden-players', [], 'diamond-dynasty:hidden-players')

/**
 * Featured (built-in) players can't be deleted — they're hardcoded data, not something in this
 * device's storage — so "removing" one from your pool means hiding it instead. Custom players
 * (store/customPlayers.ts) are actually deleted; this store is only for the featured set.
 */
export function useHiddenPlayers() {
  const [hiddenIds, setHiddenIds] = store.useStore()

  const hidePlayer = useCallback(
    (id: string) => setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [setHiddenIds],
  )

  const unhidePlayer = useCallback((id: string) => setHiddenIds((prev) => prev.filter((x) => x !== id)), [setHiddenIds])

  const unhideAll = useCallback(() => setHiddenIds([]), [setHiddenIds])

  return { hiddenIds, hidePlayer, unhidePlayer, unhideAll }
}

import { useCallback } from 'react'
import { SEED_CARDS } from '../data/cards.seed'
import type { CardEntry } from '../types/roster'
import { createLocalStorageStore } from './createLocalStorageStore'

const store = createLocalStorageStore<CardEntry[]>('the-lineup:cards', SEED_CARDS, 'diamond-dynasty:cards')

export function useCardCollection() {
  const [cards, setCards] = store.useStore()

  const addCard = useCallback(
    (card: Omit<CardEntry, 'id'>) => {
      const entry: CardEntry = { ...card, id: `card_${Date.now()}_${Math.round(Math.random() * 1e6)}` }
      setCards((prev) => [...prev, entry])
      return entry
    },
    [setCards],
  )

  const removeCard = useCallback((id: string) => setCards((prev) => prev.filter((c) => c.id !== id)), [setCards])

  return { cards, addCard, removeCard }
}

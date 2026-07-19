import { useCallback, useEffect, useState } from 'react'
import { SEED_CARDS } from '../data/cards.seed'
import type { CardEntry } from '../types/roster'

const STORAGE_KEY = 'diamond-dynasty:cards'

function loadCards(): CardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CardEntry[]) : SEED_CARDS
  } catch {
    return SEED_CARDS
  }
}

function saveCards(cards: CardEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}

export function useCardCollection() {
  const [cards, setCards] = useState<CardEntry[]>(() => loadCards())

  useEffect(() => {
    saveCards(cards)
  }, [cards])

  const addCard = useCallback((card: Omit<CardEntry, 'id'>) => {
    const entry: CardEntry = { ...card, id: `card_${Date.now()}_${Math.round(Math.random() * 1e6)}` }
    setCards((prev) => [...prev, entry])
    return entry
  }, [])

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { cards, addCard, removeCard }
}

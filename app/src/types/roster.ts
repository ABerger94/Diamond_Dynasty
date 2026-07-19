import type { Position } from './player'

/** A physical card the user owns, tagged to a Player. Cosmetic fields only — no gameplay effect. */
export interface CardEntry {
  id: string
  playerId: string
  manufacturer: string
  setName: string
  cardYear: number
  cardNumber?: string
  rarity?: string
}

export interface Roster {
  id: string
  name: string
  /** playerId for each of the 9 starting lineup slots. */
  lineup: Partial<Record<Position, string>>
  bench: string[]
  startingPitchers: string[]
  reliefPitchers: string[]
  createdAt: string
  updatedAt: string
}

export const ROSTER_SLOT_LIMITS = {
  bench: 5,
  startingPitchers: 5,
  reliefPitchers: 6,
} as const

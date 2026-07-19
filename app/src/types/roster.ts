import type { Position } from './player'

/** A physical card the user owns, tagged to a Player. Cosmetic fields only — no gameplay effect
 * (Rulebook §1). Field names mirror the Diamond Dynasty card database export. */
export interface CardEntry {
  id: string
  playerId: string
  cardYear: number
  brand: string
  setName: string
  cardNumber?: string
  isRookie: boolean
  parallel?: string
  serialNumber?: string
  isAutograph: boolean
  isRelic: boolean
  condition?: string
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

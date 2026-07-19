export function rollDie(sides: number): number {
  return 1 + Math.floor(Math.random() * sides)
}

export function roll2d6(): number {
  return rollDie(6) + rollDie(6)
}

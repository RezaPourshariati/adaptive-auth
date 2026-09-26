export interface BarberCandidate {
  id: string
  sortOrder: number
}

export function pickBarberOrder<T extends BarberCandidate>(candidates: T[]): T[] {
  return [...candidates].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder)
      return left.sortOrder - right.sortOrder
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0
  })
}

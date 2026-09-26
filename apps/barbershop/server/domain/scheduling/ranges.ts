export interface InstantRange {
  start: Date
  end: Date
}

/** Half-open [start, end). Adjacent ranges do not overlap. */
export function rangesOverlap(left: InstantRange, right: InstantRange): boolean {
  return left.start < right.end && right.start < left.end
}

export function subtractRanges(free: InstantRange, busy: InstantRange[]): InstantRange[] {
  let parts = [free]
  for (const block of busy) {
    const next: InstantRange[] = []
    for (const part of parts) {
      if (!rangesOverlap(part, block)) {
        next.push(part)
        continue
      }
      if (part.start < block.start)
        next.push({ start: part.start, end: block.start < part.end ? block.start : part.end })
      if (block.end < part.end && block.end > part.start)
        next.push({ start: block.end, end: part.end })
    }
    parts = next.filter(item => item.start < item.end)
  }
  return parts
}

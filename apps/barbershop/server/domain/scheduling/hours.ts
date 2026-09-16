export interface LocalInterval {
  startLocal: string
  endLocal: string
}

export function intersectLocalIntervals(
  business: LocalInterval | null,
  staff: LocalInterval | null,
): LocalInterval | null {
  if (!business)
    return null
  if (!staff)
    return business
  const startLocal = business.startLocal > staff.startLocal ? business.startLocal : staff.startLocal
  const endLocal = business.endLocal < staff.endLocal ? business.endLocal : staff.endLocal
  if (startLocal >= endLocal)
    return null
  return { startLocal, endLocal }
}

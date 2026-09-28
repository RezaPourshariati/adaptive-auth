import { describe, expect, it } from 'vitest'
import {
  addLocalDays,
  blockSpan,
  defaultFocusedStaffId,
  floorToSlot,
  isSlotAligned,
  mutationFollowUp,
  nowOffsetPx,
  resolveWalkInNow,
  SOURCE_LABELS,
  sourceLabel,
  timelineColumns,
  timeSlots,
} from '../app/utils/calendar-layout'

describe('calendar presentation', () => {
  it('labels only the existing appointment sources', () => {
    expect(SOURCE_LABELS).toEqual({
      online: 'Online',
      phone: 'Phone',
      walk_in: 'Walk-in',
      staff_created: 'Staff',
    })
    expect(sourceLabel('walk_in')).toBe('Walk-in')
    expect(sourceLabel('WAIT')).toBe('WAIT')
  })

  it('sizes columns from the barber count', () => {
    expect(timelineColumns(1).template).toBe('4.5rem repeat(1, minmax(0, 1fr))')
    expect(timelineColumns(5).scroll).toBe(false)
    expect(timelineColumns(8).scroll).toBe(false)
    expect(timelineColumns(9)).toEqual({
      template: '4.5rem repeat(9, 9rem)',
      scroll: true,
    })
    expect(timelineColumns(5).template).not.toBe(timelineColumns(8).template)
  })

  it('keeps a stored barber when that barber is still on the day', () => {
    const staff = [{ id: 'a' }, { id: 'b' }]
    expect(defaultFocusedStaffId(staff, 'b')).toBe('b')
    expect(defaultFocusedStaffId(staff, 'missing')).toBe('a')
    expect(defaultFocusedStaffId([], 'a')).toBe('')
  })

  it('rounds walk-in now onto the 10-minute grid inside working hours', () => {
    const hours = { startLocal: '08:00', endLocal: '19:00' }
    expect(floorToSlot('10:07')).toBe('10:00')
    expect(isSlotAligned('10:10')).toBe(true)
    expect(isSlotAligned('10:07')).toBe(false)
    expect(resolveWalkInNow('10:07', 40, hours)).toBe('10:00')
    expect(resolveWalkInNow('07:52', 40, hours)).toBe('08:00')
    expect(resolveWalkInNow('18:50', 40, hours)).toBe('18:50')
  })

  it('places blocks inside the shop window and hides the now line outside it', () => {
    expect(timeSlots('08:00', '09:00')).toHaveLength(6)
    expect(blockSpan('08:00', '08:20', '09:00', 6)).toEqual({ start: 2, end: 6 })
    expect(blockSpan('08:00', '07:00', '07:30', 6)).toBeNull()
    expect(nowOffsetPx('08:00', '08:30', 28, 6)).toBe(84)
    expect(nowOffsetPx('08:00', '07:00', 28, 6)).toBeNull()
  })

  it('refetches after success and after 409 or 404', () => {
    expect(mutationFollowUp(null)).toBe('refresh')
    expect(mutationFollowUp(409)).toBe('refresh-after-error')
    expect(mutationFollowUp(404)).toBe('refresh-after-error')
    expect(mutationFollowUp(400)).toBe('keep')
  })

  it('shifts calendar dates without using the browser timezone', () => {
    expect(addLocalDays('2026-09-14', 1)).toBe('2026-09-15')
    expect(addLocalDays('2026-09-14', -1)).toBe('2026-09-13')
  })
})

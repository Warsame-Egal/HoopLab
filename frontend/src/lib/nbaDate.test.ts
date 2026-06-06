import { describe, expect, it, vi, afterEach } from 'vitest'
import { defaultScoreboardDateForSeason, isNbaToday, nbaTodayIso, shiftNbaDate } from './nbaDate'

describe('nbaDate', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shiftNbaDate moves calendar days', () => {
    expect(shiftNbaDate('2026-06-03', 1)).toBe('2026-06-04')
    expect(shiftNbaDate('2026-06-03', -1)).toBe('2026-06-02')
  })

  it('defaultScoreboardDateForSeason uses today when in season', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('2025-03-15')
    expect(defaultScoreboardDateForSeason('2024-25')).toBe('2025-03-15')
  })

  it('defaultScoreboardDateForSeason uses season end when after season', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('2026-06-05')
    expect(defaultScoreboardDateForSeason('2024-25')).toBe('2025-06-30')
  })

  it('isNbaToday compares against Eastern today helper', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('2026-06-03')
    expect(isNbaToday('2026-06-03')).toBe(true)
    expect(isNbaToday('2026-06-04')).toBe(false)
    expect(nbaTodayIso()).toBe('2026-06-03')
  })
})

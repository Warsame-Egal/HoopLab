import { describe, expect, it } from 'vitest'
import { formatPercent, formatPlusMinus, formatStat } from './format'

describe('formatStat', () => {
  it('formats numbers', () => {
    expect(formatStat(24.567)).toBe('24.6')
  })

  it('returns em dash for null', () => {
    expect(formatStat(null)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('converts decimals to percent', () => {
    expect(formatPercent(0.512)).toBe('51.2%')
  })
})

describe('formatPlusMinus', () => {
  it('prefixes positive values', () => {
    expect(formatPlusMinus(7)).toBe('+7')
  })

  it('shows negative as-is', () => {
    expect(formatPlusMinus(-3)).toBe('-3')
  })
})

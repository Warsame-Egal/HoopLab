/** Shared number/date formatters for the dashboard. */

export function formatStat(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  const pct = value <= 1 && value >= -1 ? value * 100 : value
  return `${pct.toFixed(digits)}%`
}

export function formatPlusMinus(value: number | null | undefined): string {
  if (value == null) return '—'
  return value > 0 ? `+${value}` : String(value)
}

/** Game tip times: user locale with ET reference when not Eastern. */
export function formatGameTime(utcIso: string | null | undefined): string {
  if (!utcIso) return 'TBD'
  try {
    const date = new Date(utcIso)
    const local = date.toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
    const et = date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    return `${local} (${et})`
  } catch {
    return utcIso
  }
}

export function formatDateLabel(isoDate: string): string {
  try {
    const d = new Date(isoDate + 'T12:00:00')
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return isoDate
  }
}

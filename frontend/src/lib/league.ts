export type LeagueRecordsResponse = {
  season?: string
  records: Record<string, unknown>[]
}

export function topBy(
  records: Record<string, unknown>[],
  field: string,
  limit = 5,
): Record<string, unknown>[] {
  return [...records]
    .filter((r) => r[field] != null)
    .sort((a, b) => Number(b[field]) - Number(a[field]))
    .slice(0, limit)
}

export function str(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key]
    if (v != null && v !== '') return String(v)
  }
  return '—'
}

export function num(row: Record<string, unknown>, key: string): number | null {
  const v = row[key]
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

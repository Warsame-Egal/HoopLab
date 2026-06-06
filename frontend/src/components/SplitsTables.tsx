const TEXT_COLUMNS = new Set(['GROUP_SET', 'GROUP_VALUE', 'SEASON', 'TEAM_GAME_LOCATION'])

const HIDDEN_COLUMNS = new Set([
  'PLAYER_ID',
  'TEAM_ID',
  'GAME_ID',
  'RANK',
  'AST_RANK',
  'REB_RANK',
  'PTS_RANK',
  'BL',
  'BLKA',
])

const STAT_COLUMN_ORDER = [
  'GP',
  'W',
  'L',
  'W_PCT',
  'MIN',
  'PTS',
  'FGM',
  'FGA',
  'FG_PCT',
  'FG3M',
  'FG3A',
  'FG3_PCT',
  'FTM',
  'FTA',
  'FT_PCT',
  'OREB',
  'DREB',
  'REB',
  'AST',
  'TOV',
  'STL',
  'BLK',
  'PF',
  'PLUS_MINUS',
]

function isNumericColumn(key: string): boolean {
  return !TEXT_COLUMNS.has(key)
}

function formatSplitValue(key: string, val: unknown): string {
  if (val == null || val === '') return '—'
  const num = typeof val === 'number' ? val : Number(val)
  if (!Number.isFinite(num)) return String(val)

  if (key === 'W_PCT' || key.endsWith('_PCT')) {
    const pct = num <= 1 && num >= -1 ? num : num / 100
    return pct.toFixed(3).replace(/^0\./, '.')
  }
  if (key === 'MIN') return num.toFixed(1)
  if (Number.isInteger(num)) return String(num)
  return num.toFixed(1)
}

function unifiedColumns(resultSets: { records: Record<string, unknown>[] }[]): string[] {
  const allKeys = new Set<string>()
  for (const rs of resultSets) {
    for (const row of rs.records) {
      for (const key of Object.keys(row)) {
        if (!key.startsWith('_') && !HIDDEN_COLUMNS.has(key)) allKeys.add(key)
      }
    }
  }

  const ordered: string[] = []
  for (const key of ['GROUP_SET', 'GROUP_VALUE']) {
    if (allKeys.has(key)) {
      ordered.push(key)
      allKeys.delete(key)
    }
  }
  for (const key of STAT_COLUMN_ORDER) {
    if (allKeys.has(key)) {
      ordered.push(key)
      allKeys.delete(key)
    }
  }
  return [...ordered, ...[...allKeys].sort()]
}

function headerLabel(key: string): string {
  if (key === 'GROUP_SET') return 'Group'
  if (key === 'GROUP_VALUE') return 'Split'
  return key.replace(/_/g, ' ')
}

type SplitsTablesProps = {
  resultSets: { records: Record<string, unknown>[] }[]
}

export function SplitsTables({ resultSets }: SplitsTablesProps) {
  const sections = resultSets.filter((rs) => rs.records.length > 0)
  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">No split data available.</p>
  }

  const columns = unifiedColumns(sections)
  const allRows = sections.flatMap((section) => section.records)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead className="sticky top-0 z-10 border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((key) => (
              <th
                key={key}
                className={`whitespace-nowrap px-2 py-2 font-medium ${isNumericColumn(key) ? 'text-right' : 'text-left'}`}
              >
                {headerLabel(key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-border last:border-0 hover:bg-muted/50 ${rowIndex % 2 === 1 ? 'bg-muted/20' : ''}`}
            >
              {columns.map((key) => (
                <td
                  key={key}
                  className={`whitespace-nowrap px-2 py-2 text-foreground ${
                    isNumericColumn(key) ? 'text-right tabular-nums' : 'text-left'
                  }`}
                >
                  {formatSplitValue(key, row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

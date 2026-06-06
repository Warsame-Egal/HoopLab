import { Link } from 'react-router-dom'
import { VirtualList } from './ui/VirtualList'
import { StatTable, type StatColumn } from './ui/StatTable'
import { filterRecordColumns } from '../lib/tableColumns'

export function RecordsTable({
  records,
  maxRows = 200,
  linkColumn,
  hiddenColumns,
}: {
  records: Record<string, unknown>[]
  maxRows?: number
  linkColumn?: { key: string; href: (row: Record<string, unknown>) => string | null }
  hiddenColumns?: string[]
}) {
  if (!records.length) {
    return <p className="text-sm text-muted-foreground">No data available.</p>
  }

  const extraHidden = hiddenColumns ? new Set(hiddenColumns) : undefined
  const cols = filterRecordColumns(records, extraHidden).slice(0, 12)
  const rows = records.slice(0, maxRows)

  const columns: StatColumn<Record<string, unknown>>[] = cols.map((key) => ({
    key,
    header: key.replace(/_/g, ' '),
    align: typeof records[0][key] === 'number' ? 'right' : 'left',
    numeric: typeof records[0][key] === 'number',
    render: (row) => {
      const val = row[key]
      const href = linkColumn?.key === key ? linkColumn.href(row) : null
      const text = val == null ? '—' : String(val)
      if (href) {
        return (
          <Link to={href} className="font-medium hover:text-brand">
            {text}
          </Link>
        )
      }
      return text
    },
  }))

  if (rows.length > 40) {
    return (
      <div>
        <StatTable
          columns={columns}
          rows={rows.slice(0, 1)}
          getRowKey={() => 'header-only'}
          className="hidden"
        />
        <VirtualList
          items={rows}
          estimateSize={36}
          maxHeight={400}
          getKey={(_, i) => i}
          renderItem={(row, i) => (
            <div className="grid border-b border-border text-xs hover:bg-muted/50" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(4rem, 1fr))` }}>
              {columns.map((col) => (
                <span key={col.key} className="truncate px-2 py-2">
                  {col.render?.(row, i) ?? String(row[col.key] ?? '—')}
                </span>
              ))}
            </div>
          )}
        />
      </div>
    )
  }

  return (
    <StatTable
      columns={columns}
      rows={rows}
      getRowKey={(_, i) => i}
      emptyTitle="No data"
      emptyDescription="No records available."
    />
  )
}

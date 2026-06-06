import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'

export type StatColumn<T> = {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  numeric?: boolean
  className?: string
  render?: (row: T, index: number) => ReactNode
}

type StatTableProps<T> = {
  columns: StatColumn<T>[]
  rows: T[]
  getRowKey: (row: T, index: number) => string | number
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  stickyHeader?: boolean
  zebra?: boolean
  className?: string
  maxHeight?: string
}

export function StatTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyTitle = 'No data',
  emptyDescription = 'Nothing to show for this view.',
  stickyHeader = true,
  zebra = true,
  className,
  maxHeight,
}: StatTableProps<T>) {
  if (loading) {
    return <Skeleton className={cn('h-48 w-full', className)} />
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className="min-h-[8rem]" />
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className={cn('min-w-full', maxHeight && 'overflow-y-auto')} style={maxHeight ? { maxHeight } : undefined}>
        <table className="min-w-full text-sm">
          <thead
            className={cn(
              'border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground',
              stickyHeader && 'sticky top-0 z-10',
            )}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-3 py-2 font-medium',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.align !== 'right' && col.align !== 'center' && 'text-left',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className={cn(
                  'border-b border-border last:border-0 hover:bg-muted/60',
                  zebra && index % 2 === 1 && 'bg-muted/20',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-3 py-2 text-foreground',
                      col.numeric && 'text-right tabular-nums',
                      col.align === 'right' && 'text-right tabular-nums',
                      col.align === 'center' && 'text-center',
                      col.className,
                    )}
                  >
                    {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

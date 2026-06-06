import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from './ui/card'
import { cn } from '../lib/utils'
import { EmptyState } from './ui/EmptyState'
import { SectionHeader } from './ui/SectionHeader'
import { Skeleton } from './ui/Skeleton'
import { api } from '../lib/api'
import { type LeagueRecordsResponse, num, str } from '../lib/league'

export type LeaderRowConfig = {
  nameKeys: string[]
  subKeys?: string[]
  valueKey: string
  valueFormat?: (v: number) => string
  link?: (row: Record<string, unknown>) => string | null
}

export function LeagueRecordsPanel({
  title,
  sublabel,
  icon: Icon,
  queryKey,
  path,
  config,
  limit = 5,
  compact = false,
  action,
  enabled = true,
}: {
  title: string
  sublabel?: string
  icon: LucideIcon
  queryKey: unknown[]
  path: string
  config: LeaderRowConfig
  limit?: number
  compact?: boolean
  action?: React.ReactNode
  enabled?: boolean
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => api<LeagueRecordsResponse>(path),
    enabled,
    staleTime: 60_000 * 15,
    retry: 1,
  })

  const rows = (data?.records ?? [])
    .filter((r) => num(r, config.valueKey) != null)
    .sort((a, b) => (num(b, config.valueKey) ?? 0) - (num(a, config.valueKey) ?? 0))
    .slice(0, limit)

  return (
    <Card className="card-hover">
      <CardHeader className={cn('border-b border-border', compact ? 'px-3 py-3' : 'pb-4')}>
        <SectionHeader icon={Icon} sublabel={sublabel} title={title} action={action} />
      </CardHeader>
      <CardContent className={cn('space-y-1.5', compact ? 'px-3 pb-3 pt-2' : 'space-y-2 pt-4')}>
        {isLoading ? (
          Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className={cn('w-full', compact ? 'h-10' : 'h-12')} />
          ))
        ) : isError || rows.length === 0 ? (
          <EmptyState title="No data" description="Stats unavailable for this season." className="py-6" />
        ) : (
          rows.map((row, i) => {
            const value = num(row, config.valueKey)!
            const formatted = config.valueFormat ? config.valueFormat(value) : value.toFixed(1)
            const href = config.link?.(row)
            const inner = (
              <div
                className={cn(
                  'flex items-center justify-between rounded-md border border-border bg-surface-2',
                  compact ? 'px-2 py-1.5' : 'rounded-lg px-3 py-2',
                )}
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      'truncate font-medium text-foreground',
                      compact ? 'text-xs' : 'text-sm',
                    )}
                  >
                    {str(row, ...config.nameKeys)}
                  </p>
                  {config.subKeys ? (
                    <p className="truncate text-[10px] text-muted-foreground">
                      {str(row, ...config.subKeys)}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    'ml-2 shrink-0 font-semibold tabular-nums text-brand',
                    compact ? 'text-xs' : 'text-sm',
                  )}
                >
                  {formatted}
                </span>
              </div>
            )
            return href ? (
              <Link key={i} to={href} className="block transition-opacity hover:opacity-90">
                {inner}
              </Link>
            ) : (
              <div key={i}>{inner}</div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

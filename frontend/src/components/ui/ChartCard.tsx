import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'
import { cn } from '../../lib/utils'

type ChartCardProps = {
  title: ReactNode
  icon?: LucideIcon
  loading?: boolean
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
  chartHeight?: number
}

export function ChartCard({
  title,
  icon: Icon,
  loading = false,
  empty = false,
  emptyTitle = 'No data',
  emptyDescription = 'No data for this season.',
  children,
  footer,
  className,
  chartHeight = 260,
}: ChartCardProps) {
  const heightClass = chartHeight >= 240 ? 'min-h-[260px]' : 'min-h-[12rem]'

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-3 text-foreground">
          {Icon ? <Icon className="h-5 w-5 text-info" aria-hidden /> : null}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <Skeleton className={cn('w-full', heightClass)} />
        ) : empty ? (
          <EmptyState className={cn('w-full', heightClass)} title={emptyTitle} description={emptyDescription} />
        ) : (
          children
        )}
        {footer && !loading && !empty ? <div className="mt-3">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}

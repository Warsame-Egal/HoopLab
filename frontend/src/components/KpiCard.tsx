import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { cn } from '../lib/utils'

const TINTS = {
  brand: { bg: 'bg-brand/10', color: 'text-brand' },
  success: { bg: 'bg-success/15', color: 'text-success' },
  info: { bg: 'bg-info/15', color: 'text-info' },
  warning: { bg: 'bg-warning/15', color: 'text-warning' },
  live: { bg: 'bg-live/15', color: 'text-live' },
} as const

export function KpiCard({
  label,
  value,
  suffix,
  sub,
  icon: Icon,
  tint = 'brand',
  delta,
  className,
  onClick,
}: {
  label: string
  value: string | number
  suffix?: string
  sub?: string
  icon?: LucideIcon
  tint?: keyof typeof TINTS
  delta?: number | null
  className?: string
  onClick?: () => void
}) {
  const colors = TINTS[tint]
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Card className={cn('card-hover text-left', className)}>
      <CardContent className="p-5">
        <Wrapper
          type={onClick ? 'button' : undefined}
          onClick={onClick}
          className={cn(
            'flex w-full items-center justify-between',
            onClick && 'cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          aria-label={onClick ? `${label}: ${value}${suffix ?? ''}` : undefined}
        >
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {value}
              {suffix ? <span className="ml-0.5 text-lg text-muted-foreground">{suffix}</span> : null}
            </p>
            {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
            {delta != null && delta !== 0 ? (
              <p
                className={cn(
                  'mt-1 flex items-center gap-0.5 text-xs font-medium',
                  delta > 0 ? 'text-success' : 'text-live',
                )}
              >
                {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)} vs league avg
              </p>
            ) : null}
          </div>
          {Icon ? (
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colors.bg)}>
              <Icon className={cn('h-5 w-5', colors.color)} aria-hidden />
            </div>
          ) : null}
        </Wrapper>
      </CardContent>
    </Card>
  )
}

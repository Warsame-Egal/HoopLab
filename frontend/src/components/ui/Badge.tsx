import { cn } from '../../lib/utils'

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode
  variant?: 'default' | 'live' | 'brand' | 'success' | 'warning' | 'destructive'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        variant === 'live' && 'bg-live/15 text-live',
        variant === 'brand' && 'bg-brand/10 text-brand',
        variant === 'success' && 'bg-success/15 text-success',
        variant === 'warning' && 'bg-warning/15 text-warning',
        variant === 'destructive' && 'bg-destructive/15 text-destructive',
        variant === 'default' && 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

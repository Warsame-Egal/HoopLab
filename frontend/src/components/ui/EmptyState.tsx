import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 text-center', className)}>
      {Icon ? <Icon className="mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden /> : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}

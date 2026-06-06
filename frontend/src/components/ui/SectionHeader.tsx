import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

export function SectionHeader({
  icon: Icon,
  title,
  sublabel,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  sublabel?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div>
        {sublabel ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {sublabel}
          </p>
        ) : null}
        <h3 className={cn('flex items-center gap-2 font-semibold text-foreground', sublabel && 'mt-0.5')}>
          {Icon ? <Icon className="h-4 w-4 text-brand" aria-hidden /> : null}
          {title}
        </h3>
      </div>
      {action}
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { cn } from '../lib/utils'

export function KpiCard({
  label,
  value,
  suffix,
  sub,
  icon: Icon,
  iconBg = 'bg-gray-100',
  iconColor = 'text-gray-600',
  className,
}: {
  label: string
  value: string | number
  suffix?: string
  sub?: string
  icon?: LucideIcon
  iconBg?: string
  iconColor?: string
  className?: string
}) {
  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {value}
              {suffix ? <span className="ml-0.5 text-lg text-gray-400">{suffix}</span> : null}
            </p>
            {sub ? <p className="mt-0.5 text-xs text-gray-400">{sub}</p> : null}
          </div>
          {Icon ? (
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconBg)}>
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

import { useState } from 'react'
import { cn } from '../lib/utils'

export function teamLogoUrl(abbreviation: string | null | undefined): string | null {
  return abbreviation ? `/logos/${abbreviation.toUpperCase()}.svg` : null
}

type TeamLogoProps = {
  abbreviation: string | null | undefined
  className?: string
}

export function TeamLogo({ abbreviation, className }: TeamLogoProps) {
  const [failed, setFailed] = useState(false)
  const url = teamLogoUrl(abbreviation)

  if (!url || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500',
          className,
        )}
      >
        {abbreviation ?? '—'}
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={abbreviation ?? 'team logo'}
      className={cn('object-contain', className)}
      onError={() => setFailed(true)}
    />
  )
}

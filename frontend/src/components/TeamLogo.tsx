import { useState } from 'react'
import { teamLogoCdnUrl, teamLogoUrl } from '../lib/teamLogo'
import { cn } from '../lib/utils'

type TeamLogoProps = {
  abbreviation: string | null | undefined
  teamId?: number | null
  className?: string
}

export function TeamLogo({ abbreviation, teamId, className }: TeamLogoProps) {
  const [useCdn, setUseCdn] = useState(false)
  const [failed, setFailed] = useState(false)
  const localUrl = teamLogoUrl(abbreviation)
  const cdnUrl = teamLogoCdnUrl(teamId)
  const url = useCdn || !localUrl ? cdnUrl : localUrl

  if (!url || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground',
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
      onError={() => {
        if (!useCdn && cdnUrl) {
          setUseCdn(true)
          return
        }
        setFailed(true)
      }}
    />
  )
}

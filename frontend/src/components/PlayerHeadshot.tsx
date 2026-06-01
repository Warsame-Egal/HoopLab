import { useState } from 'react'
import { getPlayerHeadshotUrl } from '../lib/playerHeadshot'
import { cn } from '../lib/utils'

type PlayerHeadshotProps = {
  playerId: number
  name: string
  className?: string
}

export function PlayerHeadshot({ playerId, name, className }: PlayerHeadshotProps) {
  const [failed, setFailed] = useState(false)
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (failed || !Number.isFinite(playerId)) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-500',
          className,
        )}
      >
        {initials || '?'}
      </div>
    )
  }

  return (
    <img
      src={getPlayerHeadshotUrl(playerId)}
      alt={name}
      className={cn(
        'shrink-0 rounded-full border border-gray-200 bg-gray-100 object-cover object-top',
        className,
      )}
      onError={() => setFailed(true)}
    />
  )
}

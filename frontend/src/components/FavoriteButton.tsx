import { Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'
import {
  isFavoritePlayer,
  isFavoriteTeam,
  toggleFavoritePlayer,
  toggleFavoriteTeam,
} from '../lib/favorites'

type FavoriteButtonProps = {
  kind: 'team' | 'player'
  id: number
  className?: string
}

export function FavoriteButton({ kind, id, className }: FavoriteButtonProps) {
  const [on, setOn] = useState(() =>
    kind === 'team' ? isFavoriteTeam(id) : isFavoritePlayer(id),
  )

  return (
    <button
      type="button"
      aria-label={on ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={on}
      onClick={() => {
        const next =
          kind === 'team' ? toggleFavoriteTeam(id) : toggleFavoritePlayer(id)
        setOn(next)
      }}
      className={cn(
        'rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground',
        on && 'text-brand',
        className,
      )}
    >
      <Star className={cn('h-5 w-5', on && 'fill-current')} />
    </button>
  )
}

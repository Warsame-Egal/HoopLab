import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { Game } from '../types/scoreboard'
import { getGameStatus, isClutchGame } from '../types/scoreboard'

type GamesToWatchProps = {
  games: Game[]
}

export function GamesToWatch({ games }: GamesToWatchProps) {
  const clutch = games.filter((g) => isClutchGame(g))
  const closeLive = games.filter((g) => {
    if (getGameStatus(g) !== 'live') return false
    const diff = Math.abs((g.homeTeam.score ?? 0) - (g.awayTeam.score ?? 0))
    return diff <= 10 && !isClutchGame(g)
  })
  const watch = [...clutch, ...closeLive].slice(0, 5)

  if (watch.length === 0) return null

  return (
    <Card className="border-live/30 bg-live/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <Flame className="h-4 w-4 text-live" />
          Games to watch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {watch.map((g) => (
          <Link
            key={g.gameId}
            to={`/games/${g.gameId}`}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
          >
            <span className="font-medium text-foreground">
              {g.awayTeam.teamTricode} {g.awayTeam.score} @ {g.homeTeam.teamTricode} {g.homeTeam.score}
            </span>
            <span className="text-xs text-live">
              {isClutchGame(g) ? 'Clutch' : g.gameStatusText}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

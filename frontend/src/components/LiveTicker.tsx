import { Link } from 'react-router-dom'
import { useLiveScoreboard } from '../hooks/useLiveScoreboard'
import { getGameStatus } from '../types/scoreboard'

export function LiveTicker() {
  const { games, liveCount } = useLiveScoreboard()
  const live = games.filter((g) => getGameStatus(g) === 'live')
  if (liveCount === 0) return null

  return (
    <div className="border-b border-border bg-live/5">
      <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-2 text-xs">
        <span className="shrink-0 font-semibold uppercase tracking-wide text-live">Live</span>
        {live.map((g) => (
          <Link
            key={g.gameId}
            to={`/games/${g.gameId}`}
            className="flex shrink-0 items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
          >
            <span className="font-medium text-foreground">
              {g.awayTeam.teamTricode} {g.awayTeam.score} @ {g.homeTeam.teamTricode} {g.homeTeam.score}
            </span>
            <span className="text-muted-foreground">{g.gameStatusText}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

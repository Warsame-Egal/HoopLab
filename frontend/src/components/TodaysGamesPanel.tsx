import { Link } from 'react-router-dom'
import { LiveGameCard } from './LiveGameCard'
import { Card, CardContent, CardHeader } from './ui/card'
import { SectionHeader } from './ui/SectionHeader'
import { Badge } from './ui/Badge'
import { Skeleton } from './ui/Skeleton'
import { EmptyState } from './ui/EmptyState'
import { useLiveScoreboard } from '../hooks/useLiveScoreboard'
import { getGameStatus, type Game } from '../types/scoreboard'
import { cn } from '../lib/utils'
import { Radio } from 'lucide-react'

type TodaysGamesPanelProps = {
  className?: string
  games?: Game[]
  liveCount?: number
  isLoading?: boolean
  recentlyUpdated?: Set<string>
}

export function TodaysGamesPanel({
  className,
  games: gamesProp,
  liveCount: liveCountProp,
  isLoading: isLoadingProp,
  recentlyUpdated: recentlyUpdatedProp,
}: TodaysGamesPanelProps) {
  const useHook = gamesProp == null
  const hook = useLiveScoreboard(undefined, { enabled: useHook, enableWebSocket: false })
  const games = gamesProp ?? hook.games
  const liveCount = liveCountProp ?? hook.liveCount
  const isLoading = isLoadingProp ?? hook.isLoading
  const recentlyUpdated = recentlyUpdatedProp ?? hook.recentlyUpdated

  const liveGames = games.filter((g) => getGameStatus(g) === 'live')
  const upcomingGames = games.filter((g) => getGameStatus(g) === 'upcoming')
  const completedGames = games.filter((g) => getGameStatus(g) === 'completed')
  const showLive = liveGames.slice(0, 4)
  const showUpcoming = upcomingGames.slice(0, 2)
  const showCompleted = completedGames.slice(0, 2)
  const hasGames = showLive.length + showUpcoming.length + showCompleted.length > 0

  return (
    <Card className={cn('card-hover flex h-full flex-col', className)}>
      <CardHeader className="shrink-0 border-b border-border pb-4">
        <SectionHeader
          icon={Radio}
          sublabel="Live"
          title="Today's Games"
          action={
            <div className="flex items-center gap-2">
              {liveCount > 0 ? <Badge variant="live">{liveCount} live</Badge> : null}
              <Link to="/scoreboard" className="text-xs font-medium text-brand hover:underline">
                View all
              </Link>
            </div>
          }
        />
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading && games.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !hasGames ? (
          <EmptyState title="No games today" description="Check back when the schedule has games." />
        ) : (
          <div className="space-y-4">
            {showLive.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wide text-live">Live now</p>
                </div>
                {showLive.map((game) => (
                  <LiveGameCard
                    key={game.gameId}
                    game={game}
                    compact
                    recentlyUpdated={recentlyUpdated.has(game.gameId)}
                  />
                ))}
              </div>
            ) : null}
            {showUpcoming.length > 0 ? (
              <div className="space-y-3">
                {showLive.length > 0 ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Upcoming
                  </p>
                ) : null}
                {showUpcoming.map((game) => (
                  <LiveGameCard
                    key={game.gameId}
                    game={game}
                    compact
                    recentlyUpdated={recentlyUpdated.has(game.gameId)}
                  />
                ))}
              </div>
            ) : null}
            {showCompleted.length > 0 ? (
              <div className="space-y-3">
                {(showLive.length > 0 || showUpcoming.length > 0) ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Final
                  </p>
                ) : null}
                {showCompleted.map((game) => (
                  <LiveGameCard
                    key={game.gameId}
                    game={game}
                    compact
                    recentlyUpdated={recentlyUpdated.has(game.gameId)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TeamLogo } from './TeamLogo'
import { EmptyState } from './ui/EmptyState'
import { Skeleton } from './ui/Skeleton'
import { api, type GameSummary } from '../lib/api'
import { cn } from '../lib/utils'

function shortDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RecentGamesCard({ season, teamId }: { season: string; teamId?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-games', season, teamId],
    queryFn: () => api<GameSummary[]>(`/api/games?season=${season}&limit=12${teamId ? `&teamId=${teamId}` : ''}`),
  })

  const games = (data ?? []).filter((g) =>
    teamId == null ? true : g.homeTeamId === teamId || g.awayTeamId === teamId,
  )

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <CalendarDays className="h-5 w-5 text-brand" />
          Recent Games
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : games.length === 0 ? (
          <EmptyState title="No recent games" description={`No games for ${season}.`} className="min-h-[8rem]" />
        ) : (
          <ul className="space-y-1">
            {games.slice(0, 8).map((game) => {
              const homeWon = (game.homePts ?? 0) > (game.awayPts ?? 0)
              return (
                <li key={game.gameId}>
                  <Link
                    to={`/games/${game.gameId}`}
                    className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm transition hover:border-border hover:bg-muted"
                  >
                    <span className="w-12 shrink-0 text-xs text-muted-foreground">{shortDate(game.gameDate)}</span>
                    <span className="flex flex-1 items-center justify-center gap-2">
                      <TeamLogo abbreviation={game.awayAbbr ?? ''} className="h-5 w-5" />
                      <span className={cn('font-medium', homeWon ? 'text-muted-foreground' : 'text-foreground')}>
                        {game.awayAbbr ?? '—'}
                      </span>
                      <span className={cn('tabular-nums', homeWon ? 'text-muted-foreground' : 'font-semibold text-foreground')}>
                        {game.awayPts ?? '—'}
                      </span>
                      <span className="text-muted-foreground/50">@</span>
                      <span className={cn('tabular-nums', homeWon ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                        {game.homePts ?? '—'}
                      </span>
                      <span className={cn('font-medium', homeWon ? 'text-foreground' : 'text-muted-foreground')}>
                        {game.homeAbbr ?? '—'}
                      </span>
                      <TeamLogo abbreviation={game.homeAbbr ?? ''} className="h-5 w-5" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

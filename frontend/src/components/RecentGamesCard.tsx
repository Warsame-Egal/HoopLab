import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { api, type GameSummary } from '../lib/api'
import { cn } from '../lib/utils'

function shortDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RecentGamesCard({ season }: { season: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-games', season],
    queryFn: () => api<GameSummary[]>(`/api/games?season=${season}&limit=12`),
  })

  const games = data ?? []

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="flex items-center gap-3 text-gray-900">
          <CalendarDays className="h-5 w-5 text-sky-600" />
          Recent Games
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading games…</p>
        ) : games.length === 0 ? (
          <p className="text-sm text-gray-400">No games ingested for {season} yet.</p>
        ) : (
          <div className="max-h-[360px] space-y-1 overflow-y-auto">
            {games.map((game) => {
              const homeWon = (game.homePts ?? 0) >= (game.awayPts ?? 0)
              return (
                <Link
                  key={game.gameId}
                  to={`/games/${game.gameId}`}
                  className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm transition hover:border-gray-200 hover:bg-gray-50"
                >
                  <span className="w-12 shrink-0 text-xs text-gray-400">{shortDate(game.gameDate)}</span>
                  <span className="flex flex-1 items-center justify-center gap-2">
                    <span className={cn('font-medium', homeWon ? 'text-gray-500' : 'text-gray-900')}>
                      {game.awayAbbr ?? '—'}
                    </span>
                    <span className={cn('tabular-nums', homeWon ? 'text-gray-500' : 'font-semibold text-gray-900')}>
                      {game.awayPts ?? '—'}
                    </span>
                    <span className="text-gray-300">@</span>
                    <span className={cn('tabular-nums', homeWon ? 'font-semibold text-gray-900' : 'text-gray-500')}>
                      {game.homePts ?? '—'}
                    </span>
                    <span className={cn('font-medium', homeWon ? 'text-gray-900' : 'text-gray-500')}>
                      {game.homeAbbr ?? '—'}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

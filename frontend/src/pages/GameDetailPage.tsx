import { useQuery } from '@tanstack/react-query'
import { Suspense, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LiveBoxScoreView } from '../components/LiveBoxScoreView'
import { PlayByPlayFeed } from '../components/PlayByPlayFeed'
import { QueryErrorState } from '../components/QueryErrorState'
import { RouteErrorBoundary } from '../components/RouteErrorBoundary'
import { TeamLogo } from '../components/TeamLogo'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/Skeleton'
import { useLiveBoxScore } from '../hooks/useLiveBoxScore'
import { useLivePlayByPlay } from '../hooks/useLivePlayByPlay'
import { useLiveScoreboard } from '../hooks/useLiveScoreboard'
import { lazyRetry } from '../lib/lazyRetry'
import { api, type BoxScore, type BoxScoreTeam } from '../lib/api'
import { formatPercent, formatPlusMinus } from '../lib/format'
import { cn } from '../lib/utils'
import { getGameStatus } from '../types/scoreboard'

const AdvancedBoxScoreTable = lazyRetry(() =>
  import('../components/AdvancedBoxScoreTable').then((m) => ({ default: m.AdvancedBoxScoreTable })),
)
const FourFactorsCompare = lazyRetry(() =>
  import('../components/FourFactorsCompare').then((m) => ({ default: m.FourFactorsCompare })),
)
const GameSummaryCard = lazyRetry(() =>
  import('../components/GameSummaryCard').then((m) => ({ default: m.GameSummaryCard })),
)
const VariantBoxScoreTable = lazyRetry(() =>
  import('../components/VariantBoxScoreTable').then((m) => ({ default: m.VariantBoxScoreTable })),
)
const WinProbabilityChart = lazyRetry(() =>
  import('../components/WinProbabilityChart').then((m) => ({ default: m.WinProbabilityChart })),
)

type BoxTab =
  | 'traditional'
  | 'advanced'
  | 'scoring'
  | 'fourfactors'
  | 'usage'
  | 'hustle'
  | 'playertrack'
  | 'summary'

const BOX_TABS: { key: BoxTab; label: string }[] = [
  { key: 'traditional', label: 'Traditional' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'scoring', label: 'Scoring' },
  { key: 'fourfactors', label: 'Four Factors' },
  { key: 'usage', label: 'Usage' },
  { key: 'hustle', label: 'Hustle' },
  { key: 'playertrack', label: 'Tracking' },
  { key: 'summary', label: 'Summary' },
]

function TabFallback() {
  return <Skeleton className="h-64 w-full" />
}

function pct(made: number | null, att: number | null): string {
  return formatPercent(made != null && att != null && att > 0 ? made / att : null, 0)
}

function TeamBox({ team }: { team: BoxScoreTeam }) {
  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center justify-between text-foreground">
          <span className="flex items-center gap-3">
            <TeamLogo abbreviation={team.abbreviation} className="h-8 w-8" />
            {team.teamName ?? team.abbreviation}
          </span>
          <span className="text-2xl font-bold text-brand">{team.pts ?? '—'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Player</th>
                <th className="px-2 py-2 text-right font-medium">MIN</th>
                <th className="px-2 py-2 text-right font-medium">PTS</th>
                <th className="px-2 py-2 text-right font-medium">REB</th>
                <th className="px-2 py-2 text-right font-medium">AST</th>
                <th className="px-2 py-2 text-right font-medium">FG</th>
                <th className="px-2 py-2 text-right font-medium">3P</th>
                <th className="px-2 py-2 text-right font-medium">+/-</th>
              </tr>
            </thead>
            <tbody>
              {team.players.map((p) => (
                <tr key={p.playerId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Link to={`/players/${p.playerId}`} className="font-medium text-foreground hover:text-brand">
                      {p.name}
                    </Link>
                    {p.startPosition ? <span className="ml-1 text-muted-foreground">{p.startPosition}</span> : null}
                  </td>
                  <td className="px-2 py-2 text-right text-muted-foreground">{p.min ?? '—'}</td>
                  <td className="px-2 py-2 text-right font-semibold text-foreground">{p.pts ?? 0}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">{p.reb ?? 0}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">{p.ast ?? 0}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">
                    {p.fgm ?? 0}/{p.fga ?? 0} ({pct(p.fgm, p.fga)})
                  </td>
                  <td className="px-2 py-2 text-right text-muted-foreground">
                    {p.fg3m ?? 0}/{p.fg3a ?? 0}
                  </td>
                  <td
                    className={cn(
                      'px-2 py-2 text-right',
                      (p.plusMinus ?? 0) >= 0 ? 'text-success' : 'text-live',
                    )}
                  >
                    {formatPlusMinus(p.plusMinus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function GameDetailPage() {
  const { gameId } = useParams()
  const [tab, setTab] = useState<BoxTab>('traditional')
  const { games, isLoading: scoreboardLoading } = useLiveScoreboard()

  const liveGame = games.find((g) => g.gameId.padStart(10, '0') === gameId?.padStart(10, '0'))
  const isLive = liveGame != null && getGameStatus(liveGame) === 'live'
  const scoreboardReady = !scoreboardLoading

  const historical = useQuery({
    queryKey: ['boxscore', gameId],
    queryFn: () => api<BoxScore>(`/api/games/${gameId}/boxscore`),
    enabled: !!gameId && scoreboardReady && !isLive,
    retry: 1,
  })

  const useLiveChannel = isLive || (scoreboardReady && !!gameId && historical.isError)
  const depthStatsEnabled = !!gameId && scoreboardReady && !useLiveChannel
  const liveBox = useLiveBoxScore(gameId, useLiveChannel)
  const { plays, isLoading: pbpLoading } = useLivePlayByPlay(gameId, useLiveChannel)

  const showLiveBox = useLiveChannel && !!liveBox.data

  return (
    <div className="space-y-6">
      <Link
        to=".."
        onClick={(e) => {
          e.preventDefault()
          history.back()
        }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {liveGame && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-card p-4">
          <div className="flex items-center gap-3">
            <TeamLogo abbreviation={liveGame.awayTeam.teamTricode} className="h-10 w-10" />
            <span className="text-xl font-bold tabular-nums">{liveGame.awayTeam.score ?? 0}</span>
          </div>
          <span className="text-sm text-muted-foreground">@</span>
          <div className="flex items-center gap-3">
            <TeamLogo abbreviation={liveGame.homeTeam.teamTricode} className="h-10 w-10" />
            <span className="text-xl font-bold tabular-nums">{liveGame.homeTeam.score ?? 0}</span>
          </div>
          <span
            className={cn(
              'ml-auto rounded-full px-3 py-1 text-xs font-semibold',
              isLive ? 'bg-live/10 text-live' : 'bg-muted text-muted-foreground',
            )}
          >
            {liveGame.gameStatusText}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Game Detail</h2>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          {BOX_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'summary' && gameId ? (
        <RouteErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            <div className="space-y-6">
              <GameSummaryCard gameId={gameId} enabled={depthStatsEnabled} />
              <FourFactorsCompare gameId={gameId} enabled={depthStatsEnabled} />
            </div>
          </Suspense>
        </RouteErrorBoundary>
      ) : tab === 'traditional' ? (
        <div className="space-y-6">
          {showLiveBox ? (
            liveBox.isLoading ? (
              <TabFallback />
            ) : liveBox.data ? (
              <LiveBoxScoreView data={liveBox.data} />
            ) : liveBox.isError ? (
              <QueryErrorState onRetry={() => liveBox.refetch()} />
            ) : (
              <p className="text-muted-foreground">No box score available for this game.</p>
            )
          ) : historical.isLoading ? (
            <TabFallback />
          ) : historical.isError ? (
            <QueryErrorState onRetry={() => historical.refetch()} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {historical.data?.teams.map((team) => (
                <TeamBox key={team.teamId} team={team} />
              ))}
            </div>
          )}

          <PlayByPlayFeed plays={plays} isLoading={pbpLoading} live={useLiveChannel} />

          {!isLive && !useLiveChannel && gameId ? (
            <RouteErrorBoundary>
              <Suspense fallback={<TabFallback />}>
                <WinProbabilityChart gameId={gameId} />
              </Suspense>
            </RouteErrorBoundary>
          ) : null}
        </div>
      ) : tab === 'advanced' || tab === 'fourfactors' ? (
        <RouteErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            <div className="space-y-6">
              <AdvancedBoxScoreTable gameId={gameId ?? ''} measure={tab} enabled={depthStatsEnabled} />
              {tab === 'fourfactors' && gameId ? (
                <FourFactorsCompare gameId={gameId} enabled={depthStatsEnabled} />
              ) : null}
            </div>
          </Suspense>
        </RouteErrorBoundary>
      ) : (
        <RouteErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            <VariantBoxScoreTable
              gameId={gameId ?? ''}
              variant={tab as 'scoring' | 'usage' | 'hustle' | 'playertrack'}
              enabled={depthStatsEnabled}
            />
          </Suspense>
        </RouteErrorBoundary>
      )}
    </div>
  )
}

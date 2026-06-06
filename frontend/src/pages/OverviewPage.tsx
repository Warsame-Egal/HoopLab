import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { BarChart3, Flame, TrendingUp, Trophy, Users } from 'lucide-react'
import { DashboardTrends } from '../components/DashboardTrends'
import { KpiCard } from '../components/KpiCard'
import { FavoritesStrip } from '../components/FavoritesStrip'
import {
  OverviewLeagueAside,
  OverviewLeagueStatsGrid,
  OverviewLiveSection,
} from '../components/OverviewSidebarPanels'
import { TodaysGamesPanel } from '../components/TodaysGamesPanel'
import { useLiveScoreboard } from '../hooks/useLiveScoreboard'
import { useLiveNotifications } from '../hooks/useLiveNotifications'
import { RecentGamesCard } from '../components/RecentGamesCard'
import { TeamDetailSidebar } from '../components/TeamDetailSidebar'
import { TeamMap, type MapMetric } from '../components/TeamMap'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { QueryErrorState } from '../components/QueryErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { api, type Overview, type TeamMapPoint } from '../lib/api'
import { cn } from '../lib/utils'
import { teamWinPct } from '../lib/teamWinPct'
import { TeamTrendPanel } from '../components/TeamTrendPanel'
import { useSeason } from '../lib/useSeason'

const METRIC_TABS: { key: MapMetric; label: string }[] = [
  { key: 'winPct', label: 'Win %' },
  { key: 'netRtg', label: 'Net Rating' },
  { key: 'clutchNetRtg', label: 'Clutch' },
]

type KpiConfig = {
  label: string
  value: string | number
  suffix?: string
  sub: string
  icon: LucideIcon
  tint: 'brand' | 'success' | 'info' | 'warning' | 'live'
  delta?: number | null
}

function OverviewLoadingState({ season }: { season: string }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [season])

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Loading league overview for {season} from NBA APIs…{' '}
        <span className="font-medium text-foreground">{seconds}s</span>
      </p>
      <OverviewSkeleton />
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full max-w-xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="min-h-[640px] w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="min-h-[320px] lg:col-span-7" />
        <Skeleton className="min-h-[320px] lg:col-span-5" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function OverviewPage() {
  const { season } = useSeason()
  const [mapMetric, setMapMetric] = useState<MapMetric>('winPct')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: number; name: string } | null>(null)

  const {
    data: overview,
    isLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['overview', season],
    queryFn: () => api<Overview>(`/api/analytics/overview?season=${season}`),
    retry: 1,
    staleTime: 5 * 60_000,
  })

  const overviewReady = !!overview && !overviewError

  const {
    data: teamMap,
    isLoading: isMapLoading,
    isError: mapError,
    refetch: refetchMap,
  } = useQuery({
    queryKey: ['teamMap', season],
    queryFn: () => api<TeamMapPoint[]>(`/api/teams/map?season=${season}`),
    enabled: overviewReady,
    retry: 1,
    staleTime: 5 * 60_000,
  })

  const coreReady = overviewReady && !mapError
  const [sidebarDelayDone, setSidebarDelayDone] = useState(false)

  useEffect(() => {
    if (!coreReady) return
    const id = window.setTimeout(() => setSidebarDelayDone(true), 800)
    return () => {
      window.clearTimeout(id)
      setSidebarDelayDone(false)
    }
  }, [coreReady, season])

  const panelsReady = coreReady && sidebarDelayDone

  const {
    games: liveGames,
    isToday,
    liveCount,
    isLoading: scoreboardLoading,
    recentlyUpdated,
  } = useLiveScoreboard(undefined, {
    enabled: coreReady,
    enableWebSocket: coreReady,
    season,
  })

  useLiveNotifications(liveGames, isToday && panelsReady)

  const handleSelectTeam = useCallback((teamId: number) => {
    setSelectedTeamId(teamId)
    setSelectedPlayer(null)
  }, [])

  const handleSelectPlayer = useCallback((playerId: number, playerName: string) => {
    setSelectedPlayer({ id: playerId, name: playerName })
  }, [])

  const handleClose = useCallback(() => {
    setSelectedTeamId(null)
    setSelectedPlayer(null)
  }, [])

  if (overviewError) {
    return (
      <QueryErrorState
        message="Could not load overview. Check that backend (:8080) and data (:8000) are running."
        onRetry={() => {
          void refetchOverview()
        }}
      />
    )
  }

  if (isLoading || !overview) {
    return <OverviewLoadingState season={season} />
  }

  const teams = teamMap ?? []
  const mapStillLoading = isMapLoading || (!teamMap && !mapError)
  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId)
  const hasSelection = selectedTeamId != null || selectedPlayer != null

  const validNetRtg = teams.map((t) => t.netRtg).filter((v): v is number => v != null)
  const validClutch = teams.map((t) => t.clutchNetRtg).filter((v): v is number => v != null)

  const avgNetRtg = validNetRtg.length ? validNetRtg.reduce((a, b) => a + b, 0) / validNetRtg.length : 0
  const avgClutch = validClutch.length ? validClutch.reduce((a, b) => a + b, 0) / validClutch.length : 0

  const topByNetRtg = [...teams].sort((a, b) => (b.netRtg ?? -Infinity) - (a.netRtg ?? -Infinity))[0]
  const lowestByNetRtg = [...teams].sort((a, b) => (a.netRtg ?? Infinity) - (b.netRtg ?? Infinity))[0]
  const topByClutch = [...teams].sort((a, b) => (b.clutchNetRtg ?? -Infinity) - (a.clutchNetRtg ?? -Infinity))[0]

  const validWinPct = teams.map((t) => teamWinPct(t)).filter((v): v is number => v != null)
  const avgWinPct = validWinPct.length ? validWinPct.reduce((a, b) => a + b, 0) / validWinPct.length : 0
  const above500 = teams.filter((t) => (teamWinPct(t) ?? 0) >= 50).length
  const topByWinPct = [...teams].sort((a, b) => (teamWinPct(b) ?? -Infinity) - (teamWinPct(a) ?? -Infinity))[0]
  const eliteTeams = teams.filter((t) => (teamWinPct(t) ?? 0) >= 55).length

  const focusCardsByMetric: Record<MapMetric, KpiConfig[]> = {
    winPct: [
      {
        label: 'Avg Win %',
        value: avgWinPct.toFixed(1),
        suffix: '%',
        sub: 'Across all teams',
        icon: BarChart3,
        tint: 'info',
      },
      {
        label: 'Above .500',
        value: above500,
        sub: 'Teams at or above 50%',
        icon: TrendingUp,
        tint: 'success',
      },
      {
        label: 'Elite Teams',
        value: eliteTeams,
        sub: 'Teams above 55% win rate',
        icon: Trophy,
        tint: 'brand',
      },
      {
        label: 'Best Record',
        value: topByWinPct ? `${topByWinPct.wins ?? 0}–${topByWinPct.losses ?? 0}` : '—',
        sub: topByWinPct?.abbreviation ?? '—',
        icon: Users,
        tint: 'live',
        delta: topByWinPct ? (teamWinPct(topByWinPct) ?? 0) - avgWinPct : null,
      },
    ],
    netRtg: [
      {
        label: 'Net Rating Avg',
        value: avgNetRtg.toFixed(1),
        sub: 'Average team net rating',
        icon: BarChart3,
        tint: 'info',
        delta: 0,
      },
      {
        label: 'Positive Net',
        value: teams.filter((t) => (t.netRtg ?? -Infinity) > 0).length,
        sub: 'Teams above zero net rating',
        icon: TrendingUp,
        tint: 'success',
      },
      {
        label: 'Top Net Team',
        value: topByNetRtg?.netRtg?.toFixed(1) ?? '—',
        sub: topByNetRtg?.abbreviation ?? '—',
        icon: Trophy,
        tint: 'brand',
        delta: topByNetRtg?.netRtg != null ? topByNetRtg.netRtg - avgNetRtg : null,
      },
      {
        label: 'Lowest Net Team',
        value: lowestByNetRtg?.netRtg?.toFixed(1) ?? '—',
        sub: lowestByNetRtg?.abbreviation ?? '—',
        icon: Users,
        tint: 'live',
        delta: lowestByNetRtg?.netRtg != null ? lowestByNetRtg.netRtg - avgNetRtg : null,
      },
    ],
    clutchNetRtg: [
      {
        label: 'Clutch Net Avg',
        value: avgClutch.toFixed(1),
        sub: 'Avg net rating in clutch time',
        icon: Flame,
        tint: 'warning',
      },
      {
        label: 'Clutch Positive',
        value: teams.filter((t) => (t.clutchNetRtg ?? -Infinity) > 0).length,
        sub: 'Teams above zero in clutch',
        icon: TrendingUp,
        tint: 'success',
      },
      {
        label: 'Best Clutch Team',
        value: topByClutch?.clutchNetRtg?.toFixed(1) ?? '—',
        sub: topByClutch?.abbreviation ?? '—',
        icon: Trophy,
        tint: 'brand',
        delta: topByClutch?.clutchNetRtg != null ? topByClutch.clutchNetRtg - avgClutch : null,
      },
      {
        label: 'Clutch Data',
        value: validClutch.length,
        sub: 'Teams with clutch games',
        icon: BarChart3,
        tint: 'info',
      },
    ],
  }

  const focusCards = focusCardsByMetric[mapMetric]
  const trendContext = selectedPlayer ? 'player' : selectedTeamId != null ? 'team' : 'league'
  const trendEntityId = selectedPlayer ? selectedPlayer.id : selectedTeamId
  const trendLabel = selectedPlayer
    ? selectedPlayer.name
    : selectedTeam
      ? selectedTeam.fullName
      : 'Overview'

  const breadcrumb = selectedPlayer
    ? `${selectedTeam?.abbreviation ?? 'Team'} / ${selectedPlayer.name}`
    : selectedTeam
      ? selectedTeam.fullName
      : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h2>
          <p className="text-sm text-muted-foreground">Team performance, trends & drill-down</p>
        </div>
        <div className="sticky top-14 z-30 -mx-1 self-start rounded-lg bg-background/90 px-1 py-1 backdrop-blur-sm lg:top-16">
          <SegmentedControl
            options={METRIC_TABS}
            value={mapMetric}
            onChange={setMapMetric}
            aria-label="Map metric"
          />
        </div>
      </div>

      {panelsReady ? <FavoritesStrip /> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {focusCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            suffix={card.suffix}
            sub={card.sub}
            icon={card.icon}
            tint={card.tint}
            delta={card.delta}
            onClick={() => setMapMetric(mapMetric)}
          />
        ))}
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-6',
          hasSelection && 'lg:grid-cols-12 lg:items-start',
        )}
      >
        <section
          aria-label="Team map"
          className={cn('relative min-w-0', hasSelection ? 'lg:col-span-8' : 'col-span-1')}
        >
          {mapStillLoading ? (
            <Skeleton className="absolute inset-0 z-10 min-h-[640px] rounded-xl" />
          ) : null}
          {mapError ? (
            <div className="mb-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Team map failed to load.{' '}
              <button type="button" className="font-medium underline" onClick={() => void refetchMap()}>
                Retry
              </button>
            </div>
          ) : null}
          <TeamMap
            teams={teams}
            metric={mapMetric}
            selectedTeamId={selectedTeamId}
            onSelectTeam={handleSelectTeam}
            matchupGames={isToday ? liveGames : []}
          />
        </section>

        {hasSelection ? (
          <aside
            className={cn(
              'min-w-0 space-y-4 lg:col-span-4 lg:sticky lg:top-20',
              'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-300',
            )}
          >
            <TeamDetailSidebar
              season={season}
              teams={teams}
              metric={mapMetric}
              selectedTeamId={selectedTeamId}
              selectedPlayerId={selectedPlayer?.id ?? null}
              onSelectTeam={handleSelectTeam}
              onSelectPlayer={handleSelectPlayer}
              onClose={handleClose}
            />
            {selectedTeamId != null ? (
              <TeamTrendPanel
                key={`${selectedTeamId}-${mapMetric}`}
                teamId={selectedTeamId}
                season={season}
                focusMetric={mapMetric}
              />
            ) : null}
            {selectedTeamId != null ? <RecentGamesCard season={season} teamId={selectedTeamId} /> : null}
          </aside>
        ) : null}
      </div>

      {hasSelection ? (
        <section aria-label="Performance trends" className="min-w-0 space-y-4">
          {breadcrumb ? <p className="text-sm font-medium text-foreground">{breadcrumb}</p> : null}
          <DashboardTrends
            key={`${trendContext}-${trendEntityId ?? 'league'}-${mapMetric}`}
            context={trendContext}
            entityId={trendEntityId}
            label={trendLabel}
            focusMetric={mapMetric}
            teams={teams}
            leagueTrend={overview.leagueScoringTrend}
          />
        </section>
      ) : (
        <div className={cn('space-y-6 transition-opacity duration-200', !panelsReady && 'opacity-90')}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            <section className="flex min-w-0 flex-col gap-4 lg:col-span-7 xl:col-span-8">
              <TodaysGamesPanel
                className="min-h-[280px] lg:min-h-[360px]"
                games={liveGames}
                liveCount={liveCount}
                isLoading={scoreboardLoading}
                recentlyUpdated={recentlyUpdated}
              />
              <OverviewLiveSection enabled={panelsReady} liveGames={liveGames} />
            </section>
            <aside className="min-w-0 lg:col-span-5 xl:col-span-4">
              <OverviewLeagueAside enabled={panelsReady} />
            </aside>
          </div>

          <section aria-label="Performance trends">
            <DashboardTrends
              key={`${trendContext}-${trendEntityId ?? 'league'}-${mapMetric}`}
              context={trendContext}
              entityId={trendEntityId}
              label={trendLabel}
              focusMetric={mapMetric}
              teams={teams}
              leagueTrend={overview.leagueScoringTrend}
            />
          </section>

          <section aria-label="Stats panels">
            <OverviewLeagueStatsGrid enabled={panelsReady} selectedTeamId={selectedTeamId} />
          </section>
        </div>
      )}
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Activity, BarChart3, Flame, Target, TrendingUp, Trophy, Users } from 'lucide-react'
import { DashboardTrends } from '../components/DashboardTrends'
import { KpiCard } from '../components/KpiCard'
import { RecentGamesCard } from '../components/RecentGamesCard'
import { TeamDetailSidebar } from '../components/TeamDetailSidebar'
import { TeamMap, type MapMetric } from '../components/TeamMap'
import { api, type Overview, type TeamMapPoint } from '../lib/api'
import { cn } from '../lib/utils'
import { useSeason } from '../lib/season'

const METRIC_TABS: { key: MapMetric; label: string }[] = [
  { key: 'winPct', label: 'Win %' },
  { key: 'netRtg', label: 'Net Rating' },
  { key: 'clutchNetRtg', label: 'Clutch' },
]

export function OverviewPage() {
  const { season } = useSeason()
  const [mapMetric, setMapMetric] = useState<MapMetric>('winPct')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: number; name: string } | null>(null)

  const { data: overview, isLoading } = useQuery({
    queryKey: ['overview', season],
    queryFn: () => api<Overview>(`/api/analytics/overview?season=${season}`),
  })

  const { data: teamMap, isLoading: isMapLoading } = useQuery({
    queryKey: ['teamMap', season],
    queryFn: () => api<TeamMapPoint[]>(`/api/teams/map?season=${season}`),
  })

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

  if (isLoading || isMapLoading || !overview) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
          <p className="text-sm text-muted-foreground">Loading league dashboard…</p>
        </div>
      </div>
    )
  }

  const teams = teamMap ?? []
  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId)
  const validWinPct = teams.map((team) => team.winPct).filter((value): value is number => value != null)
  const validNetRtg = teams.map((team) => team.netRtg).filter((value): value is number => value != null)

  const avgWinPct = validWinPct.length > 0
    ? validWinPct.reduce((sum, value) => sum + value, 0) / validWinPct.length
    : 0
  const avgNetRtg = validNetRtg.length > 0
    ? validNetRtg.reduce((sum, value) => sum + value, 0) / validNetRtg.length
    : 0

  const validClutch = teams.map((team) => team.clutchNetRtg).filter((value): value is number => value != null)
  const avgClutch = validClutch.length > 0
    ? validClutch.reduce((sum, value) => sum + value, 0) / validClutch.length
    : 0

  const topByWinPct = [...teams].sort((a, b) => (b.winPct ?? Number.NEGATIVE_INFINITY) - (a.winPct ?? Number.NEGATIVE_INFINITY))[0]
  const topByNetRtg = [...teams].sort((a, b) => (b.netRtg ?? Number.NEGATIVE_INFINITY) - (a.netRtg ?? Number.NEGATIVE_INFINITY))[0]
  const lowestByNetRtg = [...teams].sort((a, b) => (a.netRtg ?? Number.POSITIVE_INFINITY) - (b.netRtg ?? Number.POSITIVE_INFINITY))[0]
  const topByClutch = [...teams].sort((a, b) => (b.clutchNetRtg ?? Number.NEGATIVE_INFINITY) - (a.clutchNetRtg ?? Number.NEGATIVE_INFINITY))[0]

  type FocusCard = {
    label: string
    value: string | number
    suffix?: string
    sub: string
    icon: LucideIcon
    iconBg: string
    iconColor: string
  }

  const focusCardsByMetric: Record<MapMetric, FocusCard[]> = {
    winPct: [
      {
        label: 'League Win %',
        value: (avgWinPct * 100).toFixed(1),
        suffix: '%',
        sub: 'Average team winning rate',
        icon: Trophy,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        label: 'Above .500',
        value: teams.filter((team) => (team.winPct ?? 0) >= 0.5).length,
        sub: 'Teams at or above 50%',
        icon: TrendingUp,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        label: 'Elite Teams',
        value: teams.filter((team) => (team.winPct ?? 0) >= 0.6).length,
        sub: 'Teams at or above 60%',
        icon: Activity,
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
      },
      {
        label: 'Best Record',
        value: topByWinPct ? `${topByWinPct.wins ?? 0}-${topByWinPct.losses ?? 0}` : '—',
        sub: topByWinPct?.abbreviation ?? 'No team data',
        icon: Target,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
    ],
    netRtg: [
      {
        label: 'League Net Rating',
        value: avgNetRtg.toFixed(1),
        sub: 'Average team net rating',
        icon: BarChart3,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        label: 'Positive Net',
        value: teams.filter((team) => (team.netRtg ?? Number.NEGATIVE_INFINITY) > 0).length,
        sub: 'Teams above zero net rating',
        icon: TrendingUp,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        label: 'Top Net Team',
        value: topByNetRtg?.netRtg?.toFixed(1) ?? '—',
        sub: topByNetRtg?.abbreviation ?? 'No team data',
        icon: Trophy,
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
      },
      {
        label: 'Lowest Net Team',
        value: lowestByNetRtg?.netRtg?.toFixed(1) ?? '—',
        sub: lowestByNetRtg?.abbreviation ?? 'No team data',
        icon: Users,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
    ],
    clutchNetRtg: [
      {
        label: 'League Clutch Net',
        value: avgClutch.toFixed(1),
        sub: 'Avg net rating in clutch time',
        icon: Flame,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
      {
        label: 'Clutch Positive',
        value: teams.filter((team) => (team.clutchNetRtg ?? Number.NEGATIVE_INFINITY) > 0).length,
        sub: 'Teams above zero in clutch',
        icon: TrendingUp,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        label: 'Best Clutch Team',
        value: topByClutch?.clutchNetRtg?.toFixed(1) ?? '—',
        sub: topByClutch?.abbreviation ?? 'No clutch data',
        icon: Trophy,
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
      },
      {
        label: 'Clutch Data',
        value: validClutch.length,
        sub: 'Teams with clutch games',
        icon: BarChart3,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
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
      : 'League'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-orange-600">
            Season {overview.season}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">League Dashboard</h2>
          <p className="text-sm text-gray-500">Team performance, trends & drill-down</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
          {METRIC_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMapMetric(key)}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                mapMetric === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {focusCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            suffix={card.suffix}
            sub={card.sub}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TeamMap
            teams={teams}
            metric={mapMetric}
            selectedTeamId={selectedTeamId}
            onSelectTeam={handleSelectTeam}
          />
          <DashboardTrends
            key={`${trendContext}-${trendEntityId ?? 'league'}-${mapMetric}`}
            context={trendContext}
            entityId={trendEntityId}
            label={trendLabel}
            focusMetric={mapMetric}
            teams={teams}
            leagueTrend={overview.leagueScoringTrend}
          />
        </div>

        <div className="space-y-6">
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
          <RecentGamesCard season={season} />
        </div>
      </div>
    </div>
  )
}

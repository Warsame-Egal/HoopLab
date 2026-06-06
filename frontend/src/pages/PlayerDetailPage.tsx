import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { GitCompare } from 'lucide-react'
import { FavoriteButton } from '../components/FavoriteButton'
import { PlayerHeadshot } from '../components/PlayerHeadshot'
import { PlayerPpgTrendChart } from '../components/PlayerPpgTrendChart'
import { QueryErrorState } from '../components/QueryErrorState'
import { RecordsTable } from '../components/RecordsTable'
import { SplitsTables } from '../components/SplitsTables'
import { ShotChart } from '../components/ShotChart'
import { TeamLogo } from '../components/TeamLogo'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { EmptyState } from '../components/ui/EmptyState'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Skeleton } from '../components/ui/Skeleton'
import { StatTable, type StatColumn } from '../components/ui/StatTable'
import { StatTile } from '../components/ui/StatTile'
import {
  api,
  type CareerSeason,
  type GameLog,
  type PlayerProfile,
  type PlayerSeasonStats,
  type PlayerSummary,
  type Shot,
} from '../lib/api'
import { type LeagueRecordsResponse } from '../lib/league'
import { useSeason } from '../lib/useSeason'

type Tab = 'overview' | 'shooting' | 'splits' | 'gamelog' | 'career' | 'awards' | 'next'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'splits', label: 'Splits' },
  { key: 'gamelog', label: 'Game log' },
  { key: 'career', label: 'Career' },
  { key: 'awards', label: 'Awards' },
  { key: 'next', label: 'Next games' },
]

function draftLabel(profile: PlayerProfile): string | null {
  if (!profile.draftYear) return null
  if (profile.draftRound && profile.draftNumber) {
    return `Drafted ${profile.draftYear} · Round ${profile.draftRound}, Pick ${profile.draftNumber}`
  }
  return `Drafted ${profile.draftYear}`
}

const GAMELOG_COLUMNS: StatColumn<GameLog>[] = [
  { key: 'gameDate', header: 'Date', align: 'left' },
  {
    key: 'matchup',
    header: 'Matchup',
    render: (g) => (
      <Link to={`/games/${g.gameId}`} className="font-medium hover:text-brand">
        {g.matchup}
      </Link>
    ),
  },
  { key: 'pts', header: 'PTS', align: 'right', numeric: true },
  { key: 'reb', header: 'REB', align: 'right', numeric: true },
  { key: 'ast', header: 'AST', align: 'right', numeric: true },
]

const CAREER_COLUMNS: StatColumn<CareerSeason>[] = [
  { key: 'season', header: 'Season', align: 'left' },
  { key: 'teamAbbreviation', header: 'Team', align: 'left' },
  {
    key: 'pts',
    header: 'PTS',
    align: 'right',
    numeric: true,
    render: (r) => (r.pts != null ? r.pts.toFixed(1) : '—'),
  },
  {
    key: 'reb',
    header: 'REB',
    align: 'right',
    numeric: true,
    render: (r) => (r.reb != null ? r.reb.toFixed(1) : '—'),
  },
  {
    key: 'ast',
    header: 'AST',
    align: 'right',
    numeric: true,
    render: (r) => (r.ast != null ? r.ast.toFixed(1) : '—'),
  },
]

export function PlayerDetailPage() {
  const { id } = useParams()
  const playerId = Number(id)
  const { season } = useSeason()
  const [tab, setTab] = useState<Tab>('overview')

  const playerQuery = useQuery({
    queryKey: ['player', playerId],
    queryFn: () => api<PlayerSummary>(`/api/players/${playerId}`),
    enabled: Number.isFinite(playerId),
    retry: 2,
  })

  const profileQuery = useQuery({
    queryKey: ['player-profile', playerId],
    queryFn: () => api<PlayerProfile>(`/api/players/${playerId}/profile`),
    enabled: Number.isFinite(playerId),
    retry: 2,
  })

  const seasonsQuery = useQuery({
    queryKey: ['player-seasons', playerId],
    queryFn: () => api<PlayerSeasonStats[]>(`/api/players/${playerId}/seasons`),
    enabled: Number.isFinite(playerId),
  })

  const seasonRow = seasonsQuery.data?.find((s) => s.season === season) ?? seasonsQuery.data?.[0]

  const shotsQuery = useQuery({
    queryKey: ['player-shots', playerId, season],
    queryFn: () => api<Shot[]>(`/api/players/${playerId}/shotchart?season=${season}`),
    enabled: Number.isFinite(playerId) && (tab === 'shooting' || tab === 'overview'),
    retry: 2,
  })

  const gamelogQuery = useQuery({
    queryKey: ['player-gamelog', playerId, season],
    queryFn: () => api<GameLog[]>(`/api/players/${playerId}/gamelog?season=${season}`),
    enabled: Number.isFinite(playerId) && (tab === 'gamelog' || tab === 'overview'),
    retry: 2,
  })

  const careerQuery = useQuery({
    queryKey: ['player-career', playerId],
    queryFn: () => api<CareerSeason[]>(`/api/players/${playerId}/career`),
    enabled: Number.isFinite(playerId) && tab === 'career',
  })

  const awardsQuery = useQuery({
    queryKey: ['player-awards', playerId],
    queryFn: () => api<LeagueRecordsResponse>(`/api/players/${playerId}/awards`),
    enabled: Number.isFinite(playerId) && tab === 'awards',
    retry: 2,
  })

  const nextQuery = useQuery({
    queryKey: ['player-next', playerId],
    queryFn: () => api<LeagueRecordsResponse>(`/api/players/${playerId}/next-games`),
    enabled: Number.isFinite(playerId) && tab === 'next',
    retry: 2,
  })

  const splitsQuery = useQuery({
    queryKey: ['player-splits', playerId, season, tab],
    queryFn: () =>
      api<{ result_sets: { records: Record<string, unknown>[] }[] }>(
        `/api/players/${playerId}/splits?type=${tab === 'shooting' ? 'shooting' : 'general'}&season=${season}`,
      ),
    enabled: Number.isFinite(playerId) && tab === 'splits',
    retry: 2,
  })

  const estimatedQuery = useQuery({
    queryKey: ['player-estimated', playerId, season],
    queryFn: () => api<LeagueRecordsResponse>(`/api/players/${playerId}/estimated-metrics?season=${season}`),
    enabled: Number.isFinite(playerId) && tab === 'overview',
    retry: 2,
  })

  if (playerQuery.isLoading) {
    return <Skeleton className="h-48 w-full" />
  }
  if (playerQuery.isError) {
    return <QueryErrorState onRetry={() => playerQuery.refetch()} />
  }
  const player = playerQuery.data
  if (!player) {
    return <p className="text-live">Player not found</p>
  }

  const profile = profileQuery.data
  const draft = profile ? draftLabel(profile) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-6">
          <PlayerHeadshot playerId={player.id} name={player.fullName} className="h-24 w-24" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{player.fullName}</h2>
            <p className="flex flex-wrap items-center gap-1 text-muted-foreground">
              {profile?.jersey ? `#${profile.jersey} · ` : ''}
              {player.position || profile?.position || '—'} ·{' '}
              {player.teamId ? (
                <Link to={`/teams/${player.teamId}`} className="inline-flex items-center gap-1.5 text-brand hover:underline">
                  <TeamLogo abbreviation={player.teamAbbreviation ?? profile?.teamAbbreviation ?? ''} teamId={player.teamId} className="h-5 w-5" />
                  {player.teamAbbreviation ?? profile?.teamAbbreviation}
                </Link>
              ) : (
                'Free Agent'
              )}
            </p>
            {draft ? <p className="mt-1 text-xs text-muted-foreground">{draft}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton kind="player" id={player.id} />
          <Link
            to={`/compare?mode=players&a=${player.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <GitCompare size={16} />
            Compare
          </Link>
        </div>
      </div>

      {seasonRow ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="PTS" value={seasonRow.pts?.toFixed(1) ?? '—'} />
          <StatTile label="REB" value={seasonRow.reb?.toFixed(1) ?? '—'} />
          <StatTile label="AST" value={seasonRow.ast?.toFixed(1) ?? '—'} />
          <StatTile label="TS%" value={seasonRow.tsPct != null ? `${(seasonRow.tsPct * 100).toFixed(1)}%` : '—'} />
        </div>
      ) : null}

      <SegmentedControl options={TABS} value={tab} onChange={(k) => setTab(k as Tab)} aria-label="Player sections" />

      {tab === 'overview' && (
        <div className="space-y-6">
          <PlayerPpgTrendChart games={gamelogQuery.data ?? []} loading={gamelogQuery.isLoading} />
          {estimatedQuery.isLoading ? (
            <Skeleton className="h-32" />
          ) : estimatedQuery.data?.records?.length ? (
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-foreground">Estimated metrics</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <RecordsTable
                  records={estimatedQuery.data.records}
                  maxRows={5}
                  hiddenColumns={['PLAYER_NAME', 'PLAYER_ID']}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {tab === 'shooting' && (
        <ShotChart shots={shotsQuery.data ?? []} loading={shotsQuery.isLoading} />
      )}

      {tab === 'splits' && (
        <Card>
          <CardContent className="pt-4">
            {splitsQuery.isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <SplitsTables resultSets={splitsQuery.data?.result_sets ?? []} />
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'gamelog' && (
        <Card>
          <CardContent className="pt-4">
            <StatTable
              columns={GAMELOG_COLUMNS}
              rows={gamelogQuery.data ?? []}
              getRowKey={(g) => g.gameId}
              loading={gamelogQuery.isLoading}
              emptyTitle="No game log"
              emptyDescription={`No games for ${season}.`}
            />
          </CardContent>
        </Card>
      )}

      {tab === 'career' && (
        <Card>
          <CardContent className="pt-4">
            <StatTable
              columns={CAREER_COLUMNS}
              rows={careerQuery.data ?? []}
              getRowKey={(r, i) => `${r.season}-${i}`}
              loading={careerQuery.isLoading}
              emptyTitle="No career data"
              emptyDescription="Career stats unavailable."
            />
          </CardContent>
        </Card>
      )}

      {tab === 'awards' && (
        <Card>
          <CardContent className="pt-4">
            {awardsQuery.isLoading ? (
              <Skeleton className="h-32" />
            ) : awardsQuery.data?.records?.length ? (
              <RecordsTable records={awardsQuery.data.records} />
            ) : (
              <EmptyState title="No awards" description="No awards on file." />
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'next' && (
        <Card>
          <CardContent className="pt-4">
            {nextQuery.isLoading ? (
              <Skeleton className="h-32" />
            ) : nextQuery.data?.records?.length ? (
              <RecordsTable records={nextQuery.data.records} />
            ) : (
              <EmptyState title="No upcoming games" description="No upcoming games listed." />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

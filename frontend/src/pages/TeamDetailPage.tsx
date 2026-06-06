import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { GitCompare } from 'lucide-react'
import { FavoriteButton } from '../components/FavoriteButton'
import { QueryErrorState } from '../components/QueryErrorState'
import { RecordsTable } from '../components/RecordsTable'
import { SplitsTables } from '../components/SplitsTables'
import { TeamGameLogChart } from '../components/TeamGameLogChart'
import { TeamLineupsCard } from '../components/TeamLineupsCard'
import { TeamLogo } from '../components/TeamLogo'
import { TeamRosterCard } from '../components/TeamRosterCard'
import { TeamTrendPanel } from '../components/TeamTrendPanel'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Skeleton } from '../components/ui/Skeleton'
import { StatTile } from '../components/ui/StatTile'
import { api, type TeamSeasonStats, type TeamSummary } from '../lib/api'
import { type LeagueRecordsResponse } from '../lib/league'
import { useSeason } from '../lib/useSeason'

type Tab = 'overview' | 'roster' | 'lineups' | 'splits' | 'onoff' | 'gamelog' | 'franchise'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'roster', label: 'Roster' },
  { key: 'lineups', label: 'Lineups' },
  { key: 'splits', label: 'Splits' },
  { key: 'onoff', label: 'On/Off' },
  { key: 'gamelog', label: 'Game log' },
  { key: 'franchise', label: 'Franchise' },
]

export function TeamDetailPage() {
  const { id } = useParams()
  const teamId = Number(id)
  const { season } = useSeason()
  const [tab, setTab] = useState<Tab>('overview')

  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => api<TeamSummary>(`/api/teams/${teamId}`),
    enabled: Number.isFinite(teamId),
    retry: 2,
  })

  const seasonsQuery = useQuery({
    queryKey: ['team-seasons', teamId],
    queryFn: () => api<TeamSeasonStats[]>(`/api/teams/${teamId}/seasons`),
    enabled: Number.isFinite(teamId),
  })

  const seasonRow = seasonsQuery.data?.find((s) => s.season === season) ?? seasonsQuery.data?.[0]

  const onOffQuery = useQuery({
    queryKey: ['team-onoff', teamId, season],
    queryFn: () => api<LeagueRecordsResponse>(`/api/teams/${teamId}/on-off?season=${season}`),
    enabled: Number.isFinite(teamId) && tab === 'onoff',
    retry: 2,
  })

  const splitsQuery = useQuery({
    queryKey: ['team-splits', teamId, season],
    queryFn: () =>
      api<{ result_sets: { records: Record<string, unknown>[] }[] }>(
        `/api/teams/${teamId}/splits?type=general&season=${season}`,
      ),
    enabled: Number.isFinite(teamId) && tab === 'splits',
    retry: 2,
  })

  const franchiseQuery = useQuery({
    queryKey: ['team-franchise', teamId],
    queryFn: () =>
      api<{ result_sets: { records: Record<string, unknown>[] }[] }>(
        `/api/teams/${teamId}/franchise-leaders`,
      ),
    enabled: Number.isFinite(teamId) && tab === 'franchise',
    retry: 2,
  })

  const ybyQuery = useQuery({
    queryKey: ['team-yby', teamId],
    queryFn: () => api<LeagueRecordsResponse>(`/api/teams/${teamId}/year-by-year`),
    enabled: Number.isFinite(teamId) && tab === 'franchise',
    retry: 2,
  })

  if (teamQuery.isLoading) return <Skeleton className="h-48 w-full" />
  if (teamQuery.isError) return <QueryErrorState onRetry={() => teamQuery.refetch()} />

  const team = teamQuery.data
  if (!team) return <p className="text-live">Team not found</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <TeamLogo abbreviation={team.abbreviation} className="h-16 w-16 shrink-0" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{team.fullName}</h2>
            <p className="text-muted-foreground">
              {team.conference ?? '—'} · {team.division ?? '—'} · Est. {team.yearFounded ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton kind="team" id={team.id} />
          <Link
            to={`/compare?mode=teams&a=${team.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <GitCompare size={16} />
            Compare
          </Link>
        </div>
      </div>

      {seasonRow ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Record" value={`${seasonRow.wins}-${seasonRow.losses}`} sub={season} />
          <StatTile label="Net Rtg" value={seasonRow.netRtg?.toFixed(1) ?? '—'} />
          <StatTile label="Pace" value={seasonRow.pace?.toFixed(1) ?? '—'} />
          <StatTile label="PTS" value={seasonRow.pts?.toFixed(1) ?? '—'} />
        </div>
      ) : null}

      <SegmentedControl options={TABS} value={tab} onChange={(k) => setTab(k as Tab)} aria-label="Team sections" />

      {tab === 'overview' && Number.isFinite(teamId) ? (
        <TeamTrendPanel teamId={teamId} season={season} />
      ) : null}

      {tab === 'roster' && Number.isFinite(teamId) ? (
        <TeamRosterCard teamId={teamId} season={season} abbreviation={team.abbreviation} />
      ) : null}

      {tab === 'lineups' && Number.isFinite(teamId) ? (
        <TeamLineupsCard teamId={teamId} season={season} />
      ) : null}

      {tab === 'gamelog' && Number.isFinite(teamId) ? (
        <TeamGameLogChart teamId={teamId} season={season} />
      ) : null}

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

      {tab === 'onoff' && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-foreground">On/Off impact</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {onOffQuery.isLoading ? (
              <Skeleton className="h-48" />
            ) : onOffQuery.data?.records?.length ? (
              <RecordsTable
                records={onOffQuery.data.records}
                linkColumn={{
                  key: 'PLAYER_ID',
                  href: (row) => (row.PLAYER_ID != null ? `/players/${row.PLAYER_ID}` : null),
                }}
              />
            ) : (
              <p className="text-muted-foreground">On/off data unavailable.</p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'franchise' && (
        <div className="space-y-6">
          {ybyQuery.data?.records?.length ? (
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-foreground">Year by year</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <RecordsTable records={ybyQuery.data.records} maxRows={30} />
              </CardContent>
            </Card>
          ) : null}
          {franchiseQuery.data?.result_sets?.map((rs, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <RecordsTable records={rs.records} maxRows={15} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

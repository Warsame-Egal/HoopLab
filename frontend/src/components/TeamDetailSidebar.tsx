import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS, axisProps, gridProps } from '../lib/chartTheme'
import { chartTooltip } from '../lib/chartTooltipContent'
import { BarChart3, X } from 'lucide-react'
import { PlayerHeadshot } from './PlayerHeadshot'
import { TeamLogo } from './TeamLogo'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { StatTable, type StatColumn } from './ui/StatTable'
import type { MapMetric } from './TeamMap'
import { api, type RosterEntry, type TeamMapPoint } from '../lib/api'
import { teamWinPct } from '../lib/teamWinPct'
import { cn } from '../lib/utils'

function metricValue(metric: MapMetric, team: TeamMapPoint): number {
  if (metric === 'winPct') return teamWinPct(team) ?? Number.NEGATIVE_INFINITY
  if (metric === 'clutchNetRtg') return (team.clutchNetRtg ?? Number.NEGATIVE_INFINITY)
  return (team.netRtg ?? Number.NEGATIVE_INFINITY)
}

const METRIC_SIDEBAR_TITLES: Record<MapMetric, string> = {
  winPct: 'Top Teams · Win %',
  netRtg: 'Top Teams · Net Rating',
  clutchNetRtg: 'Top Teams · Clutch Net',
}

type TeamDetailSidebarProps = {
  season: string
  teams: TeamMapPoint[]
  metric: MapMetric
  selectedTeamId: number | null
  selectedPlayerId: number | null
  onSelectTeam: (teamId: number) => void
  onSelectPlayer: (playerId: number, playerName: string) => void
  onClose: () => void
}

const ROSTER_COLUMNS: StatColumn<RosterEntry>[] = [
  {
    key: 'fullName',
    header: 'Player',
    render: (p) => (
      <div className="flex items-center gap-2">
        <PlayerHeadshot playerId={p.playerId} name={p.fullName} className="h-7 w-7" />
        <Link to={`/players/${p.playerId}`} className="font-medium text-foreground hover:text-brand">
          {p.fullName}
        </Link>
        {p.position ? <span className="text-muted-foreground">{p.position}</span> : null}
      </div>
    ),
  },
  {
    key: 'pts',
    header: 'PPG',
    align: 'right',
    numeric: true,
    render: (p) => (p.pts != null ? p.pts.toFixed(1) : '—'),
  },
  {
    key: 'reb',
    header: 'RPG',
    align: 'right',
    numeric: true,
    render: (p) => (p.reb != null ? p.reb.toFixed(1) : '—'),
  },
  {
    key: 'ast',
    header: 'APG',
    align: 'right',
    numeric: true,
    render: (p) => (p.ast != null ? p.ast.toFixed(1) : '—'),
  },
]

export function TeamDetailSidebar({
  season,
  teams,
  metric,
  selectedTeamId,
  selectedPlayerId,
  onSelectTeam,
  onSelectPlayer,
  onClose,
}: TeamDetailSidebarProps) {
  const team = teams.find((t) => t.teamId === selectedTeamId)

  const { data: roster, isLoading } = useQuery({
    queryKey: ['roster', selectedTeamId, season],
    queryFn: () => api<RosterEntry[]>(`/api/teams/${selectedTeamId}/roster?season=${season}`),
    enabled: selectedTeamId != null,
  })

  if (selectedTeamId == null) {
    const chartData = [...teams]
      .sort((a, b) => metricValue(metric, b) - metricValue(metric, a))
      .slice(0, 10)
      .map((t) => ({
        name: t.abbreviation,
        teamId: t.teamId,
        value: metric === 'winPct' ? (teamWinPct(t) ?? 0) : metric === 'clutchNetRtg' ? (t.clutchNetRtg ?? 0) : (t.netRtg ?? 0),
      }))
    const isPct = metric === 'winPct'
    return (
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <BarChart3 className="h-5 w-5 text-info" />
            {METRIC_SIDEBAR_TITLES[metric]}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis
                  type="number"
                  domain={isPct ? [0, 100] : undefined}
                  tickFormatter={isPct ? (v) => `${v}%` : undefined}
                  {...axisProps}
                />
                <YAxis type="category" dataKey="name" width={42} {...axisProps} />
                <Tooltip content={chartTooltip(isPct)} cursor={{ fill: 'var(--muted)' }} />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  onClick={(_, index) => {
                    const entry = chartData[index]
                    if (entry) onSelectTeam(entry.teamId)
                  }}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={entry.teamId} fill={CHART_COLORS[i % CHART_COLORS.length]} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Select a team on the map for roster & trends.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
        <div className="flex items-center gap-3">
          {team ? <TeamLogo abbreviation={team.abbreviation} teamId={team.teamId} className="h-9 w-9" /> : null}
          <div>
            <p className="font-semibold text-foreground">{team?.fullName ?? `Team ${selectedTeamId}`}</p>
            {team ? (
              <p className="text-xs text-muted-foreground">
                {team.wins ?? 0}–{team.losses ?? 0}
                {teamWinPct(team) != null ? ` · ${teamWinPct(team)?.toFixed(1)}%` : ''}
                {team.netRtg != null ? ` · Net ${team.netRtg.toFixed(1)}` : ''}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close team detail"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <CardContent className="px-0 pt-2">
        <StatTable
          columns={ROSTER_COLUMNS.map((col) =>
            col.key === 'fullName'
              ? {
                  ...col,
                  render: (p: RosterEntry) => (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectPlayer(p.playerId, p.fullName)}
                      onKeyDown={(e) => e.key === 'Enter' && onSelectPlayer(p.playerId, p.fullName)}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5',
                        selectedPlayerId === p.playerId && 'bg-brand/10 ring-1 ring-brand/30',
                      )}
                    >
                      <PlayerHeadshot playerId={p.playerId} name={p.fullName} className="h-7 w-7" />
                      <div>
                        <Link
                          to={`/players/${p.playerId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {p.fullName}
                        </Link>
                        {p.position ? <span className="ml-1 text-muted-foreground">{p.position}</span> : null}
                      </div>
                    </div>
                  ),
                }
              : col,
          )}
          rows={roster ?? []}
          getRowKey={(p) => p.playerId}
          loading={isLoading}
          emptyTitle="No roster"
          emptyDescription={`No roster data for ${season}.`}
        />
      </CardContent>
    </Card>
  )
}

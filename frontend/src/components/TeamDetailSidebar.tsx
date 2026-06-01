import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, MapPin, X } from 'lucide-react'
import { PlayerHeadshot } from './PlayerHeadshot'
import { TeamLogo } from './TeamLogo'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { MapMetric } from './TeamMap'
import { api, type RosterEntry, type TeamMapPoint } from '../lib/api'
import { cn } from '../lib/utils'

function metricValue(metric: MapMetric, team: TeamMapPoint): number {
  if (metric === 'winPct') return (team.winPct ?? Number.NEGATIVE_INFINITY)
  if (metric === 'clutchNetRtg') return (team.clutchNetRtg ?? Number.NEGATIVE_INFINITY)
  return (team.netRtg ?? Number.NEGATIVE_INFINITY)
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
    const metricTitle = metric === 'winPct'
      ? 'Top Teams · Win %'
      : metric === 'clutchNetRtg'
        ? 'Top Teams · Clutch Net'
        : 'Top Teams · Net Rating'
    const chartData = [...teams]
      .sort((a, b) => metricValue(metric, b) - metricValue(metric, a))
      .slice(0, 10)
      .map((team) => ({
        name: team.abbreviation,
        teamId: team.teamId,
        value: metric === 'winPct'
          ? (team.winPct ?? 0) * 100
          : metric === 'clutchNetRtg'
            ? (team.clutchNetRtg ?? 0)
            : (team.netRtg ?? 0),
      }))
    return (
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <BarChart3 className="h-5 w-5 text-amber-600" />
            {metricTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400">No team data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={42} tick={{ fontSize: 11, fill: '#525252' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: 8 }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  onClick={(_, index) => {
                    const entry = chartData[index]
                    if (entry) onSelectTeam(entry.teamId)
                  }}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={entry.teamId} fill={i === 0 ? '#0ea5e9' : i < 3 ? '#38bdf8' : '#bae6fd'} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="mt-3 text-xs text-gray-400">
            {metric === 'winPct'
              ? 'Ranking by winning percentage.'
              : metric === 'clutchNetRtg'
                ? 'Ranking by clutch net rating.'
                : 'Ranking by net rating.'} Select a team on the map for its roster →
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between rounded-t-xl bg-[#1e3a5f] px-4 py-3 text-white">
        <div className="flex items-center gap-3 text-sm">
          {team && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95">
              <TeamLogo abbreviation={team.abbreviation} className="h-7 w-7" />
            </span>
          )}
          <span>
            <span className="font-bold">{team?.fullName?.toUpperCase() ?? `TEAM ${selectedTeamId}`}</span>
            {team && (
              <span className="ml-2 text-gray-300">
                {team.wins ?? 0}–{team.losses ?? 0} · Net {team.netRtg?.toFixed(1) ?? '—'}
              </span>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Card className="rounded-t-none border border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-2">
          <CardTitle className="flex items-center gap-3 text-sm text-gray-900">
            <MapPin className="h-4 w-4 text-violet-600" />
            {team?.fullName ?? `Team ${selectedTeamId}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pt-2">
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <p className="p-6 text-sm text-gray-500">Loading roster…</p>
            ) : !roster || roster.length === 0 ? (
              <p className="p-6 text-sm text-gray-400">No roster data for {season}.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Player</th>
                    <th className="px-2 py-2 text-right font-medium text-gray-600">PPG</th>
                    <th className="px-2 py-2 text-right font-medium text-gray-600">RPG</th>
                    <th className="px-2 py-2 text-right font-medium text-gray-600">APG</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((p) => (
                    <tr
                      key={p.playerId}
                      onClick={() => onSelectPlayer(p.playerId, p.fullName)}
                      className={cn(
                        'cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50',
                        selectedPlayerId === p.playerId && 'bg-blue-50 ring-2 ring-inset ring-blue-400',
                      )}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <PlayerHeadshot playerId={p.playerId} name={p.fullName} className="h-7 w-7" />
                          <div>
                            <Link
                              to={`/players/${p.playerId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-gray-900 hover:text-orange-600"
                            >
                              {p.fullName}
                            </Link>
                            <span className="ml-1 text-gray-400">{p.position}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right text-gray-700">{p.pts?.toFixed(1) ?? '—'}</td>
                      <td className="px-2 py-2 text-right text-gray-700">{p.reb?.toFixed(1) ?? '—'}</td>
                      <td className="px-2 py-2 text-right text-gray-700">{p.ast?.toFixed(1) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { TeamGameLogChart } from '../components/TeamGameLogChart'
import { TeamLineupsCard } from '../components/TeamLineupsCard'
import { TeamLogo } from '../components/TeamLogo'
import { TeamRosterCard } from '../components/TeamRosterCard'
import { TeamTrendPanel } from '../components/TeamTrendPanel'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { api, type TeamSeasonStats, type TeamSummary } from '../lib/api'
import { useSeason } from '../lib/season'

export function TeamDetailPage() {
  const { id } = useParams()
  const teamId = Number(id)
  const { season } = useSeason()

  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => api<TeamSummary>(`/api/teams/${teamId}`),
    enabled: Number.isFinite(teamId),
  })

  const seasonsQuery = useQuery({
    queryKey: ['team-seasons', teamId],
    queryFn: () => api<TeamSeasonStats[]>(`/api/teams/${teamId}/seasons`),
    enabled: Number.isFinite(teamId),
  })

  if (teamQuery.isLoading) {
    return <p className="text-gray-500">Loading team...</p>
  }

  const team = teamQuery.data
  if (!team) {
    return <p className="text-red-600">Team not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <TeamLogo abbreviation={team.abbreviation} className="h-16 w-16 shrink-0" />
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{team.fullName}</h2>
          <p className="text-gray-500">{team.city} · Est. {team.yearFounded ?? '—'}</p>
        </div>
      </div>
      {Number.isFinite(teamId) ? <TeamTrendPanel teamId={teamId} season={season} /> : null}
      {Number.isFinite(teamId) ? <TeamGameLogChart teamId={teamId} season={season} /> : null}
      {Number.isFinite(teamId) ? <TeamLineupsCard teamId={teamId} season={season} /> : null}
      {Number.isFinite(teamId) ? <TeamRosterCard teamId={teamId} season={season} abbreviation={team.abbreviation} /> : null}
      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-gray-900">Season History</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium">Season</th>
                <th className="px-3 py-2 font-medium">W-L</th>
                <th className="px-3 py-2 font-medium">Net Rtg</th>
                <th className="px-3 py-2 font-medium">Pace</th>
                <th className="px-3 py-2 font-medium">PTS</th>
              </tr>
            </thead>
            <tbody>
              {seasonsQuery.data?.map((row) => (
                <tr key={row.season} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-gray-900">{row.season}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {row.wins}-{row.losses}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{row.netRtg?.toFixed(1)}</td>
                  <td className="px-3 py-2 text-gray-700">{row.pace?.toFixed(1)}</td>
                  <td className="px-3 py-2 text-gray-700">{row.pts?.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

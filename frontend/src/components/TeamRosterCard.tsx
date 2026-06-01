import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TeamLogo } from './TeamLogo'
import { api, type OfficialRoster } from '../lib/api'

export function TeamRosterCard({
  teamId,
  season,
  abbreviation,
}: {
  teamId: number
  season: string
  abbreviation?: string | null
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['official-roster', teamId, season],
    queryFn: () => api<OfficialRoster>(`/api/teams/${teamId}/official-roster?season=${season}`),
  })

  const headCoach = data?.coaches.find((c) => c.coachType?.toLowerCase().includes('head'))

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            {abbreviation ? (
              <TeamLogo abbreviation={abbreviation} className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5 text-violet-600" />
            )}
            Roster &amp; Staff
            <span className="font-normal text-gray-400">· {season}</span>
          </CardTitle>
          {headCoach ? (
            <span className="text-sm text-gray-500">
              Head Coach: <span className="font-medium text-gray-900">{headCoach.name}</span>
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading roster…</p>
        ) : !data || data.players.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No roster available for {season}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Player</th>
                  <th className="px-2 py-2 font-medium">Pos</th>
                  <th className="px-2 py-2 font-medium">Ht</th>
                  <th className="px-2 py-2 font-medium">Wt</th>
                  <th className="px-2 py-2 font-medium">Age</th>
                  <th className="px-2 py-2 font-medium">Exp</th>
                  <th className="px-3 py-2 font-medium">School</th>
                </tr>
              </thead>
              <tbody>
                {data.players.map((p) => (
                  <tr key={p.playerId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{p.jersey ?? '—'}</td>
                    <td className="px-3 py-2">
                      <Link to={`/players/${p.playerId}`} className="font-medium text-gray-900 hover:text-orange-600">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-gray-700">{p.position ?? '—'}</td>
                    <td className="px-2 py-2 text-gray-700">{p.height ?? '—'}</td>
                    <td className="px-2 py-2 text-gray-700">{p.weight ?? '—'}</td>
                    <td className="px-2 py-2 text-gray-700">{p.age ?? '—'}</td>
                    <td className="px-2 py-2 text-gray-700">{p.exp ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{p.school ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

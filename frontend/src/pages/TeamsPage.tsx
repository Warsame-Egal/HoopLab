import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TeamLogo } from '../components/TeamLogo'
import { api, type TeamSummary } from '../lib/api'

export function TeamsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api<TeamSummary[]>('/api/teams'),
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Teams</h2>
      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow"
            >
              <TeamLogo abbreviation={team.abbreviation} className="h-14 w-14 shrink-0" />
              <div>
                <p className="text-2xl font-semibold text-gray-900">{team.abbreviation}</p>
                <p className="text-gray-600">{team.fullName}</p>
                <p className="mt-2 text-sm text-gray-400">Founded {team.yearFounded ?? '—'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

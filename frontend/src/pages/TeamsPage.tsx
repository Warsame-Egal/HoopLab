import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { QueryErrorState } from '../components/QueryErrorState'
import { TeamLogo } from '../components/TeamLogo'
import { Skeleton } from '../components/ui/Skeleton'
import { api, type TeamSummary } from '../lib/api'
import { useSeason } from '../lib/useSeason'

export function TeamsPage() {
  const { season } = useSeason()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teams', season],
    queryFn: () => api<TeamSummary[]>(`/api/teams?season=${season}`),
    retry: 2,
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">Teams</h2>
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-sm transition hover:border-brand/40 hover:shadow"
            >
              <TeamLogo abbreviation={team.abbreviation} className="h-14 w-14 shrink-0" />
              <div>
                <p className="text-2xl font-semibold text-foreground">{team.abbreviation}</p>
                <p className="text-muted-foreground">{team.fullName}</p>
                <p className="mt-2 text-sm text-muted-foreground">Founded {team.yearFounded ?? '—'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

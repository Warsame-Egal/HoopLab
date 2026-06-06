import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ListOrdered } from 'lucide-react'
import { TeamLogo } from './TeamLogo'
import { Card, CardContent, CardHeader } from './ui/card'
import { SectionHeader } from './ui/SectionHeader'
import { Skeleton } from './ui/Skeleton'
import { api, type StandingRow } from '../lib/api'
import { useSeason } from '../lib/useSeason'

function MiniTable({ title, rows }: { title: string; rows: StandingRow[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.teamId}>
            <Link
              to={`/teams/${row.teamId}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span className="w-4 text-xs text-muted-foreground">{row.confRank ?? '—'}</span>
              <TeamLogo abbreviation={row.abbreviation} teamId={row.teamId} className="h-5 w-5" />
              <span className="flex-1 font-medium text-foreground">{row.abbreviation}</span>
              <span className="text-xs text-muted-foreground">
                {row.wins}-{row.losses}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StandingsMini({ enabled = true }: { enabled?: boolean }) {
  const { season } = useSeason()
  const { data, isLoading } = useQuery({
    queryKey: ['standings', season],
    queryFn: () => api<StandingRow[]>(`/api/standings?season=${season}`),
    enabled,
    staleTime: 60_000 * 15,
    retry: 1,
  })

  const east = (data ?? []).filter((r) => r.conference === 'East').slice(0, 5)
  const west = (data ?? []).filter((r) => r.conference === 'West').slice(0, 5)

  return (
    <Card className="card-hover">
      <CardHeader className="border-b border-border pb-4">
        <SectionHeader
          icon={ListOrdered}
          sublabel="Standings"
          title="Conference top 5"
          action={
            <Link to="/standings" className="text-xs font-medium text-brand hover:underline">
              Full table
            </Link>
          }
        />
      </CardHeader>
      <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            <MiniTable title="East" rows={east} />
            <MiniTable title="West" rows={west} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

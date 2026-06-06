import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from './ui/card'
import { EmptyState } from './ui/EmptyState'
import { SectionHeader } from './ui/SectionHeader'
import { Skeleton } from './ui/Skeleton'
import { api } from '../lib/api'
import { useSeason } from '../lib/useSeason'

type PlayoffResponse = {
  season?: string
  data?: {
    resultSets?: { name: string; headers: string[]; rowSet: unknown[][] }[]
  }
}

export function PlayoffPictureMini({ enabled = true }: { enabled?: boolean }) {
  const { season } = useSeason()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['league', 'playoff', season],
    queryFn: () => api<PlayoffResponse>(`/api/league/playoff-picture?season=${season}`),
    enabled,
    staleTime: 60_000 * 15,
    retry: 1,
  })

  const east = data?.data?.resultSets?.find((r) => r.name === 'EastConfPlayoffPicture')?.rowSet ?? []
  const west = data?.data?.resultSets?.find((r) => r.name === 'WestConfPlayoffPicture')?.rowSet ?? []

  return (
    <Card className="card-hover">
      <CardHeader className="border-b border-border pb-4">
        <SectionHeader
          icon={Trophy}
          sublabel="Playoffs"
          title="Playoff picture"
          action={
            <Link to="/standings" className="text-xs font-medium text-brand hover:underline">
              Standings
            </Link>
          }
        />
      </CardHeader>
      <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : isError || (east.length === 0 && west.length === 0) ? (
          <EmptyState title="Unavailable" description="Playoff data not loaded." className="col-span-2 py-4" />
        ) : (
          <>
            <ConferenceSnippet label="East" rows={east.slice(0, 8)} />
            <ConferenceSnippet label="West" rows={west.slice(0, 8)} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ConferenceSnippet({ label, rows }: { label: string; rows: unknown[][] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <ul className="space-y-1 text-xs">
        {rows.map((row, i) => (
          <li key={i} className="flex justify-between text-foreground">
            <span className="truncate">{String(row[2] ?? row[1] ?? '—')}</span>
            <span className="tabular-nums text-muted-foreground">{String(row[5] ?? '')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

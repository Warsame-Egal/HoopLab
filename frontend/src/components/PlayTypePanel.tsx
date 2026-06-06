import { useQuery } from '@tanstack/react-query'
import { Zap } from 'lucide-react'
import { Card, CardContent, CardHeader } from './ui/card'
import { EmptyState } from './ui/EmptyState'
import { SectionHeader } from './ui/SectionHeader'
import { Skeleton } from './ui/Skeleton'
import { api } from '../lib/api'
import { type LeagueRecordsResponse, num, str } from '../lib/league'
import { useSeason } from '../lib/useSeason'

export function PlayTypePanel({ teamId }: { teamId: number | null }) {
  const { season } = useSeason()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['league', 'playtypes', season, teamId],
    queryFn: () => api<LeagueRecordsResponse>(`/api/league/playtypes?team_id=${teamId}&season=${season}`),
    enabled: teamId != null,
    staleTime: 60_000 * 30,
  })

  const rows = (data?.records ?? [])
    .filter((r) => num(r, 'PPP') != null || num(r, 'PTS_PER_PLAY') != null)
    .sort((a, b) => (num(b, 'PPP') ?? num(b, 'PTS_PER_PLAY') ?? 0) - (num(a, 'PPP') ?? num(a, 'PTS_PER_PLAY') ?? 0))
    .slice(0, 6)

  return (
    <Card className="card-hover">
      <CardHeader className="border-b border-border pb-4">
        <SectionHeader icon={Zap} sublabel="Synergy" title="Play types" />
      </CardHeader>
      <CardContent className="pt-4">
        {teamId == null ? (
          <p className="text-sm text-muted-foreground">Select a team on the map to see play-type efficiency.</p>
        ) : isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isError || rows.length === 0 ? (
          <EmptyState title="No play types" description="Data unavailable for this team." className="py-4" />
        ) : (
          <ul className="space-y-2">
            {rows.map((row, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
              >
                <span className="text-foreground">{str(row, 'PLAY_TYPE', 'PLAYTYPE')}</span>
                <span className="font-semibold tabular-nums text-brand">
                  {(num(row, 'PPP') ?? num(row, 'PTS_PER_PLAY') ?? 0).toFixed(2)} PPP
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

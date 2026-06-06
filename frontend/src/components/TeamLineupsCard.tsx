import { useQuery } from '@tanstack/react-query'
import { Users2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { api, type Lineup } from '../lib/api'
import { cn } from '../lib/utils'

export function TeamLineupsCard({ teamId, season }: { teamId: number; season: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['team-lineups', teamId, season],
    queryFn: () => api<Lineup[]>(`/api/teams/${teamId}/lineups?season=${season}`),
    enabled: Number.isFinite(teamId),
    retry: 1,
  })

  const lineups = data ?? []

  return (
    <Card className="">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <Users2 className="h-5 w-5 text-brand" />
          Top 5-Man Lineups
          <span className="font-normal text-muted-foreground">· {season}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading lineups…</p>
        ) : error ? (
          <p className="p-6 text-sm text-muted-foreground">Lineup data unavailable right now.</p>
        ) : lineups.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No lineup data for {season}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-border bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Lineup</th>
                  <th className="px-2 py-2 text-right font-medium">MIN</th>
                  <th className="px-2 py-2 text-right font-medium">Off</th>
                  <th className="px-2 py-2 text-right font-medium">Def</th>
                  <th className="px-2 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {lineups.map((lineup, idx) => (
                  <tr key={`${lineup.lineupName}-${idx}`} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-foreground">{lineup.lineupName ?? '—'}</td>
                    <td className="px-2 py-2 text-right text-muted-foreground">{lineup.min?.toFixed(1) ?? '—'}</td>
                    <td className="px-2 py-2 text-right text-muted-foreground">{lineup.offRtg?.toFixed(1) ?? '—'}</td>
                    <td className="px-2 py-2 text-right text-muted-foreground">{lineup.defRtg?.toFixed(1) ?? '—'}</td>
                    <td className={cn('px-2 py-2 text-right font-semibold tabular-nums', (lineup.netRtg ?? 0) >= 0 ? 'text-success' : 'text-live')}>
                      {lineup.netRtg == null ? '—' : lineup.netRtg.toFixed(1)}
                    </td>
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

import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TeamLogo } from '../components/TeamLogo'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { api, type StandingRow } from '../lib/api'
import { cn } from '../lib/utils'
import { useSeason } from '../lib/season'

function ConferenceTable({ title, rows }: { title: string; rows: StandingRow[] }) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Team</th>
                <th className="px-2 py-2 text-right font-medium">W</th>
                <th className="px-2 py-2 text-right font-medium">L</th>
                <th className="px-2 py-2 text-right font-medium">PCT</th>
                <th className="px-2 py-2 text-right font-medium">GB</th>
                <th className="px-2 py-2 text-center font-medium">L10</th>
                <th className="px-2 py-2 text-center font-medium">Strk</th>
                <th className="px-2 py-2 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.teamId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500">{row.confRank ?? '—'}</td>
                  <td className="px-3 py-2">
                    <Link to={`/teams/${row.teamId}`} className="flex items-center gap-2 font-medium text-gray-900 hover:text-orange-600">
                      <TeamLogo abbreviation={row.abbreviation} className="h-6 w-6" />
                      {row.abbreviation}
                      {row.clinch ? <span className="text-xs text-emerald-600">{row.clinch}</span> : null}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-right text-gray-700">{row.wins ?? '—'}</td>
                  <td className="px-2 py-2 text-right text-gray-700">{row.losses ?? '—'}</td>
                  <td className="px-2 py-2 text-right text-gray-700">
                    {row.winPct == null ? '—' : row.winPct.toFixed(3).replace(/^0/, '')}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-500">
                    {row.gamesBack == null || row.gamesBack === 0 ? '—' : row.gamesBack.toFixed(1)}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-600">{row.lastTen ?? '—'}</td>
                  <td className={cn('px-2 py-2 text-center font-medium', row.streak?.startsWith('W') ? 'text-emerald-600' : row.streak?.startsWith('L') ? 'text-red-600' : 'text-gray-500')}>
                    {row.streak ?? '—'}
                  </td>
                  <td className={cn('px-2 py-2 text-right tabular-nums', (row.netRtg ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {row.netRtg == null ? '—' : row.netRtg.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function StandingsPage() {
  const { season } = useSeason()

  const { data, isLoading } = useQuery({
    queryKey: ['standings', season],
    queryFn: () => api<StandingRow[]>(`/api/standings?season=${season}`),
  })

  const rows = data ?? []
  const east = rows.filter((r) => r.conference === 'East').sort((a, b) => (a.confRank ?? 99) - (b.confRank ?? 99))
  const west = rows.filter((r) => r.conference === 'West').sort((a, b) => (a.confRank ?? 99) - (b.confRank ?? 99))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-orange-600">Season {season}</p>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Standings</h2>
        <p className="text-sm text-gray-500">Conference rankings, streaks & net rating</p>
      </div>
      {isLoading ? (
        <p className="text-gray-500">Loading standings…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400">No standings ingested for {season} yet. Run an admin ingest to populate.</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <ConferenceTable title="Eastern Conference" rows={east} />
          <ConferenceTable title="Western Conference" rows={west} />
        </div>
      )}
    </div>
  )
}

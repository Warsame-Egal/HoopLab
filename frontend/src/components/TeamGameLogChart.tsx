import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { SegmentedControl } from './ui/SegmentedControl'
import { Skeleton } from './ui/Skeleton'
import { EmptyState } from './ui/EmptyState'
import { api, type TeamGameLog } from '../lib/api'
import { CHART_ACCENT, axisProps, gridProps } from '../lib/chartTheme'
import { chartTooltip } from '../lib/chartTooltipContent'
import { cn } from '../lib/utils'

type Metric = { key: 'pts' | 'plusMinus'; label: string }

const METRICS: Metric[] = [
  { key: 'pts', label: 'Points' },
  { key: 'plusMinus', label: 'Plus/Minus' },
]

function shortDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TeamGameLogChart({ teamId, season }: { teamId: number; season: string }) {
  const [metric, setMetric] = useState<Metric['key']>('pts')

  const { data, isLoading } = useQuery({
    queryKey: ['team-gamelog', teamId, season],
    queryFn: () => api<TeamGameLog[]>(`/api/teams/${teamId}/gamelog?season=${season}`),
  })

  const games = data ?? []
  const wins = games.filter((g) => g.wl === 'W').length
  const losses = games.filter((g) => g.wl === 'L').length

  const chartData = games.map((g) => ({
    label: shortDate(g.gameDate),
    matchup: g.matchup,
    wl: g.wl,
    value: metric === 'pts' ? g.pts : g.plusMinus,
  }))

  return (
    <Card className="">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <Activity className="h-5 w-5 text-info" />
            Recent Form
          </CardTitle>
          <SegmentedControl
            options={METRICS.map((m) => ({ key: m.key, label: m.label }))}
            value={metric}
            onChange={setMetric}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState className="h-64" title="No game log" description={`No game log for ${season} yet.`} />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{wins}–{losses}</span> over {games.length} games
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis {...axisProps} />
                <Tooltip content={chartTooltip()} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_ACCENT}
                  strokeWidth={2}
                  dot={{ r: 2, fill: CHART_ACCENT }}
                  name={metric === 'pts' ? 'Points' : 'Plus/Minus'}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Matchup</th>
                    <th className="px-2 py-2 text-center font-medium">W/L</th>
                    <th className="px-2 py-2 text-right font-medium">PTS</th>
                    <th className="px-2 py-2 text-right font-medium">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {[...games].reverse().map((g) => (
                    <tr key={g.gameId} className="border-b border-border/50 last:border-0 hover:bg-muted">
                      <td className="px-3 py-2 text-muted-foreground">{shortDate(g.gameDate)}</td>
                      <td className="px-3 py-2">
                        <Link to={`/games/${g.gameId}`} className="font-medium text-foreground hover:text-brand">
                          {g.matchup}
                        </Link>
                      </td>
                      <td className={cn('px-2 py-2 text-center font-semibold', g.wl === 'W' ? 'text-success' : 'text-live')}>
                        {g.wl ?? '—'}
                      </td>
                      <td className="px-2 py-2 text-right text-muted-foreground">{g.pts ?? '—'}</td>
                      <td className={cn('px-2 py-2 text-right', (g.plusMinus ?? 0) >= 0 ? 'text-success' : 'text-live')}>
                        {g.plusMinus == null ? '—' : g.plusMinus > 0 ? `+${g.plusMinus}` : g.plusMinus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

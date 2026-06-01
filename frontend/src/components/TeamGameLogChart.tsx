import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { api, type TeamGameLog } from '../lib/api'
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
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <Activity className="h-5 w-5 text-blue-600" />
            Recent Form
            <span className="font-normal text-gray-400">· {season}</span>
          </CardTitle>
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetric(m.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  metric === m.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500">Loading game log…</div>
        ) : chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-gray-400">
            No game log for {season} yet.
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{wins}–{losses}</span> over {games.length} games
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#737373' }} axisLine={{ stroke: '#d4d4d4' }} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#ea580c" strokeWidth={2} dot={{ r: 2 }} name={metric === 'pts' ? 'Points' : 'Plus/Minus'} />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-gray-100">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 text-gray-600">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Matchup</th>
                    <th className="px-2 py-2 text-center font-medium">W/L</th>
                    <th className="px-2 py-2 text-right font-medium">PTS</th>
                    <th className="px-2 py-2 text-right font-medium">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {[...games].reverse().map((g) => (
                    <tr key={g.gameId} className="border-b border-gray-50 last:border-0 hover:bg-blue-50">
                      <td className="px-3 py-2 text-gray-600">{shortDate(g.gameDate)}</td>
                      <td className="px-3 py-2">
                        <Link to={`/games/${g.gameId}`} className="font-medium text-gray-900 hover:text-orange-600">
                          {g.matchup}
                        </Link>
                      </td>
                      <td className={cn('px-2 py-2 text-center font-semibold', g.wl === 'W' ? 'text-emerald-600' : 'text-red-600')}>
                        {g.wl ?? '—'}
                      </td>
                      <td className="px-2 py-2 text-right text-gray-700">{g.pts ?? '—'}</td>
                      <td className={cn('px-2 py-2 text-right', (g.plusMinus ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
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

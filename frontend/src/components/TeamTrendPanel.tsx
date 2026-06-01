import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { api, type TeamGameLog, type TeamSeasonStats } from '../lib/api'
import { cn } from '../lib/utils'

type Tab = 'yearly' | 'rolling'

const WIN_COLOR = '#0ea5e9'
const LOSS_COLOR = '#ef4444'
const LINE_COLOR = '#ea580c'

function monthLabel(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function TeamTrendPanel({ teamId, season }: { teamId: number; season: string }) {
  const [tab, setTab] = useState<Tab>('yearly')

  const seasonsQuery = useQuery({
    queryKey: ['team-seasons', teamId],
    queryFn: () => api<TeamSeasonStats[]>(`/api/teams/${teamId}/seasons`),
    enabled: Number.isFinite(teamId),
  })

  const gamelogQuery = useQuery({
    queryKey: ['team-gamelog', teamId, season],
    queryFn: () => api<TeamGameLog[]>(`/api/teams/${teamId}/gamelog?season=${season}`),
    enabled: Number.isFinite(teamId) && tab === 'rolling',
  })

  const yearlyData = [...(seasonsQuery.data ?? [])]
    .reverse()
    .map((s) => {
      const wins = s.wins ?? 0
      const losses = s.losses ?? 0
      const total = wins + losses
      return {
        label: s.season,
        net: s.netRtg == null ? null : Number(s.netRtg.toFixed(1)),
        winPct: total ? Math.round((wins / total) * 100) : 0,
        lossPct: total ? Math.round((losses / total) * 100) : 0,
      }
    })

  const games = [...(gamelogQuery.data ?? [])].sort((a, b) => a.gameDate.localeCompare(b.gameDate))
  const rollingLine = games.map((game, idx) => {
    const window = games.slice(Math.max(0, idx - 9), idx + 1)
    const values = window.map((g) => g.plusMinus ?? 0)
    const avg = values.reduce((sum, v) => sum + v, 0) / (values.length || 1)
    return { label: monthLabel(game.gameDate), value: Number(avg.toFixed(1)) }
  })

  const monthlyMap = new Map<string, { wins: number; losses: number }>()
  for (const game of games) {
    const key = game.gameDate.slice(0, 7)
    const entry = monthlyMap.get(key) ?? { wins: 0, losses: 0 }
    if (game.wl === 'W') entry.wins += 1
    else if (game.wl === 'L') entry.losses += 1
    monthlyMap.set(key, entry)
  }
  const monthlyShare = [...monthlyMap.entries()].map(([key, value]) => {
    const total = value.wins + value.losses
    return {
      label: monthLabel(`${key}-01`),
      winPct: total ? Math.round((value.wins / total) * 100) : 0,
      lossPct: total ? Math.round((value.losses / total) * 100) : 0,
    }
  })

  const isRolling = tab === 'rolling'
  const lineData = isRolling ? rollingLine : yearlyData.map((d) => ({ label: d.label, value: d.net }))
  const shareData = isRolling ? monthlyShare : yearlyData
  const loading = isRolling ? gamelogQuery.isLoading : seasonsQuery.isLoading
  const hasData = lineData.length > 0

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Performance Trends
          </CardTitle>
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
            {(['yearly', 'rolling'] as Tab[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTab(option)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  tab === option ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {option === 'yearly' ? 'Yearly Trend' : 'Rolling (10-game)'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500">Loading trend…</div>
        ) : !hasData ? (
          <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-gray-400">
            No {isRolling ? 'game log' : 'multi-season'} data for this view yet.
          </div>
        ) : (
          <>
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">
                {isRolling ? 'Rolling 10-game plus/minus' : 'Net rating by season'}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#737373' }} axisLine={{ stroke: '#d4d4d4' }} tickLine={false} minTickGap={20} />
                  <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="value" stroke={LINE_COLOR} strokeWidth={2} dot={{ r: 2 }} name={isRolling ? 'Rolling +/-' : 'Net Rating'} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">Win / Loss share</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={shareData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#737373' }} axisLine={{ stroke: '#d4d4d4' }} tickLine={false} minTickGap={20} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value}%`]} contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: 8 }} />
                  <Bar dataKey="winPct" stackId="share" fill={WIN_COLOR} name="Win %" />
                  <Bar dataKey="lossPct" stackId="share" fill={LOSS_COLOR} radius={[4, 4, 0, 0]} name="Loss %" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center justify-center gap-5">
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: WIN_COLOR }} />
                  Win %
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: LOSS_COLOR }} />
                  Loss %
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

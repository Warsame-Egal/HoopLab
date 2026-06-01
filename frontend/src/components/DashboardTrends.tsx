import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { MapMetric } from './TeamMap'
import { api, type Overview, type TeamMapPoint, type TrendPoint } from '../lib/api'
import { cn } from '../lib/utils'

function focusMetricValue(metric: MapMetric, team: TeamMapPoint): number {
  if (metric === 'winPct') return (team.winPct ?? 0) * 100
  if (metric === 'clutchNetRtg') return team.clutchNetRtg ?? 0
  return team.netRtg ?? 0
}

function focusMetricSort(metric: MapMetric, team: TeamMapPoint): number {
  if (metric === 'winPct') return team.winPct ?? Number.NEGATIVE_INFINITY
  if (metric === 'clutchNetRtg') return team.clutchNetRtg ?? Number.NEGATIVE_INFINITY
  return team.netRtg ?? Number.NEGATIVE_INFINITY
}

type StatOption = { key: string; label: string; pct?: boolean }

const TEAM_STATS: StatOption[] = [
  { key: 'NET_RTG', label: 'Net Rating' },
  { key: 'WIN_PCT', label: 'Win %', pct: true },
  { key: 'OFF_RTG', label: 'Off Rating' },
  { key: 'DEF_RTG', label: 'Def Rating' },
  { key: 'PACE', label: 'Pace' },
  { key: 'PTS', label: 'PPG' },
]

const PLAYER_STATS: StatOption[] = [
  { key: 'PTS', label: 'PPG' },
  { key: 'REB', label: 'RPG' },
  { key: 'AST', label: 'APG' },
  { key: 'FG_PCT', label: 'FG%', pct: true },
  { key: 'FG3_PCT', label: '3P%', pct: true },
  { key: 'TS_PCT', label: 'TS%', pct: true },
]

const ACCENT = '#ea580c'

type DashboardTrendsProps = {
  context: 'league' | 'team' | 'player'
  entityId: number | null
  label: string
  focusMetric: MapMetric
  teams: TeamMapPoint[]
  leagueTrend?: Overview['leagueScoringTrend']
}

export function DashboardTrends({
  context,
  entityId,
  label,
  focusMetric,
  teams,
  leagueTrend,
}: DashboardTrendsProps) {
  const statOptions = context === 'player' ? PLAYER_STATS : TEAM_STATS
  const initialStat = context === 'player' ? 'PTS' : focusMetric === 'winPct' ? 'WIN_PCT' : 'NET_RTG'
  const [stat, setStat] = useState(initialStat)
  const activeStat = statOptions.find((s) => s.key === stat) ?? statOptions[0]

  const { data: fetched, isLoading } = useQuery({
    queryKey: ['trend', context, entityId, stat],
    queryFn: () =>
      api<TrendPoint[]>(
        context === 'team'
          ? `/api/teams/${entityId}/trends?stat=${stat}`
          : `/api/players/${entityId}/trends?stat=${stat}`,
      ),
    enabled: context !== 'league' && entityId != null,
  })

  const points: TrendPoint[] = context === 'league' ? leagueTrend ?? [] : fetched ?? []
  const isPct = context === 'league' ? false : activeStat.pct
  const chartData = points.map((p) => ({
    season: p.season,
    value: p.value == null ? null : isPct ? Number((p.value * 100).toFixed(1)) : Number(p.value.toFixed(1)),
  }))

  const focusHeadings: Record<MapMetric, string> = {
    winPct: 'League Win % Snapshot',
    netRtg: 'League Net Rating Snapshot',
    clutchNetRtg: 'League Clutch Net Snapshot',
  }
  const heading = context === 'league' ? focusHeadings[focusMetric] : `${activeStat.label} Trend`

  const leagueChartData = [...teams]
    .sort((a, b) => focusMetricSort(focusMetric, b) - focusMetricSort(focusMetric, a))
    .slice(0, 10)
    .map((team, index) => ({
      teamId: team.teamId,
      name: team.abbreviation,
      value: focusMetricValue(focusMetric, team),
      fill: index < 3 ? '#38bdf8' : '#bae6fd',
    }))
  const hasData = context === 'league' ? leagueChartData.length > 0 : chartData.length > 0

  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            {heading} <span className="font-normal text-gray-400">· {label}</span>
          </CardTitle>
          {context !== 'league' && (
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-gray-100 p-0.5">
              {statOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setStat(option.key)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    stat === option.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {context !== 'league' && isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500">Loading trend…</div>
        ) : !hasData ? (
          <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-gray-400">
            No multi-season data yet. Run an admin backfill to populate trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            {context === 'league' ? (
              <BarChart data={leagueChartData} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={42} tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [
                    focusMetric === 'winPct'
                      ? `${Number(typeof value === 'number' ? value : 0).toFixed(1)}%`
                      : Number(typeof value === 'number' ? value : 0).toFixed(1),
                    focusMetric === 'winPct' ? 'Win %' : focusMetric === 'clutchNetRtg' ? 'Clutch Net' : 'Net Rating',
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {leagueChartData.map((entry) => (
                    <Cell key={entry.teamId} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="season" tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#d4d4d4' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e5e5', borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} name={activeStat.label} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
        {context === 'league' ? (
          <p className="mt-3 text-xs text-gray-400">
            Top-10 teams by {focusMetric === 'winPct' ? 'winning percentage' : focusMetric === 'clutchNetRtg' ? 'clutch net rating' : 'net rating'} for this season.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

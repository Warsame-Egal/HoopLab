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
import { SegmentedControl } from './ui/SegmentedControl'
import { ChartCard } from './ui/ChartCard'
import type { MapMetric } from './TeamMap'
import { api, type Overview, type TeamMapPoint, type TrendPoint } from '../lib/api'
import { CHART_ACCENT, CHART_COLORS, axisProps, gridProps } from '../lib/chartTheme'
import { chartTooltip } from '../lib/chartTooltipContent'
import { teamWinPct } from '../lib/teamWinPct'

function focusMetricValue(metric: MapMetric, team: TeamMapPoint): number {
  if (metric === 'winPct') return teamWinPct(team) ?? 0
  if (metric === 'clutchNetRtg') return team.clutchNetRtg ?? 0
  return team.netRtg ?? 0
}

function focusMetricSort(metric: MapMetric, team: TeamMapPoint): number {
  if (metric === 'winPct') return teamWinPct(team) ?? Number.NEGATIVE_INFINITY
  if (metric === 'clutchNetRtg') return team.clutchNetRtg ?? Number.NEGATIVE_INFINITY
  return team.netRtg ?? Number.NEGATIVE_INFINITY
}

type StatOption = { key: string; label: string; pct?: boolean }

const TEAM_STATS: StatOption[] = [
  { key: 'WIN_PCT', label: 'Win %', pct: true },
  { key: 'NET_RTG', label: 'Net Rating' },
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
  const initialStat = context === 'player' ? 'PTS' : 'WIN_PCT'
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
  const isPct = context === 'league' ? focusMetric === 'winPct' : activeStat.pct
  const chartData = points.map((p, i) => ({
    label: context === 'team' && stat === 'WIN_PCT' ? `S${i + 1}` : p.season,
    value: p.value == null ? null : isPct ? Number((p.value * (p.value <= 1 ? 100 : 1)).toFixed(1)) : Number(p.value.toFixed(1)),
  }))

  const focusHeadings: Record<MapMetric, string> = {
    winPct: 'Win % Snapshot',
    netRtg: 'Net Rating Snapshot',
    clutchNetRtg: 'Clutch Net Snapshot',
  }
  const heading = context === 'league' ? focusHeadings[focusMetric] : `${activeStat.label} Trend`

  const leagueChartData = [...teams]
    .sort((a, b) => focusMetricSort(focusMetric, b) - focusMetricSort(focusMetric, a))
    .slice(0, 10)
    .map((team, index) => ({
      teamId: team.teamId,
      name: team.abbreviation,
      value: focusMetricValue(focusMetric, team),
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }))
  const hasData = context === 'league' ? leagueChartData.some((d) => d.value != null) : chartData.length > 0
  const leagueIsPct = focusMetric === 'winPct'

  const metricDescriptions: Record<MapMetric, string> = {
    winPct: 'Top-10 teams by win percentage this season.',
    netRtg: 'Top-10 teams by net rating this season.',
    clutchNetRtg: 'Top-10 teams by clutch net rating this season.',
  }

  return (
    <ChartCard
      title={
        <>
          {heading} <span className="font-normal text-muted-foreground">· {label}</span>
        </>
      }
      icon={TrendingUp}
      loading={context !== 'league' && isLoading}
      empty={!hasData}
      emptyTitle="No trend data"
      emptyDescription="No data for this season."
      footer={
        context === 'league' ? (
          <p className="text-xs text-muted-foreground">{metricDescriptions[focusMetric]}</p>
        ) : undefined
      }
    >
      {context !== 'league' && (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
          <SegmentedControl
            options={statOptions.map((o) => ({ key: o.key, label: o.label }))}
            value={stat}
            onChange={setStat}
          />
        </div>
      )}
      <ResponsiveContainer width="100%" height={260}>
        {context === 'league' ? (
          <BarChart data={leagueChartData} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              type="number"
              domain={leagueIsPct ? [0, 100] : ['auto', 'auto']}
              tickFormatter={leagueIsPct ? (v) => `${v}%` : undefined}
              {...axisProps}
            />
            <YAxis dataKey="name" type="category" width={42} {...axisProps} />
            <Tooltip content={chartTooltip(leagueIsPct)} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {leagueChartData.map((entry) => (
                <Cell key={entry.teamId} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis domain={isPct ? [0, 100] : undefined} tickFormatter={isPct ? (v) => `${v}%` : undefined} {...axisProps} />
            <Tooltip content={chartTooltip(isPct)} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_ACCENT}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_ACCENT }}
              activeDot={{ r: 5 }}
              name={activeStat.label}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </ChartCard>
  )
}

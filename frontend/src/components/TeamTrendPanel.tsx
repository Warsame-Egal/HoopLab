import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MapMetric } from './TeamMap'
import { SegmentedControl } from './ui/SegmentedControl'
import { ChartCard } from './ui/ChartCard'
import { api, type TrendPoint } from '../lib/api'
import { CHART_ACCENT, axisProps, gridProps } from '../lib/chartTheme'
import { chartTooltip } from '../lib/chartTooltipContent'

type TeamMetric = { key: string; label: string; pct?: boolean }

const TEAM_METRICS: TeamMetric[] = [
  { key: 'WIN_PCT', label: 'Win %', pct: true },
  { key: 'NET_RTG', label: 'Net Rating' },
  { key: 'OFF_RTG', label: 'Off Rating' },
  { key: 'DEF_RTG', label: 'Def Rating' },
  { key: 'PACE', label: 'Pace' },
  { key: 'PTS', label: 'PPG' },
]

function mapMetricToStat(metric: MapMetric): string {
  if (metric === 'winPct') return 'WIN_PCT'
  if (metric === 'clutchNetRtg') return 'NET_RTG'
  return 'NET_RTG'
}

export function TeamTrendPanel({
  teamId,
  season,
  focusMetric = 'netRtg',
}: {
  teamId: number
  season: string
  focusMetric?: MapMetric
}) {
  const [stat, setStat] = useState(mapMetricToStat(focusMetric))
  const active = TEAM_METRICS.find((m) => m.key === stat) ?? TEAM_METRICS[0]

  const { data, isLoading } = useQuery({
    queryKey: ['trend', 'team', teamId, stat],
    queryFn: () => api<TrendPoint[]>(`/api/teams/${teamId}/trends?stat=${stat}`),
    enabled: Number.isFinite(teamId),
  })

  const chartData = useMemo(() => {
    const points = [...(data ?? [])].sort((a, b) => a.season.localeCompare(b.season))
    return points.map((p) => ({
      label: p.season,
      value:
        p.value == null
          ? null
          : active.pct
            ? Number((p.value * (p.value <= 1 ? 100 : 1)).toFixed(1))
            : Number(p.value.toFixed(1)),
      highlight: p.season === season,
    }))
  }, [data, active.pct, season])

  const hasData = chartData.some((d) => d.value != null)

  return (
    <ChartCard
      title="Performance Trends"
      icon={TrendingUp}
      loading={isLoading}
      empty={!isLoading && !hasData}
      emptyTitle="No trend data"
      emptyDescription={`No ${active.label.toLowerCase()} history for this team.`}
      footer={
        <SegmentedControl
          options={TEAM_METRICS.map((m) => ({ key: m.key, label: m.label }))}
          value={stat}
          onChange={setStat}
        />
      }
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} minTickGap={16} />
          <YAxis
            domain={active.pct ? [0, 100] : ['auto', 'auto']}
            tickFormatter={active.pct ? (v) => `${v}%` : undefined}
            {...axisProps}
          />
          <Tooltip content={chartTooltip(active.pct)} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART_ACCENT}
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props
              if (cx == null || cy == null) return null
              const r = payload?.highlight ? 4 : 2
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={payload?.highlight ? 'var(--brand)' : CHART_ACCENT}
                  stroke={payload?.highlight ? 'var(--brand)' : CHART_ACCENT}
                />
              )
            }}
            name={active.label}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

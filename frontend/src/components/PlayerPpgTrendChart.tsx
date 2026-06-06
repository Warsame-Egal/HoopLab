import type { GameLog } from '../lib/api'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_ACCENT, axisProps, gridProps } from '../lib/chartTheme'
import { chartTooltip } from '../lib/chartTooltipContent'
import { ChartCard } from './ui/ChartCard'

function shortDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function PlayerPpgTrendChart({ games, loading }: { games: GameLog[]; loading?: boolean }) {
  const sorted = [...games].sort((a, b) => a.gameDate.localeCompare(b.gameDate))
  const data = sorted.map((g, i) => ({
    label: shortDate(g.gameDate),
    game: i + 1,
    ppg: g.pts ?? 0,
  }))

  return (
    <ChartCard
      title="PPG Trend"
      loading={loading}
      empty={!loading && data.length === 0}
      emptyTitle="No game log"
      emptyDescription="No games for this season."
      chartHeight={260}
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="game" tickFormatter={(v) => `G${v}`} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip content={chartTooltip()} labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''} />
          <Line
            type="monotone"
            dataKey="ppg"
            stroke={CHART_ACCENT}
            strokeWidth={2}
            dot={{ r: 2, fill: CHART_ACCENT }}
            activeDot={{ r: 4 }}
            name="PTS"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

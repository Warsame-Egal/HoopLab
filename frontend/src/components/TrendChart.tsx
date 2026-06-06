import type { PlayerSeasonStats } from '../lib/api'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CHART_ACCENT, axisProps, gridProps } from '../lib/chartTheme'
import { chartTooltip } from '../lib/chartTooltipContent'

export function TrendChart({ seasons }: { seasons: PlayerSeasonStats[] }) {
  const data = [...seasons]
    .reverse()
    .map((s) => ({ season: s.season, ppg: s.pts ?? 0 }))

  return (
    <Card className="card-hover">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-foreground">PPG Trend</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="season" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={chartTooltip()} />
            <Line
              type="monotone"
              dataKey="ppg"
              stroke={CHART_ACCENT}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_ACCENT }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

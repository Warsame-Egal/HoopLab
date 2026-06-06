import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_ACCENT, axisProps, gridProps } from '../lib/chartTheme'
import { ChartTooltipContent } from './ChartTooltip'
import { ChartCard } from './ui/ChartCard'
import { api } from '../lib/api'

type WinProbResponse = {
  game_id?: string
  records?: Record<string, unknown>[]
}

export function WinProbabilityChart({ gameId }: { gameId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['winprob', gameId],
    queryFn: () => api<WinProbResponse>(`/api/games/${gameId}/win-probability`),
    enabled: !!gameId,
    staleTime: 60_000 * 60,
    retry: 1,
  })

  const points = (data?.records ?? [])
    .map((r, i) => ({
      idx: i,
      home: Number(r.HOME_PCT ?? r.HOME_WP ?? r.WC_HOME_TEAM_WINNING_PERCENTAGE ?? 0.5) * 100,
    }))
    .filter((p) => Number.isFinite(p.home))

  return (
    <ChartCard
      title="Win probability"
      loading={isLoading}
      empty={isError || points.length === 0}
      emptyTitle="No win probability data"
      emptyDescription="Win probability is unavailable for this game."
      chartHeight={192}
    >
      <ResponsiveContainer width="100%" height={192}>
        <AreaChart data={points}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="idx" hide />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} {...axisProps} />
          <Tooltip content={<ChartTooltipContent valueIsPercent />} />
          <Area
            type="monotone"
            dataKey="home"
            stroke={CHART_ACCENT}
            fill={CHART_ACCENT}
            fillOpacity={0.2}
            name="Home win %"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

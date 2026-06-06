export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--brand)',
]

export const CHART_ACCENT = 'var(--brand)'

export const CHART_SUCCESS = 'var(--success)'
export const CHART_LIVE = 'var(--live)'

export const axisProps = {
  tick: { fill: 'var(--muted-foreground)', fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
}

export const gridProps = {
  strokeDasharray: '4 4',
  stroke: 'var(--border)',
  vertical: false,
}

export function formatChartNumber(value: number): string {
  if (Math.abs(value) >= 100) return value.toFixed(0)
  return value.toFixed(1)
}

export function formatChartPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

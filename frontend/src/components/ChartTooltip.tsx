import { formatChartNumber, formatChartPercent } from '../lib/chartTheme'

function formatTooltipValue(value: number, percent?: boolean, valueIsPercent?: boolean): string {
  if (valueIsPercent) return `${value.toFixed(1)}%`
  if (percent) return formatChartPercent(value)
  return formatChartNumber(value)
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  percent,
  valueIsPercent,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number }>
  label?: string | number
  percent?: boolean
  valueIsPercent?: boolean
}) {
  if (!active || !payload?.length) return null
  const labelText = label != null ? String(label) : undefined
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      {labelText ? <p className="mb-1 text-xs text-muted-foreground">{labelText}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-medium text-foreground">
          {entry.name}:{' '}
          {entry.value == null
            ? '—'
            : formatTooltipValue(Number(entry.value), percent, valueIsPercent)}
        </p>
      ))}
    </div>
  )
}

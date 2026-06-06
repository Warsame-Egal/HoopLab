import { createElement } from 'react'
import type { TooltipContentProps, TooltipProps } from 'recharts'
import { ChartTooltipContent } from '../components/ChartTooltip'

export function chartTooltip(opts?: boolean | { percent?: boolean; valueIsPercent?: boolean }) {
  const percent = typeof opts === 'boolean' ? opts : opts?.percent
  const valueIsPercent = typeof opts === 'object' ? opts?.valueIsPercent : false
  const render = (props: TooltipContentProps) =>
    createElement(ChartTooltipContent, {
      active: props.active,
      payload: props.payload as unknown as Array<{ name?: string; value?: number }> | undefined,
      label: props.label,
      percent,
      valueIsPercent,
    })
  return render as NonNullable<TooltipProps['content']>
}

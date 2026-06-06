import { useCallback } from 'react'
import { cn } from '../../lib/utils'

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  dense = false,
  'aria-label': ariaLabel,
}: {
  options: { key: T; label: string }[]
  value: T
  onChange: (key: T) => void
  className?: string
  dense?: boolean
  'aria-label'?: string
}) {
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const delta = e.key === 'ArrowRight' ? 1 : -1
      const next = (index + delta + options.length) % options.length
      onChange(options[next].key)
    },
    [onChange, options],
  )

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        dense ? 'flex flex-wrap gap-0.5' : 'inline-flex items-center gap-1',
        'rounded-lg bg-muted p-1',
        className,
      )}
    >
      {options.map(({ key, label }, index) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          tabIndex={value === key ? 0 : -1}
          onKeyDown={(e) => onKeyDown(e, index)}
          onClick={() => onChange(key)}
          className={cn(
            'rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            dense ? 'px-2 py-1 text-[10px]' : 'px-4 py-2 text-sm',
            value === key
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

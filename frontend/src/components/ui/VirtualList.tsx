import { useRef, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '../../lib/utils'

type VirtualListProps<T> = {
  items: T[]
  estimateSize?: number
  maxHeight?: number | string
  className?: string
  renderItem: (item: T, index: number) => ReactNode
  getKey?: (item: T, index: number) => string | number
}

export function VirtualList<T>({
  items,
  estimateSize = 56,
  maxHeight = 384,
  className,
  renderItem,
  getKey,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 8,
  })

  return (
    <div
      ref={parentRef}
      className={cn('overflow-y-auto', className)}
      style={{ maxHeight }}
      role="list"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index]
          const key = getKey ? getKey(item, virtualRow.index) : virtualRow.index
          return (
            <div
              key={key}
              role="listitem"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

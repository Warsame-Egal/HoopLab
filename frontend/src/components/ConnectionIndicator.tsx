import { useEffect, useState } from 'react'
import type { WsConnectionStatus } from '../lib/ws'

type ConnectionIndicatorProps = {
  status: WsConnectionStatus
  lastUpdatedAt: number | null
  showFreshness?: boolean
}

function formatAgo(ms: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (sec < 60) return `${sec}s ago`
  return `${Math.floor(sec / 60)}m ago`
}

export function ConnectionIndicator({
  status,
  lastUpdatedAt,
  showFreshness = true,
}: ConnectionIndicatorProps) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!showFreshness || !lastUpdatedAt) return
    const id = window.setInterval(() => tick((n) => n + 1), 5000)
    return () => clearInterval(id)
  }, [lastUpdatedAt, showFreshness])

  if (status === 'idle' && !lastUpdatedAt) return null

  const label =
    status === 'connected'
      ? 'Live'
      : status === 'reconnecting'
        ? 'Reconnecting'
        : status === 'connecting'
          ? 'Connecting'
          : 'Offline'

  const dotClass =
    status === 'connected'
      ? 'bg-live animate-pulse'
      : status === 'reconnecting' || status === 'connecting'
        ? 'bg-warning animate-pulse'
        : 'bg-muted-foreground'

  return (
    <span
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      title={lastUpdatedAt ? `Last update ${formatAgo(lastUpdatedAt)}` : label}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden />
      <span>{label}</span>
      {showFreshness && lastUpdatedAt && status === 'connected' ? (
        <span className="hidden sm:inline">· {formatAgo(lastUpdatedAt)}</span>
      ) : null}
    </span>
  )
}

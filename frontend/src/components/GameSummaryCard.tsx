import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

type SummaryResponse = {
  game_id?: string
  summary?: Record<string, unknown>
}

export function GameSummaryCard({
  gameId,
  enabled = true,
}: {
  gameId: string
  enabled?: boolean
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['game-summary', gameId],
    queryFn: () => api<SummaryResponse>(`/api/games/${gameId}/summary`),
    enabled: !!gameId && enabled,
    staleTime: 30_000,
  })

  if (!enabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Game summary is available after the game ends or when the NBA stats feed publishes full data.
      </p>
    )
  }
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading game summary…</p>
  if (isError || !data?.summary) {
    return <p className="text-sm text-muted-foreground">Game summary unavailable.</p>
  }

  const box = data.summary.boxScoreSummary as Record<string, unknown> | undefined
  const arena = data.summary.arenaInfo as Record<string, unknown> | undefined

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm">
      <h3 className="mb-3 font-semibold uppercase tracking-wide text-muted-foreground">Game summary</h3>
      <dl className="grid gap-2 sm:grid-cols-2">
        {box?.gameStatusText != null && (
          <>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-foreground">{String(box.gameStatusText)}</dd>
          </>
        )}
        {arena?.arenaName != null && (
          <>
            <dt className="text-muted-foreground">Arena</dt>
            <dd className="text-foreground">{String(arena.arenaName)}</dd>
          </>
        )}
        {arena?.arenaCity != null && (
          <>
            <dt className="text-muted-foreground">Location</dt>
            <dd className="text-foreground">
              {[arena.arenaCity, arena.arenaState].filter(Boolean).join(', ')}
            </dd>
          </>
        )}
        {box?.attendance != null && (
          <>
            <dt className="text-muted-foreground">Attendance</dt>
            <dd className="text-foreground">{String(box.attendance)}</dd>
          </>
        )}
      </dl>
    </div>
  )
}

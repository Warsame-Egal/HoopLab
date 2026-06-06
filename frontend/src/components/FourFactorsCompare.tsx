import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

type RawBoxScore = {
  team_stats?: Record<string, unknown>[]
}

const FACTORS: { key: string; label: string }[] = [
  { key: 'EFG_PCT', label: 'eFG%' },
  { key: 'TM_TOV_PCT', label: 'TOV%' },
  { key: 'OREB_PCT', label: 'OREB%' },
  { key: 'FTA_RATE', label: 'FTA Rate' },
]

export function FourFactorsCompare({
  gameId,
  enabled = true,
}: {
  gameId: string
  enabled?: boolean
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['fourfactors-compare', gameId],
    queryFn: () => api<RawBoxScore>(`/api/games/${gameId}/boxscore/fourfactors`),
    enabled: !!gameId && enabled,
  })

  const teams = data?.team_stats ?? []
  if (teams.length < 2) {
    if (isLoading) return <p className="text-sm text-muted-foreground">Loading four factors…</p>
    return null
  }

  const [away, home] = teams

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Four factors
      </h3>
      <div className="space-y-4">
        {FACTORS.map(({ key, label }) => {
          const a = Number(away[key] ?? 0)
          const h = Number(home[key] ?? 0)
          const max = Math.max(a, h, 0.001)
          return (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{String(away.TEAM_ABBREVIATION ?? 'Away')}</span>
                <span className="font-medium text-foreground">{label}</span>
                <span>{String(home.TEAM_ABBREVIATION ?? 'Home')}</span>
              </div>
              <div className="flex h-2 gap-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="rounded-l-full bg-brand/80"
                  style={{ width: `${(a / max) * 50}%` }}
                />
                <div
                  className="ml-auto rounded-r-full bg-muted-foreground/50"
                  style={{ width: `${(h / max) * 50}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

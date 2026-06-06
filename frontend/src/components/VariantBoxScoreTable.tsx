import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TeamLogo } from './TeamLogo'
import { api } from '../lib/api'

type RawBoxScore = {
  game_id?: string
  measure?: string
  player_stats?: Record<string, unknown>[]
  team_stats?: Record<string, unknown>[]
}

const SKIP_KEYS = new Set([
  'TEAM_ID',
  'TEAM_ABBREVIATION',
  'TEAM_NAME',
  'PLAYER_ID',
  'PLAYER_NAME',
  'teamId',
  'personId',
  'nameI',
  'firstName',
  'familyName',
])

function statColumns(row: Record<string, unknown>): string[] {
  return Object.keys(row).filter((k) => !SKIP_KEYS.has(k) && row[k] != null)
}

function formatCell(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'number') {
    if (value > 0 && value < 1) return `${(value * 100).toFixed(1)}%`
    return Number.isInteger(value) ? String(value) : value.toFixed(1)
  }
  return String(value)
}

export function VariantBoxScoreTable({
  gameId,
  variant,
  enabled = true,
}: {
  gameId: string
  variant: 'scoring' | 'usage' | 'hustle' | 'playertrack'
  enabled?: boolean
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['box-variant', gameId, variant],
    queryFn: () => api<RawBoxScore>(`/api/games/${gameId}/boxscore/${variant}`),
    enabled: !!gameId && enabled,
    retry: 1,
  })

  if (!enabled) {
    return (
      <p className="text-muted-foreground">
        {variant} stats are available after the game ends or when the NBA stats feed publishes box score data.
      </p>
    )
  }
  if (isLoading) return <p className="text-muted-foreground">Loading {variant} box score…</p>
  if (error || !data?.team_stats?.length) {
    return <p className="text-muted-foreground">No {variant} box score available for this game.</p>
  }

  const columns = statColumns(data.team_stats[0] ?? {})

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {data.team_stats.map((team) => {
        const teamId = team.TEAM_ID as number | undefined
        const abbr = String(team.TEAM_ABBREVIATION ?? '')
        const players = (data.player_stats ?? []).filter((p) => p.TEAM_ID === teamId)
        return (
          <Card key={String(teamId)}>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-3 text-foreground">
                <TeamLogo abbreviation={abbr} className="h-7 w-7" />
                {String(team.TEAM_NAME ?? abbr)}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-border bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Player</th>
                    {columns.map((col) => (
                      <th key={col} className="px-2 py-2 text-right font-medium">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="px-3 py-2">
                        {p.PLAYER_ID != null ? (
                          <Link
                            to={`/players/${p.PLAYER_ID}`}
                            className="font-medium text-foreground hover:text-brand"
                          >
                            {String(p.PLAYER_NAME ?? '—')}
                          </Link>
                        ) : (
                          String(p.PLAYER_NAME ?? '—')
                        )}
                      </td>
                      {columns.map((col) => (
                        <td key={col} className="px-2 py-2 text-right text-muted-foreground">
                          {formatCell(p[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-muted font-semibold">
                    <td className="px-3 py-2 text-foreground">Team</td>
                    {columns.map((col) => (
                      <td key={col} className="px-2 py-2 text-right text-foreground">
                        {formatCell(team[col])}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

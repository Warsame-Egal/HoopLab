import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TeamLogo } from './TeamLogo'
import { api, type AdvancedBoxScore, type AdvancedRow } from '../lib/api'

function formatValue(label: string, value: number | null): string {
  if (value == null) return '—'
  if (label.includes('%')) return `${(value * 100).toFixed(1)}`
  return value.toFixed(1)
}

function TeamAdvancedTable({
  columns,
  team,
  players,
}: {
  columns: string[]
  team: AdvancedRow
  players: AdvancedRow[]
}) {
  return (
    <Card className="">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <TeamLogo abbreviation={team.abbreviation ?? ''} className="h-7 w-7" />
          {team.name ?? team.abbreviation}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Player</th>
                {columns.map((col) => (
                  <th key={col} className="px-2 py-2 text-right font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.playerId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Link to={`/players/${player.playerId}`} className="font-medium text-foreground hover:text-brand">
                      {player.name}
                    </Link>
                  </td>
                  {player.values.map((value, idx) => (
                    <td key={idx} className="px-2 py-2 text-right text-muted-foreground">
                      {formatValue(columns[idx], value)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-border bg-muted font-semibold">
                <td className="px-3 py-2 text-foreground">Team</td>
                {team.values.map((value, idx) => (
                  <td key={idx} className="px-2 py-2 text-right text-foreground">
                    {formatValue(columns[idx], value)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdvancedBoxScoreTable({
  gameId,
  measure,
  enabled = true,
}: {
  gameId: string
  measure: 'advanced' | 'fourfactors'
  enabled?: boolean
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adv-boxscore', gameId, measure],
    queryFn: () => api<AdvancedBoxScore>(`/api/games/${gameId}/boxscore/advanced?measure=${measure}`),
    enabled: !!gameId && enabled,
    retry: 1,
  })

  if (!enabled) {
    return (
      <p className="text-muted-foreground">
        {measure} stats are available after the game ends or when the NBA stats feed publishes box score data.
      </p>
    )
  }
  if (isLoading) return <p className="text-muted-foreground">Loading {measure} box score…</p>
  if (error || !data) return <p className="text-muted-foreground">No {measure} box score available for this game.</p>

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {data.teams.map((team) => (
        <TeamAdvancedTable
          key={team.teamId}
          columns={data.columns}
          team={team}
          players={data.players.filter((p) => p.teamId === team.teamId)}
        />
      ))}
    </div>
  )
}

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { PlayerHeadshot } from './PlayerHeadshot'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { Game, PlayerLeader } from '../types/scoreboard'
import { getGameStatus } from '../types/scoreboard'

type PerfRow = {
  playerId: number
  name: string
  teamTricode: string
  pts: number
  reb: number
  ast: number
  gameId: string
}

function collectLeaders(games: Game[]): PerfRow[] {
  const rows: PerfRow[] = []
  for (const game of games) {
    const status = getGameStatus(game)
    if (status === 'upcoming') continue
    const leaders = game.gameLeaders
    if (!leaders) continue
    for (const side of [leaders.homeLeaders, leaders.awayLeaders]) {
      if (!side) continue
      rows.push({
        playerId: side.personId,
        name: side.name,
        teamTricode: side.teamTricode,
        pts: side.points,
        reb: side.rebounds,
        ast: side.assists,
        gameId: game.gameId,
      })
    }
  }
  return rows
}

function topBy(rows: PerfRow[], key: keyof Pick<PerfRow, 'pts' | 'reb' | 'ast'>): PerfRow | null {
  if (rows.length === 0) return null
  return [...rows].sort((a, b) => b[key] - a[key])[0] ?? null
}

function LeaderRow({ row, stat, label }: { row: PerfRow | null; stat: keyof PlayerLeader; label: string }) {
  if (!row) {
    return (
      <p className="text-sm text-muted-foreground">
        No {label} leader yet tonight.
      </p>
    )
  }
  const value = stat === 'points' ? row.pts : stat === 'rebounds' ? row.reb : row.ast
  return (
    <Link
      to={`/players/${row.playerId}`}
      className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
    >
      <PlayerHeadshot playerId={row.playerId} name={row.name} className="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{row.name}</p>
        <p className="text-xs text-muted-foreground">
          {row.teamTricode} ·{' '}
          <Link to={`/games/${row.gameId}`} className="hover:text-brand" onClick={(e) => e.stopPropagation()}>
            box score
          </Link>
        </p>
      </div>
      <span className="text-lg font-semibold tabular-nums text-foreground">{value}</span>
    </Link>
  )
}

type TopPerformersTonightProps = {
  games: Game[]
}

export function TopPerformersTonight({ games }: TopPerformersTonightProps) {
  const rows = useMemo(() => collectLeaders(games), [games])
  const topPts = useMemo(() => topBy(rows, 'pts'), [rows])
  const topReb = useMemo(() => topBy(rows, 'reb'), [rows])
  const topAst = useMemo(() => topBy(rows, 'ast'), [rows])

  if (rows.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <Trophy className="h-4 w-4 text-brand" />
          Top performers tonight
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 divide-y divide-border">
        <div className="pb-2">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Points</p>
          <LeaderRow row={topPts} stat="points" label="scoring" />
        </div>
        <div className="py-2">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Rebounds</p>
          <LeaderRow row={topReb} stat="rebounds" label="rebounding" />
        </div>
        <div className="pt-2">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Assists</p>
          <LeaderRow row={topAst} stat="assists" label="playmaking" />
        </div>
      </CardContent>
    </Card>
  )
}

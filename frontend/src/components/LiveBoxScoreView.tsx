import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { BoxScoreResponse } from '../types/scoreboard'

export function LiveBoxScoreView({ data }: { data: BoxScoreResponse }) {
  const hasPlayerStats =
    (data.home_team.players?.length ?? 0) > 0 || (data.away_team.players?.length ?? 0) > 0

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">{data.status}</p>
      {!hasPlayerStats ? (
        <p className="text-sm text-muted-foreground">
          Team scores are live. Full player box score fills in when the NBA stats feed is available
          (often after tip-off or when the game ends).
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <LiveTeamBox team={data.away_team} label="Away" />
        <LiveTeamBox team={data.home_team} label="Home" />
      </div>
    </div>
  )
}

function LiveTeamBox({
  team,
  label,
}: {
  team: BoxScoreResponse['home_team']
  label: string
}) {
  return (
    <Card className="">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center justify-between text-foreground">
          <span>{team.team_name}</span>
          <span className="text-2xl font-bold text-brand">{team.score}</span>
        </CardTitle>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Player</th>
                <th className="px-2 py-2 text-right font-medium">MIN</th>
                <th className="px-2 py-2 text-right font-medium">PTS</th>
                <th className="px-2 py-2 text-right font-medium">REB</th>
                <th className="px-2 py-2 text-right font-medium">AST</th>
              </tr>
            </thead>
            <tbody>
              {team.players.map((p) => (
                <tr key={p.player_id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      to={`/players/${p.player_id}`}
                      className="font-medium text-foreground hover:text-brand"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-right text-muted-foreground">{p.minutes ?? '—'}</td>
                  <td className="px-2 py-2 text-right font-semibold text-foreground">{p.points}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">{p.rebounds}</td>
                  <td className="px-2 py-2 text-right text-muted-foreground">{p.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

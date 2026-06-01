import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { AdvancedBoxScoreTable } from '../components/AdvancedBoxScoreTable'
import { TeamLogo } from '../components/TeamLogo'
import { api, type BoxScore, type BoxScoreTeam } from '../lib/api'
import { cn } from '../lib/utils'

type BoxTab = 'traditional' | 'advanced' | 'fourfactors'

const TABS: { key: BoxTab; label: string }[] = [
  { key: 'traditional', label: 'Traditional' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'fourfactors', label: 'Four Factors' },
]

function pct(made: number | null, att: number | null): string {
  if (made == null || att == null || att === 0) return '—'
  return `${Math.round((made / att) * 100)}%`
}

function TeamBox({ team }: { team: BoxScoreTeam }) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="border-b border-gray-100 pb-4">
        <CardTitle className="flex items-center justify-between text-gray-900">
          <span className="flex items-center gap-3">
            <TeamLogo abbreviation={team.abbreviation} className="h-8 w-8" />
            {team.teamName ?? team.abbreviation}
          </span>
          <span className="text-2xl font-bold text-orange-600">{team.pts ?? '—'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium">Player</th>
                <th className="px-2 py-2 text-right font-medium">MIN</th>
                <th className="px-2 py-2 text-right font-medium">PTS</th>
                <th className="px-2 py-2 text-right font-medium">REB</th>
                <th className="px-2 py-2 text-right font-medium">AST</th>
                <th className="px-2 py-2 text-right font-medium">FG</th>
                <th className="px-2 py-2 text-right font-medium">3P</th>
                <th className="px-2 py-2 text-right font-medium">+/-</th>
              </tr>
            </thead>
            <tbody>
              {team.players.map((p) => (
                <tr key={p.playerId} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2">
                    <Link to={`/players/${p.playerId}`} className="font-medium text-gray-900 hover:text-orange-600">
                      {p.name}
                    </Link>
                    {p.startPosition ? <span className="ml-1 text-gray-400">{p.startPosition}</span> : null}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-600">{p.min ?? '—'}</td>
                  <td className="px-2 py-2 text-right font-semibold text-gray-900">{p.pts ?? 0}</td>
                  <td className="px-2 py-2 text-right text-gray-700">{p.reb ?? 0}</td>
                  <td className="px-2 py-2 text-right text-gray-700">{p.ast ?? 0}</td>
                  <td className="px-2 py-2 text-right text-gray-700">{p.fgm ?? 0}/{p.fga ?? 0} ({pct(p.fgm, p.fga)})</td>
                  <td className="px-2 py-2 text-right text-gray-700">{p.fg3m ?? 0}/{p.fg3a ?? 0}</td>
                  <td className={`px-2 py-2 text-right ${(p.plusMinus ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {p.plusMinus == null ? '—' : p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function GameDetailPage() {
  const { gameId } = useParams()
  const [tab, setTab] = useState<BoxTab>('traditional')

  const { data, isLoading, error } = useQuery({
    queryKey: ['boxscore', gameId],
    queryFn: () => api<BoxScore>(`/api/games/${gameId}/boxscore`),
    enabled: !!gameId && tab === 'traditional',
  })

  return (
    <div className="space-y-6">
      <Link to=".." onClick={(e) => { e.preventDefault(); history.back() }} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Box Score</h2>
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'traditional' ? (
        isLoading ? (
          <p className="text-gray-500">Loading box score…</p>
        ) : error ? (
          <p className="text-gray-400">No box score available for this game.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {data?.teams.map((team) => (
              <TeamBox key={team.teamId} team={team} />
            ))}
          </div>
        )
      ) : (
        <AdvancedBoxScoreTable gameId={gameId ?? ''} measure={tab} />
      )}
    </div>
  )
}

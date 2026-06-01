import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PlayerHeadshot } from '../components/PlayerHeadshot'
import { Card, CardContent } from '../components/ui/card'
import { api, type Leader } from '../lib/api'
import { cn, currentSeason } from '../lib/utils'

const categories = ['PTS', 'REB', 'AST', 'STL', 'BLK']

export function LeadersPage() {
  const [category, setCategory] = useState('PTS')
  const season = currentSeason()

  const { data, isLoading } = useQuery({
    queryKey: ['leaders', season, category],
    queryFn: () => api<Leader[]>(`/api/leaders?season=${season}&category=${category}&limit=25`),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Leaderboards</h2>
          <p className="text-sm text-gray-500">Season {season}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-gray-100 p-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
                category === cat
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <Card className="border border-gray-200">
          <CardContent className="p-0">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">Player</th>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">GP</th>
                  <th className="px-4 py-3 font-medium">{category}</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((leader) => (
                  <tr key={leader.playerId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{leader.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PlayerHeadshot
                          playerId={leader.playerId}
                          name={leader.playerName}
                          className="h-9 w-9"
                        />
                        <span className="font-medium text-gray-900">{leader.playerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{leader.teamAbbreviation}</td>
                    <td className="px-4 py-3 text-gray-700">{leader.gamesPlayed}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{leader.value.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

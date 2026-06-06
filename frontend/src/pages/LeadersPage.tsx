import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlayerHeadshot } from '../components/PlayerHeadshot'
import { TeamLogo } from '../components/TeamLogo'
import { Card, CardContent } from '../components/ui/card'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { StatTable, type StatColumn } from '../components/ui/StatTable'
import { QueryErrorState } from '../components/QueryErrorState'
import { api, type Leader } from '../lib/api'
import { useSeason } from '../lib/useSeason'

const categories = [
  { key: 'PTS', label: 'PTS' },
  { key: 'REB', label: 'REB' },
  { key: 'AST', label: 'AST' },
  { key: 'STL', label: 'STL' },
  { key: 'BLK', label: 'BLK' },
  { key: 'FG3M', label: '3PM' },
  { key: 'FG_PCT', label: 'FG%' },
] as const

function leaderColumns(category: string): StatColumn<Leader>[] {
  return [
    { key: 'rank', header: '#', align: 'right', numeric: true },
    {
      key: 'playerName',
      header: 'Player',
      render: (l) => (
        <div className="flex items-center gap-3">
          <PlayerHeadshot playerId={l.playerId} name={l.playerName} className="h-8 w-8" />
          <Link to={`/players/${l.playerId}`} className="font-medium text-foreground hover:text-brand">
            {l.playerName}
          </Link>
        </div>
      ),
    },
    {
      key: 'teamAbbreviation',
      header: 'Team',
      render: (l) =>
        l.teamAbbreviation ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <TeamLogo abbreviation={l.teamAbbreviation} className="h-5 w-5" />
            {l.teamAbbreviation}
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'gamesPlayed', header: 'GP', align: 'right', numeric: true },
    {
      key: 'value',
      header: category,
      align: 'right',
      numeric: true,
      render: (l) => <span className="font-semibold">{l.value.toFixed(1)}</span>,
    },
  ]
}

export function LeadersPage() {
  const { season } = useSeason()
  const [category, setCategory] = useState<(typeof categories)[number]['key']>('PTS')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['leaders', season, category],
    queryFn: () => api<Leader[]>(`/api/leaders?season=${season}&statCategory=${category}&limit=25`),
    retry: 2,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Leaderboards</h2>
          <p className="text-sm text-muted-foreground">{season}</p>
        </div>
        <SegmentedControl
          options={categories.map((c) => ({ key: c.key, label: c.label }))}
          value={category}
          onChange={(k) => setCategory(k as (typeof categories)[number]['key'])}
        />
      </div>
      {isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : (
        <Card>
          <CardContent className="p-0 pt-2">
            <StatTable
              columns={leaderColumns(category)}
              rows={data ?? []}
              getRowKey={(l) => l.playerId}
              loading={isLoading}
              emptyTitle="No leaders"
              emptyDescription={`No ${category} leaders for ${season}.`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

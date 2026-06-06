import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { PlayerHeadshot } from './PlayerHeadshot'
import { Card, CardContent, CardHeader } from './ui/card'
import { SectionHeader } from './ui/SectionHeader'
import { SegmentedControl } from './ui/SegmentedControl'
import { Skeleton } from './ui/Skeleton'
import { api, type Leader } from '../lib/api'
import { useSeason } from '../lib/useSeason'

const CATEGORIES = [
  { key: 'PTS', label: 'PTS' },
  { key: 'REB', label: 'REB' },
  { key: 'AST', label: 'AST' },
  { key: 'STL', label: 'STL' },
  { key: 'BLK', label: 'BLK' },
  { key: 'FG3M', label: '3PM' },
  { key: 'FG_PCT', label: 'FG%' },
] as const

function LeaderTile({ category, leader }: { category: string; leader: Leader | undefined }) {
  if (!leader) return null
  return (
    <Link
      to={`/players/${leader.playerId}`}
      className="card-hover flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2 py-1.5"
    >
      <PlayerHeadshot playerId={leader.playerId} name={leader.playerName} className="h-8 w-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{category}</p>
        <p className="truncate text-xs font-semibold text-foreground">{leader.playerName}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {leader.value.toFixed(1)} · {leader.teamAbbreviation ?? '—'}
        </p>
      </div>
    </Link>
  )
}

export function LeagueLeadersSpotlight({ enabled = true }: { enabled?: boolean }) {
  const { season } = useSeason()
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['key']>('PTS')

  const leaders = useQuery({
    queryKey: ['leaders', season, category, 3],
    queryFn: () => api<Leader[]>(`/api/leaders?season=${season}&statCategory=${category}&limit=3`),
    enabled,
    retry: 1,
  })

  const loading = leaders.isLoading

  return (
    <Card className="card-hover">
      <CardHeader className="border-b border-border px-3 py-3">
        <SectionHeader
          icon={Trophy}
          title="Leader spotlight"
          action={
            <Link to="/leaders" className="text-[10px] font-medium text-brand hover:underline">
              All
            </Link>
          }
        />
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3 pt-2">
        <SegmentedControl
          dense
          className="w-full"
          options={CATEGORIES.map((c) => ({ key: c.key, label: c.label }))}
          value={category}
          onChange={(k) => setCategory(k as (typeof CATEGORIES)[number]['key'])}
          aria-label="Leader category"
        />
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : (
          leaders.data?.map((leader) => (
            <LeaderTile
              key={leader.playerId}
              category={CATEGORIES.find((c) => c.key === category)?.label ?? category}
              leader={leader}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}

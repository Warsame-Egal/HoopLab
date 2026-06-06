import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GitCompare } from 'lucide-react'
import { CompareEntityPicker, type CompareEntity } from '../components/CompareEntityPicker'
import { PlayerHeadshot } from '../components/PlayerHeadshot'
import { QueryErrorState } from '../components/QueryErrorState'
import { RecordsTable } from '../components/RecordsTable'
import { TeamLogo } from '../components/TeamLogo'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { SectionHeader } from '../components/ui/SectionHeader'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../lib/api'
import { type LeagueRecordsResponse } from '../lib/league'
import { useSeason } from '../lib/useSeason'

type CompareMode = 'players' | 'teams'

export function ComparePage() {
  const { season } = useSeason()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<CompareMode>(
    (searchParams.get('mode') as CompareMode) || 'players',
  )
  const [entityA, setEntityA] = useState<CompareEntity | null>(null)
  const [entityB, setEntityB] = useState<CompareEntity | null>(null)

  const paramMode = searchParams.get('mode') as CompareMode | null
  const syncFromUrl = paramMode == null || paramMode === mode
  const urlIdA = syncFromUrl ? (searchParams.get('a') ?? undefined) : undefined
  const urlIdB = syncFromUrl ? (searchParams.get('b') ?? undefined) : undefined

  const canCompare = entityA != null && entityB != null
  const path =
    mode === 'players'
      ? `/api/compare/players?ids=${entityA!.id},${entityB!.id}&season=${season}`
      : `/api/compare/teams?ids=${entityA!.id},${entityB!.id}&season=${season}`

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['compare', mode, entityA?.id, entityB?.id, season],
    queryFn: () => api<LeagueRecordsResponse>(path),
    enabled: canCompare,
    retry: 2,
  })

  const handleModeChange = (k: string) => {
    setMode(k as CompareMode)
    setEntityA(null)
    setEntityB(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeader icon={GitCompare} title="Compare" sublabel="Head-to-head stats" />

      <SegmentedControl
        options={[
          { key: 'players', label: 'Players' },
          { key: 'teams', label: 'Teams' },
        ]}
        value={mode}
        onChange={handleModeChange}
      />

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <p className="text-sm text-muted-foreground">
            Search by {mode === 'players' ? 'player name' : 'team name or abbreviation'} to pick
            two sides.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 pt-4">
          <CompareEntityPicker
            mode={mode}
            value={entityA}
            onChange={setEntityA}
            placeholder={mode === 'players' ? 'Search player A…' : 'Search team A…'}
            initialId={urlIdA}
          />
          <CompareEntityPicker
            mode={mode}
            value={entityB}
            onChange={setEntityB}
            placeholder={mode === 'players' ? 'Search player B…' : 'Search team B…'}
            initialId={urlIdB}
          />
        </CardContent>
      </Card>

      {canCompare && (
        <div className="flex items-center justify-center gap-8">
          {mode === 'players' ? (
            <>
              <div className="flex flex-col items-center gap-1">
                <PlayerHeadshot
                  playerId={entityA.id}
                  name={entityA.label}
                  className="h-16 w-16"
                />
                <span className="max-w-[8rem] truncate text-center text-sm font-medium">
                  {entityA.label}
                </span>
              </div>
              <span className="text-xl font-bold text-muted-foreground">vs</span>
              <div className="flex flex-col items-center gap-1">
                <PlayerHeadshot
                  playerId={entityB.id}
                  name={entityB.label}
                  className="h-16 w-16"
                />
                <span className="max-w-[8rem] truncate text-center text-sm font-medium">
                  {entityB.label}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center gap-1">
                <TeamLogo abbreviation={entityA.abbr} className="h-16 w-16" />
                <span className="max-w-[8rem] truncate text-center text-sm font-medium">
                  {entityA.label}
                </span>
              </div>
              <span className="text-xl font-bold text-muted-foreground">vs</span>
              <div className="flex flex-col items-center gap-1">
                <TeamLogo abbreviation={entityB.abbr} className="h-16 w-16" />
                <span className="max-w-[8rem] truncate text-center text-sm font-medium">
                  {entityB.label}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : data?.records?.length ? (
        <Card>
          <CardContent className="pt-4">
            <RecordsTable records={data.records} maxRows={30} />
          </CardContent>
        </Card>
      ) : canCompare ? (
        <p className="text-muted-foreground">No comparison data returned.</p>
      ) : null}
    </div>
  )
}

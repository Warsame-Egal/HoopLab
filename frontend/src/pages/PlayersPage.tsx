import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlayerHeadshot } from '../components/PlayerHeadshot'
import { QueryErrorState } from '../components/QueryErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { api, type PageResponse, type PlayerSummary } from '../lib/api'
import { useSeason } from '../lib/useSeason'

export function PlayersPage() {
  const { season } = useSeason()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [page, setPage] = useState(0)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['players', season, debouncedSearch, page],
    queryFn: () =>
      api<PageResponse<PlayerSummary>>(
        `/api/players?season=${season}&search=${encodeURIComponent(debouncedSearch)}&page=${page}&size=20`,
      ),
    retry: 2,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Players</h2>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder="Search players..."
          aria-label="Search players"
          className="mt-4 w-full max-w-md rounded-lg border border-border bg-card px-4 py-2 text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <QueryErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid gap-3">
            {data?.content.map((player) => (
              <Link
                key={player.id}
                to={`/players/${player.id}`}
                className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition hover:border-brand/40 hover:shadow"
              >
                <PlayerHeadshot playerId={player.id} name={player.fullName} className="h-14 w-14" />
                <div>
                  <p className="font-medium text-foreground">{player.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {player.position ?? '—'} · {player.teamAbbreviation ?? 'FA'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!data || page >= data.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}

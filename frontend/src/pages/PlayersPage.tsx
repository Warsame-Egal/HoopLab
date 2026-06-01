import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlayerHeadshot } from '../components/PlayerHeadshot'
import { api, type PageResponse, type PlayerSummary } from '../lib/api'

export function PlayersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['players', search, page],
    queryFn: () =>
      api<PageResponse<PlayerSummary>>(
        `/api/players?search=${encodeURIComponent(search)}&page=${page}&size=20`,
      ),
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Players</h2>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder="Search players..."
          className="mt-4 w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
      </div>
      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="grid gap-3">
            {data?.content.map((player) => (
              <Link
                key={player.id}
                to={`/players/${player.id}`}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-orange-300 hover:shadow"
              >
                <PlayerHeadshot
                  playerId={player.id}
                  name={player.fullName}
                  className="h-14 w-14"
                />
                <div>
                  <p className="font-medium text-gray-900">{player.fullName}</p>
                  <p className="text-sm text-gray-500">
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
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!data || page >= data.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}

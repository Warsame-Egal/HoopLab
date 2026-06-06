import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import { api, type PageResponse, type PlayerSummary, type TeamSummary } from '../lib/api'
import { TeamLogo } from './TeamLogo'

type SearchResult = {
  type: 'team' | 'player'
  id: number
  label: string
  sub?: string
  abbr?: string | null
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const { data: teams } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: () => api<TeamSummary[]>('/api/teams'),
    enabled: open,
    staleTime: 60_000,
  })

  const { data: playersPage } = useQuery({
    queryKey: ['players', 'search', query],
    queryFn: () => api<PageResponse<PlayerSummary>>(`/api/players?search=${encodeURIComponent(query)}&size=12`),
    enabled: open && query.length >= 2,
  })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out: SearchResult[] = []
    if (!q) return out
    for (const team of teams ?? []) {
      if (
        team.fullName.toLowerCase().includes(q) ||
        team.abbreviation.toLowerCase().includes(q) ||
        team.name.toLowerCase().includes(q)
      ) {
        out.push({ type: 'team', id: team.id, label: team.fullName, abbr: team.abbreviation })
      }
    }
    for (const player of playersPage?.content ?? []) {
      out.push({
        type: 'player',
        id: player.id,
        label: player.fullName,
        sub: player.teamAbbreviation ?? undefined,
      })
    }
    return out.slice(0, 12)
  }, [query, teams, playersPage])

  const handleClose = useCallback(() => {
    setQuery('')
    onClose()
  }, [onClose])

  const select = useCallback(
    (r: SearchResult) => {
      navigate(r.type === 'team' ? `/teams/${r.id}` : `/players/${r.id}`)
      handleClose()
    },
    [navigate, handleClose],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center bg-foreground/40 p-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams and players…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-2">
          {query.length < 2 ? (
            <li className="px-4 py-6 text-center text-xs text-muted-foreground">
              Type at least 2 characters to search players
            </li>
          ) : results.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-muted-foreground">No results</li>
          ) : (
            results.map((r) => (
              <li key={`${r.type}-${r.id}`}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  onClick={() => select(r)}
                >
                  {r.type === 'team' ? (
                    <TeamLogo abbreviation={r.abbr} className="h-8 w-8" />
                  ) : (
                    <Users className="h-5 w-5 text-muted-foreground" aria-hidden />
                  )}
                  <span className="flex-1">
                    <span className="font-medium text-foreground">{r.label}</span>
                    {r.sub ? <span className="ml-2 text-xs text-muted-foreground">{r.sub}</span> : null}
                  </span>
                  <span className="text-xs uppercase text-muted-foreground">{r.type}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

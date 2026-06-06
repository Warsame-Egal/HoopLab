import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { api, type PageResponse, type PlayerSummary, type TeamSummary } from '../lib/api'
import { PlayerHeadshot } from './PlayerHeadshot'
import { TeamLogo } from './TeamLogo'

export type CompareEntity = {
  id: number
  label: string
  abbr?: string | null
}

type CompareMode = 'players' | 'teams'

type PickerResult = CompareEntity & { sub?: string }

function toPlayerEntity(p: PlayerSummary): PickerResult {
  return {
    id: p.id,
    label: p.fullName,
    abbr: p.teamAbbreviation,
    sub: p.teamAbbreviation ?? undefined,
  }
}

function toTeamEntity(t: TeamSummary): PickerResult {
  return {
    id: t.id,
    label: t.fullName,
    abbr: t.abbreviation,
  }
}

export function CompareEntityPicker({
  mode,
  value,
  onChange,
  placeholder,
  initialId,
}: {
  mode: CompareMode
  value: CompareEntity | null
  onChange: (entity: CompareEntity | null) => void
  placeholder: string
  initialId?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 300)
  const containerRef = useRef<HTMLDivElement>(null)

  const numericInitialId = initialId?.trim() ? Number(initialId) : NaN

  const { data: resolvedPlayer } = useQuery({
    queryKey: ['compare-picker-resolve', 'players', numericInitialId],
    queryFn: () => api<PlayerSummary>(`/api/players/${numericInitialId}`),
    enabled: mode === 'players' && Number.isFinite(numericInitialId) && value == null,
  })

  const { data: resolvedTeam } = useQuery({
    queryKey: ['compare-picker-resolve', 'teams', numericInitialId],
    queryFn: () => api<TeamSummary>(`/api/teams/${numericInitialId}`),
    enabled: mode === 'teams' && Number.isFinite(numericInitialId) && value == null,
  })

  useEffect(() => {
    if (value != null) return
    if (mode === 'players' && resolvedPlayer) onChange(toPlayerEntity(resolvedPlayer))
    if (mode === 'teams' && resolvedTeam) onChange(toTeamEntity(resolvedTeam))
  }, [resolvedPlayer, resolvedTeam, value, mode, onChange])

  const { data: teams } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: () => api<TeamSummary[]>('/api/teams'),
    enabled: mode === 'teams' && open,
    staleTime: 60_000,
  })

  const { data: playersPage } = useQuery({
    queryKey: ['players', 'compare-picker', debouncedQuery],
    queryFn: () =>
      api<PageResponse<PlayerSummary>>(
        `/api/players?search=${encodeURIComponent(debouncedQuery)}&size=10`,
      ),
    enabled: mode === 'players' && open && debouncedQuery.length >= 2,
  })

  const results = useMemo((): PickerResult[] => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return []
    if (mode === 'teams') {
      return (teams ?? [])
        .filter(
          (team) =>
            team.fullName.toLowerCase().includes(q) ||
            team.abbreviation.toLowerCase().includes(q) ||
            team.name.toLowerCase().includes(q) ||
            team.city.toLowerCase().includes(q),
        )
        .map(toTeamEntity)
        .slice(0, 10)
    }
    return (playersPage?.content ?? []).map(toPlayerEntity)
  }, [mode, debouncedQuery, teams, playersPage])

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const showDropdown = open && !value && query.length >= (mode === 'players' ? 2 : 1)

  const select = (entity: PickerResult) => {
    onChange(entity)
    setQuery('')
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
    setQuery('')
    setOpen(true)
  }

  if (value) {
    return (
      <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
        {mode === 'players' ? (
          <PlayerHeadshot playerId={value.id} name={value.label} className="h-8 w-8 shrink-0" />
        ) : (
          <TeamLogo abbreviation={value.abbr} className="h-8 w-8 shrink-0" />
        )}
        <span className="min-w-0 flex-1 truncate font-medium text-foreground">{value.label}</span>
        <button
          type="button"
          onClick={clear}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          aria-label={`Clear ${placeholder}`}
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative min-w-[200px] flex-1">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      {showDropdown ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-lg"
        >
          {mode === 'players' && debouncedQuery.length < 2 ? (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground">
              Type at least 2 characters
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground">No results</li>
          ) : (
            results.map((r) => (
              <li key={r.id} role="option">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(r)}
                >
                  {mode === 'players' ? (
                    <PlayerHeadshot playerId={r.id} name={r.label} className="h-8 w-8 shrink-0" />
                  ) : (
                    <TeamLogo abbreviation={r.abbr} className="h-8 w-8 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-foreground">{r.label}</span>
                    {r.sub ? (
                      <span className="ml-2 text-xs text-muted-foreground">{r.sub}</span>
                    ) : null}
                  </span>
                  {mode === 'players' ? (
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}

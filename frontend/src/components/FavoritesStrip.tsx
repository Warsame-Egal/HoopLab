import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, type PlayerSummary, type TeamSummary } from '../lib/api'
import { getFavoritePlayerIds, getFavoriteTeamIds } from '../lib/favorites'
import { useSeason } from '../lib/useSeason'
import { TeamLogo } from './TeamLogo'

export function FavoritesStrip({ enabled = true }: { enabled?: boolean }) {
  const { season } = useSeason()
  const teamIds = getFavoriteTeamIds()
  const playerIds = getFavoritePlayerIds()

  const { data: teams } = useQuery({
    queryKey: ['teams', season],
    queryFn: () => api<TeamSummary[]>(`/api/teams?season=${season}`),
    enabled: enabled && teamIds.length > 0,
    retry: 1,
  })

  const { data: players } = useQuery({
    queryKey: ['players', season],
    queryFn: () => api<PlayerSummary[]>(`/api/players?season=${season}`),
    enabled: enabled && playerIds.length > 0,
    retry: 1,
  })

  const favTeams = teams?.filter((t) => teamIds.includes(t.id)) ?? []
  const favPlayers = players?.filter((p) => playerIds.includes(p.id)) ?? []

  if (favTeams.length === 0 && favPlayers.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <Star className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
      <span className="text-xs font-medium text-muted-foreground">Favorites</span>
      {favTeams.map((t) => (
        <Link
          key={t.id}
          to={`/teams/${t.id}`}
          className="flex items-center gap-1 rounded-md bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
        >
          <TeamLogo abbreviation={t.abbreviation} className="h-4 w-4" />
          {t.abbreviation}
        </Link>
      ))}
      {favPlayers.map((p) => (
        <Link
          key={p.id}
          to={`/players/${p.id}`}
          className="rounded-md bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
        >
          {p.fullName}
        </Link>
      ))}
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { PlayerHeadshot } from '../components/PlayerHeadshot'
import { ShotChart } from '../components/ShotChart'
import { TrendChart } from '../components/TrendChart'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  api,
  type CareerSeason,
  type PlayerProfile,
  type PlayerSeasonStats,
  type PlayerSummary,
  type Shot,
} from '../lib/api'
import { currentSeason } from '../lib/utils'

function BioChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function draftLabel(profile: PlayerProfile): string {
  if (!profile.draftYear) return 'Undrafted'
  if (profile.draftRound && profile.draftNumber) {
    return `${profile.draftYear} · R${profile.draftRound} P${profile.draftNumber}`
  }
  return String(profile.draftYear)
}

export function PlayerDetailPage() {
  const { id } = useParams()
  const playerId = Number(id)
  const season = currentSeason()

  const playerQuery = useQuery({
    queryKey: ['player', playerId],
    queryFn: () => api<PlayerSummary>(`/api/players/${playerId}`),
    enabled: Number.isFinite(playerId),
  })

  const profileQuery = useQuery({
    queryKey: ['player-profile', playerId],
    queryFn: () => api<PlayerProfile>(`/api/players/${playerId}/profile`),
    enabled: Number.isFinite(playerId),
  })

  const seasonsQuery = useQuery({
    queryKey: ['player-seasons', playerId],
    queryFn: () => api<PlayerSeasonStats[]>(`/api/players/${playerId}/seasons`),
    enabled: Number.isFinite(playerId),
  })

  const careerQuery = useQuery({
    queryKey: ['player-career', playerId],
    queryFn: () => api<CareerSeason[]>(`/api/players/${playerId}/career`),
    enabled: Number.isFinite(playerId),
  })

  const shotsQuery = useQuery({
    queryKey: ['player-shots', playerId, season],
    queryFn: () => api<Shot[]>(`/api/players/${playerId}/shotchart?season=${season}`),
    enabled: Number.isFinite(playerId),
  })

  const player = playerQuery.data
  const profile = profileQuery.data

  if (playerQuery.isLoading) {
    return <p className="text-gray-500">Loading player...</p>
  }
  if (!player) {
    return <p className="text-red-600">Player not found</p>
  }

  const bio: { label: string; value: string }[] = []
  if (profile?.height) bio.push({ label: 'Height', value: profile.height.replace('-', "'") + '"' })
  if (profile?.weight) bio.push({ label: 'Weight', value: `${profile.weight} lb` })
  if (profile) bio.push({ label: 'Draft', value: draftLabel(profile) })
  if (profile?.seasonExp != null) bio.push({ label: 'Experience', value: `${profile.seasonExp} yr` })
  if (profile?.country) bio.push({ label: 'Country', value: profile.country })

  const career = careerQuery.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <PlayerHeadshot
          playerId={player.id}
          name={player.fullName}
          className="h-24 w-24"
        />
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{player.fullName}</h2>
          <p className="text-gray-500">
            {profile?.jersey ? `#${profile.jersey} · ` : ''}
            {player.position || profile?.position || '—'} · {player.teamAbbreviation ?? profile?.teamAbbreviation ?? 'Free Agent'}
          </p>
        </div>
      </div>

      {bio.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {bio.map((b) => (
            <BioChip key={b.label} label={b.label} value={b.value} />
          ))}
        </div>
      ) : null}

      {seasonsQuery.data && seasonsQuery.data.length > 0 ? (
        <TrendChart seasons={seasonsQuery.data} />
      ) : null}
      {shotsQuery.data && shotsQuery.data.length > 0 ? (
        <ShotChart shots={shotsQuery.data} />
      ) : (
        <p className="text-sm text-gray-400">Shot chart loads on first visit once game data is ingested.</p>
      )}

      {career.length > 0 ? (
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-gray-900">Career (per game)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Season</th>
                    <th className="px-3 py-2 font-medium">Team</th>
                    <th className="px-3 py-2 font-medium">GP</th>
                    <th className="px-3 py-2 font-medium">PTS</th>
                    <th className="px-3 py-2 font-medium">REB</th>
                    <th className="px-3 py-2 font-medium">AST</th>
                    <th className="px-3 py-2 font-medium">FG%</th>
                    <th className="px-3 py-2 font-medium">3P%</th>
                    <th className="px-3 py-2 font-medium">FT%</th>
                  </tr>
                </thead>
                <tbody>
                  {career.map((row, i) => (
                    <tr key={`${row.season}-${row.teamAbbreviation}-${i}`} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2 font-medium text-gray-900">{row.season}</td>
                      <td className="px-3 py-2 text-gray-700">{row.teamAbbreviation ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.gp ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.pts?.toFixed(1) ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.reb?.toFixed(1) ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.ast?.toFixed(1) ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.fgPct != null ? (row.fgPct * 100).toFixed(1) : '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.fg3Pct != null ? (row.fg3Pct * 100).toFixed(1) : '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{row.ftPct != null ? (row.ftPct * 100).toFixed(1) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-gray-900">Season Stats</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Season</th>
                  <th className="px-3 py-2 font-medium">GP</th>
                  <th className="px-3 py-2 font-medium">PTS</th>
                  <th className="px-3 py-2 font-medium">REB</th>
                  <th className="px-3 py-2 font-medium">AST</th>
                  <th className="px-3 py-2 font-medium">TS%</th>
                </tr>
              </thead>
              <tbody>
                {seasonsQuery.data?.map((row) => (
                  <tr key={row.season} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2 font-medium text-gray-900">{row.season}</td>
                    <td className="px-3 py-2 text-gray-700">{row.gp}</td>
                    <td className="px-3 py-2 text-gray-700">{row.pts?.toFixed(1)}</td>
                    <td className="px-3 py-2 text-gray-700">{row.reb?.toFixed(1)}</td>
                    <td className="px-3 py-2 text-gray-700">{row.ast?.toFixed(1)}</td>
                    <td className="px-3 py-2 text-gray-700">{row.tsPct ? (row.tsPct * 100).toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

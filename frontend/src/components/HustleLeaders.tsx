import { Shield } from 'lucide-react'
import { LeagueRecordsPanel } from './LeagueRecordsPanel'
import { useSeason } from '../lib/useSeason'

export function HustleLeaders({ enabled = true }: { enabled?: boolean }) {
  const { season } = useSeason()
  return (
    <LeagueRecordsPanel
      enabled={enabled}
      compact
      limit={3}
      title="Hustle leaders"
      sublabel="Deflections"
      icon={Shield}
      queryKey={['league', 'hustle', season]}
      path={`/api/league/hustle?season=${season}&entity=player`}
      config={{
        nameKeys: ['PLAYER_NAME', 'PLAYER'],
        subKeys: ['TEAM_ABBREVIATION', 'TEAM_NAME'],
        valueKey: 'DEFLECTIONS',
        link: (row) => {
          const id = row.PLAYER_ID ?? row.PLAYERID
          return id != null ? `/players/${id}` : null
        },
      }}
    />
  )
}

import { Users } from 'lucide-react'
import { LeagueRecordsPanel } from './LeagueRecordsPanel'
import { useSeason } from '../lib/useSeason'

export function TopLineups({ enabled = true }: { enabled?: boolean }) {
  const { season } = useSeason()
  return (
    <LeagueRecordsPanel
      enabled={enabled}
      title="Top 5-man lineups"
      sublabel="Net rating"
      icon={Users}
      queryKey={['league', 'lineups', season]}
      path={`/api/league/lineups?season=${season}`}
      config={{
        nameKeys: ['GROUP_NAME'],
        valueKey: 'NET_RATING',
        valueFormat: (v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)),
      }}
      limit={5}
    />
  )
}

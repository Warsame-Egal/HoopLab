import { GamesToWatch } from './GamesToWatch'
import { HustleLeaders } from './HustleLeaders'
import { LeagueLeadersSpotlight } from './LeagueLeadersSpotlight'
import { PlayTypePanel } from './PlayTypePanel'
import { PlayoffPictureMini } from './PlayoffPictureMini'
import { TopLineups } from './TopLineups'
import { TopPerformersTonight } from './TopPerformersTonight'
import { StandingsMini } from './StandingsMini'
import { Skeleton } from './ui/Skeleton'
import type { Game } from '../types/scoreboard'

type PanelProps = {
  enabled: boolean
  liveGames: Game[]
  selectedTeamId: number | null
}

function PanelSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
      <p className="text-xs text-muted-foreground">Loading panels…</p>
    </div>
  )
}

export function OverviewLiveSection({ enabled, liveGames }: Pick<PanelProps, 'enabled' | 'liveGames'>) {
  if (!enabled) return <PanelSkeleton rows={3} />

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <GamesToWatch games={liveGames} />
      <TopPerformersTonight games={liveGames} />
    </div>
  )
}

export function OverviewLeagueAside({ enabled }: Pick<PanelProps, 'enabled'>) {
  if (!enabled) return <PanelSkeleton rows={2} />

  return (
    <div className="space-y-4">
      <LeagueLeadersSpotlight enabled />
      <StandingsMini enabled />
    </div>
  )
}

export function OverviewLeagueStatsGrid({ enabled, selectedTeamId }: Pick<PanelProps, 'enabled' | 'selectedTeamId'>) {
  if (!enabled) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <HustleLeaders enabled />
        <TopLineups enabled />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PlayoffPictureMini enabled />
        <PlayTypePanel teamId={selectedTeamId} />
      </div>
    </div>
  )
}

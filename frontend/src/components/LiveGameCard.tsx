import { Link } from 'react-router-dom'
import { PlayerHeadshot } from './PlayerHeadshot'
import { TeamLogo } from './TeamLogo'
import { Card, CardContent } from './ui/card'
import { cn } from '../lib/utils'
import type { Game } from '../types/scoreboard'
import { formatLiveClock, getGameStatus, isClutchGame } from '../types/scoreboard'

type LiveGameCardProps = {
  game: Game
  compact?: boolean
  recentlyUpdated?: boolean
  lastUpdatedAt?: number | null
}

function formatAgo(ms: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  return sec < 60 ? `${sec}s ago` : `${Math.floor(sec / 60)}m ago`
}

function LeadersStrip({ game }: { game: Game }) {
  const leaders = game.gameLeaders
  if (!leaders) return null

  const categories = [
    { key: 'points' as const, label: 'PTS' },
    { key: 'rebounds' as const, label: 'REB' },
    { key: 'assists' as const, label: 'AST' },
  ]

  return (
    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
      {categories.map(({ key, label }) => {
        const home = leaders.homeLeaders
        const away = leaders.awayLeaders
        const homeVal = home?.[key] ?? 0
        const awayVal = away?.[key] ?? 0
        const leader = homeVal >= awayVal ? home : away
        const value = Math.max(homeVal, awayVal)
        if (!leader || value === 0) {
          return (
            <div key={key} className="text-center text-[10px] text-muted-foreground">
              {label} —
            </div>
          )
        }
        return (
          <div key={key} className="min-w-0 text-center">
            <p className="text-[10px] font-medium uppercase text-muted-foreground">{label}</p>
            <div className="mt-0.5 flex flex-col items-center gap-0.5">
              <PlayerHeadshot playerId={leader.personId} name={leader.name} className="h-6 w-6" />
              <p className="truncate text-[10px] font-medium text-foreground">{leader.name.split(' ').pop()}</p>
              <p className="text-xs font-bold tabular-nums text-foreground">{value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function LiveGameCard({
  game,
  compact = false,
  recentlyUpdated = false,
  lastUpdatedAt = null,
}: LiveGameCardProps) {
  const status = getGameStatus(game)
  const isLive = status === 'live'
  const clutch = isClutchGame(game)
  const isFinal = status === 'completed'
  const isUpcoming = status === 'upcoming'
  const homeScore = game.homeTeam.score ?? 0
  const awayScore = game.awayTeam.score ?? 0
  const homeWon = homeScore > awayScore
  const awayWon = awayScore > homeScore

  const content = (
    <Card
      className={cn(
        'transition-all duration-300',
        isLive && 'border-live/40 bg-live/5 shadow-sm',
        clutch && 'ring-1 ring-live/60',
        isUpcoming && 'opacity-90',
        recentlyUpdated && 'ring-2 ring-brand ring-offset-2 ring-offset-card',
        !compact && !isUpcoming && 'hover:border-brand/50',
      )}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-live">
                  {clutch ? 'Clutch' : 'Live'}
                </span>
              </>
            ) : isFinal ? (
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Final</span>
            ) : (
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Scheduled</span>
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {isLive ? formatLiveClock(game) : game.gameStatusText || 'TBD'}
            {isLive && lastUpdatedAt ? (
              <span className="ml-2 hidden text-[10px] sm:inline">· updated {formatAgo(lastUpdatedAt)}</span>
            ) : null}
          </span>
        </div>

        <div className="space-y-2">
          <TeamRow
            teamId={game.awayTeam.teamId}
            tricode={game.awayTeam.teamTricode}
            name={compact ? game.awayTeam.teamTricode : `${game.awayTeam.teamCity} ${game.awayTeam.teamName}`}
            score={awayScore}
            showScore={!isUpcoming}
            won={isFinal && awayWon}
            lost={isFinal && homeWon}
            compact={compact}
          />
          <TeamRow
            teamId={game.homeTeam.teamId}
            tricode={game.homeTeam.teamTricode}
            name={compact ? game.homeTeam.teamTricode : `${game.homeTeam.teamCity} ${game.homeTeam.teamName}`}
            score={homeScore}
            showScore={!isUpcoming}
            won={isFinal && homeWon}
            lost={isFinal && awayWon}
            compact={compact}
          />
        </div>

        {!compact && !isUpcoming ? <LeadersStrip game={game} /> : null}
      </CardContent>
    </Card>
  )

  if (isUpcoming) return content

  return (
    <Link to={`/games/${game.gameId}`} className="block">
      {content}
    </Link>
  )
}

function TeamRow({
  teamId,
  tricode,
  name,
  score,
  showScore,
  won,
  lost,
  compact,
}: {
  teamId: number
  tricode: string
  name: string
  score: number
  showScore: boolean
  won: boolean
  lost: boolean
  compact: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Link to={`/teams/${teamId}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
        <TeamLogo abbreviation={tricode} teamId={teamId} className={cn(compact ? 'h-6 w-6' : 'h-8 w-8')} />
      </Link>
      <Link
        to={`/teams/${teamId}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'min-w-0 flex-1 truncate text-sm hover:text-brand',
          won && 'font-bold text-foreground',
          lost && 'font-medium text-muted-foreground',
          !won && !lost && 'font-semibold text-foreground',
        )}
      >
        {name}
      </Link>
      {showScore && (
        <span
          className={cn(
            'tabular-nums font-bold',
            compact ? 'text-lg' : 'text-xl',
            won ? 'text-foreground' : lost ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {score}
        </span>
      )}
    </div>
  )
}

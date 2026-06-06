import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Radio } from 'lucide-react'
import { LiveGameCard } from '../components/LiveGameCard'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { useLiveScoreboard } from '../hooks/useLiveScoreboard'
import { ConnectionIndicator } from '../components/ConnectionIndicator'
import { FavoritesStrip } from '../components/FavoritesStrip'
import { useLiveNotifications } from '../hooks/useLiveNotifications'
import { useSeason } from '../lib/useSeason'
import { getGameStatus, isClutchGame, type Game } from '../types/scoreboard'

type Filter = 'all' | 'live' | 'close' | 'blowout' | 'overtime' | 'clutch'

function applyFilter(games: Game[], filter: Filter): Game[] {
  if (filter === 'all') return games
  if (filter === 'live') return games.filter((g) => getGameStatus(g) === 'live')
  if (filter === 'clutch') return games.filter((g) => isClutchGame(g))
  return games.filter((game) => {
    const home = game.homeTeam.score ?? 0
    const away = game.awayTeam.score ?? 0
    const diff = Math.abs(home - away)
    const status = game.gameStatusText.toLowerCase()
    switch (filter) {
      case 'close':
        return diff <= 10 && (home > 0 || away > 0)
      case 'blowout':
        return diff >= 20 && (home > 0 || away > 0)
      case 'overtime':
        return status.includes('ot') || status.includes('overtime')
      default:
        return true
    }
  })
}

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All Games',
  live: 'Live',
  close: 'Close',
  blowout: 'Blowout',
  overtime: 'OT',
  clutch: 'Clutch Now',
}

export function ScoreboardPage() {
  const { season } = useSeason()
  const {
    games,
    liveCount,
    isLoading,
    recentlyUpdated,
    lastUpdatedAt,
    connectionStatus,
    gameDate,
    selectedDate,
    setDate,
    goPrev,
    goNext,
    goToday,
    isToday,
    seasonMin,
    seasonMax,
  } = useLiveScoreboard(undefined, { season })
  const [filter, setFilter] = useState<Filter>('all')
  useLiveNotifications(games, isToday)

  const { liveGames, upcomingGames, completedGames } = useMemo(() => ({
    liveGames: games.filter((g) => getGameStatus(g) === 'live'),
    upcomingGames: games.filter((g) => getGameStatus(g) === 'upcoming'),
    completedGames: games.filter((g) => getGameStatus(g) === 'completed'),
  }), [games])

  const allFiltered = useMemo(() => applyFilter(games, filter), [games, filter])
  const filteredLive = useMemo(() => applyFilter(liveGames, filter === 'live' ? 'live' : filter), [liveGames, filter])
  const filteredUpcoming = useMemo(() => applyFilter(upcomingGames, filter), [upcomingGames, filter])
  const filteredCompleted = useMemo(() => applyFilter(completedGames, filter), [completedGames, filter])

  const closeCount = useMemo(() => applyFilter(games, 'close').length, [games])
  const blowoutCount = useMemo(() => applyFilter(games, 'blowout').length, [games])
  const otCount = useMemo(() => applyFilter(games, 'overtime').length, [games])
  const clutchCount = useMemo(() => applyFilter(games, 'clutch').length, [games])

  const filterCounts: Record<Filter, number> = {
    all: games.length,
    live: liveCount,
    close: closeCount,
    blowout: blowoutCount,
    overtime: otCount,
    clutch: clutchCount,
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `All Games (${filterCounts.all})` },
    { key: 'live', label: `Live (${filterCounts.live})` },
    { key: 'close', label: `Close (${filterCounts.close})` },
    { key: 'blowout', label: `Blowout (${filterCounts.blowout})` },
    { key: 'overtime', label: `OT (${filterCounts.overtime})` },
    { key: 'clutch', label: `Clutch Now (${filterCounts.clutch})` },
  ]

  const emptyFilterMessage = `No ${FILTER_LABELS[filter].toLowerCase()} games on this date.`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Radio size={22} className="text-brand" />
            Scoreboard
          </h2>
          <p className="text-sm text-muted-foreground">
            {isToday ? "Today's games" : `Games for ${gameDate}`}
            <span className="text-muted-foreground"> · {season}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-lg border border-border px-2 py-1.5 text-sm text-foreground hover:bg-muted"
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={selectedDate}
            min={seasonMin}
            max={seasonMax}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
            aria-label="Game date"
          />
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg border border-border px-2 py-1.5 text-sm text-foreground hover:bg-muted"
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground"
            >
              Today
            </button>
          )}
        </div>
        {isToday && liveCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-live/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
            </span>
            <span className="text-sm font-semibold text-live">{liveCount} live</span>
          </div>
        )}
        {isToday ? (
          <ConnectionIndicator status={connectionStatus} lastUpdatedAt={lastUpdatedAt} />
        ) : null}
      </div>

      <FavoritesStrip />

      <SegmentedControl options={filters} value={filter} onChange={(key) => setFilter(key as Filter)} />

      {isLoading && games.length === 0 ? (
        <div className="grid min-h-[40vh] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          className="min-h-[40vh]"
          icon={Radio}
          title="No games on this date"
          description="Try another date within the season."
        />
      ) : filter !== 'all' && allFiltered.length === 0 ? (
        <EmptyState className="min-h-[32vh]" icon={Radio} title="No matching games" description={emptyFilterMessage} />
      ) : !isToday ? (
        <section className="space-y-4">
          <SectionHeader title="Completed" />
          {filteredCompleted.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyFilterMessage}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompleted.map((game) => (
                <LiveGameCard key={game.gameId} game={game} />
              ))}
            </div>
          )}
        </section>
      ) : filter === 'live' ? (
        <section className="space-y-4">
          <SectionHeader title="Live" live />
          {filteredLive.length === 0 ? (
            <EmptyState title="No live games" description="No games are live right now." className="min-h-[24vh]" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLive.map((game) => (
                <LiveGameCard
                  key={game.gameId}
                  game={game}
                  recentlyUpdated={recentlyUpdated.has(game.gameId)}
                  lastUpdatedAt={lastUpdatedAt}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="space-y-4">
            <SectionHeader title="Live" live />
            {filteredLive.length === 0 ? (
              <p className="text-sm text-muted-foreground">No live games right now.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {filteredLive.map((game) => (
                  <LiveGameCard
                    key={game.gameId}
                    game={game}
                    recentlyUpdated={recentlyUpdated.has(game.gameId)}
                    lastUpdatedAt={lastUpdatedAt}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="space-y-8">
            <section className="space-y-4">
              <SectionHeader title="Upcoming" />
              {filteredUpcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming games.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredUpcoming.map((game) => (
                    <LiveGameCard key={game.gameId} game={game} />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <SectionHeader title="Completed" />
              {filteredCompleted.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed games yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredCompleted.map((game) => (
                    <LiveGameCard
                      key={game.gameId}
                      game={game}
                      recentlyUpdated={recentlyUpdated.has(game.gameId)}
                      lastUpdatedAt={lastUpdatedAt}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, live = false }: { title: string; live?: boolean }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
      {live && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
        </span>
      )}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
    </div>
  )
}

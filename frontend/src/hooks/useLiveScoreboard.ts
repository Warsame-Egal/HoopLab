import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import {
  subscribeScoreboard,
  subscribeScoreboardStatus,
  unsubscribeScoreboard,
  unsubscribeScoreboardStatus,
  type WsConnectionStatus,
} from '../lib/ws'
import {
  clampToSeasonDate,
  defaultScoreboardDateForSeason,
  isDateInSeason,
  isNbaToday,
  nbaTodayIso,
  seasonEndDate,
  seasonStartDate,
  shiftNbaDate,
} from '../lib/nbaDate'
import { getGameStatus, type Game, type ScoreboardResponse } from '../types/scoreboard'

function mergeScoreboard(prev: Game[], incoming: Game[]): Game[] {
  const map = new Map(prev.map((g) => [g.gameId, g]))
  for (const game of incoming) {
    map.set(game.gameId, game)
  }
  return Array.from(map.values())
}

type UseLiveScoreboardOptions = {
  /** When false, skips REST + WebSocket (default true). */
  enabled?: boolean
  /** Subscribe to live WebSocket fan-out (default: same as enabled). */
  enableWebSocket?: boolean
  /** Global season — constrains date stepper and re-seeds on change. */
  season?: string
}

export function useLiveScoreboard(initialDate?: string, options: UseLiveScoreboardOptions = {}) {
  const enabled = options.enabled ?? true
  const enableWebSocket = options.enableWebSocket ?? enabled
  const season = options.season

  const [gameDate, setGameDateState] = useState(() => {
    if (initialDate) return initialDate
    if (season) return defaultScoreboardDateForSeason(season)
    return nbaTodayIso()
  })

  const prevSeasonRef = useRef(season)
  useEffect(() => {
    if (!season || season === prevSeasonRef.current) return
    prevSeasonRef.current = season
    setGameDateState(defaultScoreboardDateForSeason(season))
  }, [season])

  const setDate = useCallback(
    (next: string) => {
      const clamped = season ? clampToSeasonDate(next, season) : next
      setGameDateState(clamped)
    },
    [season],
  )

  const isToday = isNbaToday(gameDate)
  const [liveGames, setLiveGames] = useState<Game[] | null>(null)
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set())
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<WsConnectionStatus>('idle')
  const previousScores = useRef<Map<string, { home: number; away: number }>>(new Map())

  const scoreboardPath = `/api/scoreboard?date=${encodeURIComponent(gameDate)}`

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['scoreboard', gameDate],
    queryFn: () => api<ScoreboardResponse>(scoreboardPath),
    enabled,
    staleTime: isToday ? 5_000 : 60_000 * 60,
    retry: 1,
  })

  const games = useMemo(() => {
    const rest = data?.scoreboard?.games ?? []
    if (!isToday) {
      return rest
    }
    if (liveGames == null) {
      return rest
    }
    return liveGames.length > 0 ? liveGames : rest
  }, [isToday, liveGames, data?.scoreboard?.games])

  useEffect(() => {
    previousScores.current.clear()
    if (!isToday || !enableWebSocket) {
      return
    }

    const onUpdate = (payload: ScoreboardResponse) => {
      const incoming = payload?.scoreboard?.games
      if (!Array.isArray(incoming) || incoming.length === 0) return

      const updatedIds = new Set<string>()
      for (const game of incoming) {
        const home = game.homeTeam?.score ?? 0
        const away = game.awayTeam?.score ?? 0
        const prev = previousScores.current.get(game.gameId)
        if (!prev || prev.home !== home || prev.away !== away) {
          updatedIds.add(game.gameId)
        }
        previousScores.current.set(game.gameId, { home, away })
      }

      setLiveGames((prevGames) =>
        mergeScoreboard(prevGames ?? data?.scoreboard?.games ?? [], incoming),
      )
      setLastUpdatedAt(Date.now())

      if (updatedIds.size > 0) {
        setRecentlyUpdated(updatedIds)
        window.setTimeout(() => {
          setRecentlyUpdated((prev) => {
            const next = new Set(prev)
            updatedIds.forEach((id) => next.delete(id))
            return next
          })
        }, 2000)
      }
    }

    subscribeScoreboard(onUpdate)
    subscribeScoreboardStatus(setConnectionStatus)
    return () => {
      unsubscribeScoreboard(onUpdate)
      unsubscribeScoreboardStatus(setConnectionStatus)
    }
  }, [isToday, gameDate, data?.scoreboard?.games, enableWebSocket])

  const goPrev = useCallback(() => {
    setGameDateState((d) => {
      const next = shiftNbaDate(d, -1)
      if (season && !isDateInSeason(next, season)) return seasonStartDate(season)
      return next
    })
  }, [season])

  const goNext = useCallback(() => {
    setGameDateState((d) => {
      const next = shiftNbaDate(d, 1)
      if (season && !isDateInSeason(next, season)) return seasonEndDate(season)
      return next
    })
  }, [season])

  const goToday = useCallback(() => {
    if (season) {
      setGameDateState(defaultScoreboardDateForSeason(season))
    } else {
      setGameDateState(nbaTodayIso())
    }
  }, [season])

  const displayDate = gameDate

  const liveCount = useMemo(
    () => games.filter((g) => getGameStatus(g) === 'live').length,
    [games],
  )

  const seasonMin = season ? seasonStartDate(season) : undefined
  const seasonMax = season ? seasonEndDate(season) : undefined

  return {
    games,
    gameDate: displayDate,
    selectedDate: gameDate,
    setDate,
    goPrev,
    goNext,
    goToday,
    isToday,
    isLoading,
    isError,
    refetch,
    recentlyUpdated,
    liveCount,
    lastUpdatedAt,
    connectionStatus: isToday ? connectionStatus : ('idle' as WsConnectionStatus),
    seasonMin,
    seasonMax,
  }
}

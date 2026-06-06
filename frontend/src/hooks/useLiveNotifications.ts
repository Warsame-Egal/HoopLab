import { useEffect, useRef } from 'react'
import type { Game } from '../types/scoreboard'
import { getGameStatus, isClutchGame } from '../types/scoreboard'
import { areLiveNotificationsEnabled, getFavoriteTeamIds } from '../lib/favorites'

function favoriteTeamInGame(game: Game, favorites: number[]): boolean {
  return favorites.some(
    (id) => id === game.homeTeam.teamId || id === game.awayTeam.teamId,
  )
}

export function useLiveNotifications(games: Game[], enabled: boolean): void {
  const seen = useRef<Set<string>>(new Set())
  const prevStatus = useRef<Map<string, string>>(new Map())
  const prevClutch = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || !areLiveNotificationsEnabled()) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    const favorites = getFavoriteTeamIds()
    if (favorites.length === 0) return

    for (const game of games) {
      if (!favoriteTeamInGame(game, favorites)) continue
      const status = getGameStatus(game)
      const key = game.gameId
      const prev = prevStatus.current.get(key)

      if (status === 'live' && prev !== 'live' && !seen.current.has(`${key}-start`)) {
        seen.current.add(`${key}-start`)
        new Notification('Game on', {
          body: `${game.awayTeam.teamTricode} @ ${game.homeTeam.teamTricode} is live`,
          tag: `${key}-start`,
        })
      }

      if (status === 'completed' && prev === 'live' && !seen.current.has(`${key}-final`)) {
        seen.current.add(`${key}-final`)
        new Notification('Final', {
          body: `${game.awayTeam.teamTricode} ${game.awayTeam.score} – ${game.homeTeam.teamTricode} ${game.homeTeam.score}`,
          tag: `${key}-final`,
        })
      }

      if (isClutchGame(game) && !prevClutch.current.has(key)) {
        prevClutch.current.add(key)
        new Notification('Clutch time', {
          body: `${game.awayTeam.teamTricode} ${game.awayTeam.score} – ${game.homeTeam.teamTricode} ${game.homeTeam.score} (${game.gameStatusText})`,
          tag: `${key}-clutch`,
        })
      }

      prevStatus.current.set(key, status)
    }
  }, [games, enabled])
}

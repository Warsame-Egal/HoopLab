const TEAMS_KEY = 'hooplab.favoriteTeams'
const PLAYERS_KEY = 'hooplab.favoritePlayers'
const NOTIFY_KEY = 'hooplab.liveNotifications'

function readIds(key: string): number[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is number => typeof id === 'number')
  } catch {
    return []
  }
}

function writeIds(key: string, ids: number[]): void {
  localStorage.setItem(key, JSON.stringify([...new Set(ids)]))
}

export function getFavoriteTeamIds(): number[] {
  return readIds(TEAMS_KEY)
}

export function getFavoritePlayerIds(): number[] {
  return readIds(PLAYERS_KEY)
}

export function isFavoriteTeam(teamId: number): boolean {
  return getFavoriteTeamIds().includes(teamId)
}

export function isFavoritePlayer(playerId: number): boolean {
  return getFavoritePlayerIds().includes(playerId)
}

export function toggleFavoriteTeam(teamId: number): boolean {
  const ids = getFavoriteTeamIds()
  const next = ids.includes(teamId) ? ids.filter((id) => id !== teamId) : [...ids, teamId]
  writeIds(TEAMS_KEY, next)
  return next.includes(teamId)
}

export function toggleFavoritePlayer(playerId: number): boolean {
  const ids = getFavoritePlayerIds()
  const next = ids.includes(playerId) ? ids.filter((id) => id !== playerId) : [...ids, playerId]
  writeIds(PLAYERS_KEY, next)
  return next.includes(playerId)
}

export function areLiveNotificationsEnabled(): boolean {
  return localStorage.getItem(NOTIFY_KEY) === '1'
}

export function setLiveNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFY_KEY, enabled ? '1' : '0')
}

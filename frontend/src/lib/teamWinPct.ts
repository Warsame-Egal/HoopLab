import type { TeamMapPoint } from './api'

export function teamWinPct(team: Pick<TeamMapPoint, 'wins' | 'losses'>): number | null {
  const w = team.wins ?? 0
  const l = team.losses ?? 0
  const total = w + l
  if (total === 0) return null
  return Math.round((w / total) * 1000) / 10
}

export interface ScoreboardResponse {
  scoreboard: ScoreboardData
}

export interface ScoreboardData {
  gameDate: string
  games: Game[]
}

export interface Game {
  gameId: string
  gameStatus: number
  gameStatusText: string
  period: number
  gameClock: string | null
  gameTimeUTC: string
  homeTeam: TeamScore
  awayTeam: TeamScore
  gameLeaders: GameLeaders | null
}

export interface GameLeaders {
  homeLeaders: PlayerLeader | null
  awayLeaders: PlayerLeader | null
}

export interface TeamScore {
  teamId: number
  teamName: string
  teamCity: string
  teamTricode: string
  wins: number | null
  losses: number | null
  score: number | null
}

export interface PlayerLeader {
  personId: number
  name: string
  jerseyNum: string
  position: string
  teamTricode: string
  points: number
  rebounds: number
  assists: number
}

export interface BoxScoreResponse {
  game_id: string
  status: string
  home_team: TeamBoxScoreStats
  away_team: TeamBoxScoreStats
}

export interface TeamBoxScoreStats {
  team_id: number
  team_name: string
  score: number
  field_goal_pct: number
  three_point_pct: number
  free_throw_pct: number
  rebounds_total: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  players: PlayerBoxScoreStats[]
}

export interface PlayerBoxScoreStats {
  player_id: number
  name: string
  position: string
  minutes?: string
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
}

export interface PlayByPlayResponse {
  game_id: string
  plays: PlayByPlayEvent[]
}

export interface PlayByPlayEvent {
  action_number: number
  clock: string
  period: number
  team_id: number | null
  team_tricode: string | null
  action_type: string
  description: string
  player_id: number | null
  player_name: string | null
  score_home: string | null
  score_away: string | null
  shot_result: string | null
}

export type GameStatus = 'live' | 'upcoming' | 'completed'

function parseGameClockMinutes(clock: string | null): number | null {
  if (!clock) return null
  const iso = clock.match(/PT(\d+)M/)
  if (iso) return Number.parseInt(iso[1], 10)
  const mmss = clock.match(/(\d+):(\d+)/)
  if (mmss) return Number.parseInt(mmss[1], 10)
  return null
}

/** Live game in Q4+ with margin ≤5 and ≤5:00 on clock (or unknown clock in close game). */
export function isClutchGame(game: Game): boolean {
  if (getGameStatus(game) !== 'live') return false
  const period = game.period ?? 0
  if (period < 4) return false
  const home = game.homeTeam.score ?? 0
  const away = game.awayTeam.score ?? 0
  if (Math.abs(home - away) > 5) return false
  const minutes = parseGameClockMinutes(game.gameClock)
  if (minutes == null) return true
  return minutes <= 5
}

function isStatusTextLive(text: string): boolean {
  const t = text.toLowerCase()
  if (!t || t.includes('final')) return false
  if (
    t.includes('live') ||
    t.includes('in progress') ||
    t.includes('halftime') ||
    t.includes('overtime')
  ) {
    return true
  }
  if (/\bq\s*\d\b/.test(t) || /\bq\d\b/.test(t) || /\b[1-4](st|nd|rd|th)\s*q/.test(t)) {
    return true
  }
  if (t.includes(' qtr') || t.includes('quarter')) return true
  if (/\b ot\b/.test(t) || t.startsWith('ot')) return true
  return false
}

/** Game clock in status text (e.g. Q3 4:32), not a tip-off time (7:30 pm). */
function hasQuarterClockInText(text: string): boolean {
  return /\d{1,2}:\d{2}/.test(text) && !/\d{1,2}:\d{2}\s*(am|pm)/i.test(text)
}

function parseIsoGameClock(clock: string): string {
  const m = clock.match(/^PT(\d+)M(\d+(?:\.\d+)?)?S$/i)
  if (!m) return clock
  const mins = Number.parseInt(m[1], 10)
  const secs = m[2] ? Math.floor(Number.parseFloat(m[2])) : 0
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Live badge line: Q{period} {clock}, aligned with nba-scoreboard GameCard. */
export function formatLiveClock(game: Game): string {
  const period = game.period ?? 0
  const clock = game.gameClock?.trim()
  const text = game.gameStatusText?.trim()
  if (period > 0 && clock) {
    return `Q${period} ${parseIsoGameClock(clock)}`
  }
  if (text && (isStatusTextLive(text) || hasQuarterClockInText(text))) {
    return text
  }
  if (period > 0) return `Q${period}`
  return 'LIVE'
}

export function getGameStatus(game: Game): GameStatus {
  const text = (game.gameStatusText ?? '').toLowerCase()
  const status = Number(game.gameStatus)
  const period = game.period ?? 0
  const home = game.homeTeam.score ?? 0
  const away = game.awayTeam.score ?? 0

  if (status === 3 || text.includes('final')) {
    return 'completed'
  }
  if (status === 2) {
    return 'live'
  }
  if (period > 0 && !text.includes('final')) {
    return 'live'
  }
  if (isStatusTextLive(text)) {
    return 'live'
  }
  if (period > 0 && (home > 0 || away > 0)) {
    return 'live'
  }
  if ((home > 0 || away > 0) && hasQuarterClockInText(game.gameStatusText ?? '')) {
    return 'live'
  }
  return 'upcoming'
}

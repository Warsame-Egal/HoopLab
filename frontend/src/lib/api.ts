const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string
      detail?: string
      status?: number
    }
    const msg = body.message ?? body.detail ?? response.statusText
    throw new Error(msg || 'Request failed')
  }
  if (response.status === 204) {
    return undefined as T
  }
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(
      `Invalid JSON from ${path} — is the API reachable? (got HTML or empty body). Use http://localhost:5173 with Docker, or Vite dev with empty VITE_API_BASE_URL.`,
    )
  }
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PlayerSummary {
  id: number
  fullName: string
  firstName: string
  lastName: string
  position: string
  teamId: number | null
  teamAbbreviation: string | null
  active: boolean
  fromYear: number | null
  toYear: number | null
  headshotUrl: string | null
}

export interface PlayerSeasonStats {
  season: string
  teamId: number | null
  gp: number | null
  min: number | null
  pts: number | null
  reb: number | null
  ast: number | null
  stl: number | null
  blk: number | null
  tov: number | null
  fgPct: number | null
  fg3Pct: number | null
  ftPct: number | null
  tsPct: number | null
  usgPct: number | null
  plusMinus: number | null
}

export interface TeamSummary {
  id: number
  abbreviation: string
  city: string
  name: string
  fullName: string
  conference: string | null
  division: string | null
  yearFounded: number | null
}

export interface Leader {
  rank: number
  playerId: number
  playerName: string
  teamAbbreviation: string | null
  value: number
  gamesPlayed: number | null
}

export interface TeamLeader {
  rank: number
  teamId: number
  teamName: string
  abbreviation: string
  netRtg: number | null
  wins: number | null
  losses: number | null
}

export interface TrendPoint {
  season: string
  value: number | null
}

export interface Overview {
  season: string
  avgPts: number
  avgReb: number
  avgAst: number
  avgFgPct: number
  avgFg3Pct: number
  topScorers: Leader[]
  topTeams: TeamLeader[]
  leagueScoringTrend: TrendPoint[]
}

export interface TeamMapPoint {
  teamId: number
  abbreviation: string
  name: string
  fullName: string
  latitude: number | null
  longitude: number | null
  wins: number | null
  losses: number | null
  netRtg: number | null
  clutchNetRtg: number | null
  conference: string | null
}

export interface StandingRow {
  teamId: number
  abbreviation: string
  fullName: string
  conference: string | null
  division: string | null
  confRank: number | null
  divRank: number | null
  wins: number | null
  losses: number | null
  winPct: number | null
  homeRecord: string | null
  roadRecord: string | null
  lastTen: string | null
  streak: string | null
  gamesBack: number | null
  clinch: string | null
  netRtg: number | null
}

export interface GameSummary {
  gameId: string
  season: string
  gameDate: string
  homeTeamId: number | null
  awayTeamId: number | null
  homeAbbr: string | null
  awayAbbr: string | null
  homePts: number | null
  awayPts: number | null
  matchup: string | null
}

export interface ClutchRow {
  rank: number
  teamId: number
  abbreviation: string
  fullName: string
  gp: number | null
  wins: number | null
  losses: number | null
  offRtg: number | null
  defRtg: number | null
  netRtg: number | null
}

export interface Lineup {
  lineupName: string | null
  gp: number | null
  min: number | null
  offRtg: number | null
  defRtg: number | null
  netRtg: number | null
}

export interface AdvancedRow {
  teamId: number | null
  playerId: number | null
  name: string | null
  abbreviation: string | null
  values: (number | null)[]
}

export interface AdvancedBoxScore {
  gameId: string
  measure: string
  columns: string[]
  teams: AdvancedRow[]
  players: AdvancedRow[]
}

export interface RosterEntry {
  playerId: number
  fullName: string
  position: string | null
  gp: number | null
  min: number | null
  pts: number | null
  reb: number | null
  ast: number | null
  fgPct: number | null
  fg3Pct: number | null
  tsPct: number | null
  usgPct: number | null
}

export interface GameLog {
  gameId: string
  gameDate: string
  matchup: string
  wl: string | null
  min: string | null
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  tov: number
  plusMinus: number | null
}

export interface BoxScorePlayer {
  playerId: number
  name: string
  startPosition: string | null
  min: string | null
  pts: number | null
  reb: number | null
  ast: number | null
  stl: number | null
  blk: number | null
  tov: number | null
  fgm: number | null
  fga: number | null
  fg3m: number | null
  fg3a: number | null
  ftm: number | null
  fta: number | null
  plusMinus: number | null
}

export interface BoxScoreTeam {
  teamId: number
  abbreviation: string | null
  teamName: string | null
  pts: number | null
  reb: number | null
  ast: number | null
  players: BoxScorePlayer[]
}

export interface BoxScore {
  gameId: string
  teams: BoxScoreTeam[]
}

export interface RosterPlayer {
  playerId: number
  name: string
  jersey: string | null
  position: string | null
  height: string | null
  weight: string | null
  age: string | null
  exp: string | null
  school: string | null
}

export interface Coach {
  name: string
  coachType: string | null
}

export interface OfficialRoster {
  players: RosterPlayer[]
  coaches: Coach[]
}

export interface PlayerProfile {
  playerId: number
  fullName: string
  position: string | null
  teamId: number | null
  teamAbbreviation: string | null
  height: string | null
  weight: string | null
  jersey: string | null
  country: string | null
  school: string | null
  draftYear: number | null
  draftRound: string | null
  draftNumber: string | null
  seasonExp: number | null
  birthdate: string | null
  headshotUrl: string | null
}

export interface CareerSeason {
  season: string
  teamAbbreviation: string | null
  age: number | null
  gp: number | null
  min: number | null
  pts: number | null
  reb: number | null
  ast: number | null
  stl: number | null
  blk: number | null
  fgPct: number | null
  fg3Pct: number | null
  ftPct: number | null
}

export interface TeamGameLog {
  gameId: string
  gameDate: string
  matchup: string
  wl: string | null
  pts: number | null
  reb: number | null
  ast: number | null
  plusMinus: number | null
}

export interface Shot {
  locX: number
  locY: number
  made: boolean
  zone: string | null
  type: string | null
  distance: number | null
}

export interface TeamSeasonStats {
  season: string
  wins: number | null
  losses: number | null
  offRtg: number | null
  defRtg: number | null
  netRtg: number | null
  pace: number | null
  pts: number | null
  reb: number | null
  ast: number | null
}


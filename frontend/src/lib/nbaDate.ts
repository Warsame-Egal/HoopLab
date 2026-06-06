/** NBA game dates follow the US Eastern schedule day, not UTC. */
export const NBA_TIMEZONE = 'America/New_York'

export function nbaTodayIso(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: NBA_TIMEZONE })
}

export function isNbaToday(isoDate: string): boolean {
  return isoDate === nbaTodayIso()
}

/** Shift a calendar date (YYYY-MM-DD) by whole days on the NBA schedule. */
export function shiftNbaDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12))
  return dt.toISOString().slice(0, 10)
}

/** First calendar day of an NBA season (Oct 1 of start year). */
export function seasonStartDate(season: string): string {
  const year = Number(season.slice(0, 4))
  return `${year}-10-01`
}

/** Last calendar day of an NBA season (Jun 30 of end year). */
export function seasonEndDate(season: string): string {
  const year = Number(season.slice(0, 4))
  return `${year + 1}-06-30`
}

export function clampToSeasonDate(isoDate: string, season: string): string {
  const start = seasonStartDate(season)
  const end = seasonEndDate(season)
  if (isoDate < start) return start
  if (isoDate > end) return end
  return isoDate
}

/** Default scoreboard date when a season is selected: today if in-season, else season end. */
export function defaultScoreboardDateForSeason(season: string): string {
  const today = nbaTodayIso()
  const start = seasonStartDate(season)
  const end = seasonEndDate(season)
  if (today >= start && today <= end) return today
  if (today > end) return end
  return start
}

export function isDateInSeason(isoDate: string, season: string): boolean {
  return isoDate >= seasonStartDate(season) && isoDate <= seasonEndDate(season)
}

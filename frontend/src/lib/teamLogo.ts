export function teamLogoUrl(abbreviation: string | null | undefined): string | null {
  return abbreviation ? `/logos/${abbreviation.toUpperCase()}.svg` : null
}

export function teamLogoCdnUrl(teamId: number | null | undefined): string | null {
  return teamId != null ? `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg` : null
}

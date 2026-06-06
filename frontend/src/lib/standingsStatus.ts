export type ClinchStatus = {
  label: string
  variant: 'success' | 'warning' | 'destructive'
}

/** Map NBA standings clinch codes to human-readable status badges. */
export function parseClinchStatus(clinch: string | null | undefined): ClinchStatus | null {
  if (!clinch) return null
  const code = clinch.replace(/^-\s*/, '').trim().toLowerCase()
  if (!code) return null

  if (['x', 'p', 'w', 'a', 'se', 'sw'].includes(code)) {
    return { label: 'Clinched', variant: 'success' }
  }
  if (code === 'pi') {
    return { label: 'Play-In', variant: 'warning' }
  }
  if (['e', 'o'].includes(code)) {
    return { label: 'Eliminated', variant: 'destructive' }
  }
  return null
}

export const STANDINGS_STATUS_LEGEND = [
  { label: 'Clinched', variant: 'success' as const },
  { label: 'Play-In', variant: 'warning' as const },
  { label: 'Eliminated', variant: 'destructive' as const },
]

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { currentSeason } from './utils'
import { SeasonContext, type SeasonContextValue } from './seasonContext'

function buildSeasonOptions(count: number): string[] {
  const current = currentSeason()
  const startYear = Number(current.slice(0, 4))
  const seasons: string[] = []
  for (let i = 0; i < count; i += 1) {
    const year = startYear - i
    seasons.push(`${year}-${String((year + 1) % 100).padStart(2, '0')}`)
  }
  return seasons
}

const SEASON_OPTIONS = buildSeasonOptions(8)
const STORAGE_KEY = 'hooplab.season'

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [season, setSeasonState] = useState<string>(() => {
    if (typeof window === 'undefined') return SEASON_OPTIONS[0]
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored && SEASON_OPTIONS.includes(stored) ? stored : SEASON_OPTIONS[0]
  })

  const setSeason = useCallback((next: string) => {
    setSeasonState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }, [])

  const value: SeasonContextValue = useMemo(
    () => ({ season, setSeason, options: SEASON_OPTIONS }),
    [season, setSeason],
  )

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>
}

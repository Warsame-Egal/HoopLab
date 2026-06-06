import { createContext } from 'react'

export type SeasonContextValue = {
  season: string
  setSeason: (season: string) => void
  options: string[]
}

export const SeasonContext = createContext<SeasonContextValue | null>(null)

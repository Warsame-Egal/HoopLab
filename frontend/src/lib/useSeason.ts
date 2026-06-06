import { useContext } from 'react'
import { SeasonContext } from './seasonContext'

export function useSeason() {
  const ctx = useContext(SeasonContext)
  if (!ctx) {
    throw new Error('useSeason must be used within a SeasonProvider')
  }
  return ctx
}

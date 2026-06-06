import { createContext } from 'react'

export type Theme = 'light' | 'dark'

export const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
} | null>(null)

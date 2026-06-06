import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SeasonProvider } from '../lib/season'
import { ThemeProvider } from '../lib/theme'
import { LeadersPage } from '../pages/LeadersPage'
import { ScoreboardPage } from '../pages/ScoreboardPage'

vi.mock('../lib/api', () => ({
  api: vi.fn(async (path: string) => {
    if (path.includes('/api/leaders')) {
      return [
        {
          playerId: 1,
          playerName: 'Test Player',
          teamAbbreviation: 'TST',
          rank: 1,
          gamesPlayed: 10,
          value: 30.5,
        },
      ]
    }
    if (path.includes('/api/scoreboard')) {
      return {
        scoreboard: { gameDate: '2025-01-15', games: [] },
      }
    }
    return {}
  }),
}))

vi.mock('../hooks/useLiveScoreboard', () => ({
  useLiveScoreboard: () => ({
    games: [],
    liveCount: 0,
    isLoading: false,
    recentlyUpdated: new Set<string>(),
    lastUpdatedAt: null,
    connectionStatus: 'idle' as const,
    gameDate: '2025-01-15',
    selectedDate: '2025-01-15',
    setDate: vi.fn(),
    goPrev: vi.fn(),
    goNext: vi.fn(),
    goToday: vi.fn(),
    isToday: true,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('../hooks/useLiveNotifications', () => ({
  useLiveNotifications: vi.fn(),
}))

function renderWithProviders(ui: ReactElement, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <SeasonProvider>
          <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
        </SeasonProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('smoke routes', () => {
  it('renders scoreboard heading', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/scoreboard" element={<ScoreboardPage />} />
      </Routes>,
      '/scoreboard',
    )
    expect(await screen.findByRole('heading', { name: /scoreboard/i })).toBeInTheDocument()
  })

  it('renders leaders table', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/leaders" element={<LeadersPage />} />
      </Routes>,
      '/leaders',
    )
    expect(await screen.findByText('Test Player')).toBeInTheDocument()
    expect(screen.getByText('Leaderboards')).toBeInTheDocument()
  })
})

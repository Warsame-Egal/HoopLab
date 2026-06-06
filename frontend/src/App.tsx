import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { ComparePage } from './pages/ComparePage'
import { GameDetailPage } from './pages/GameDetailPage'
import { LeadersPage } from './pages/LeadersPage'
import { OverviewPage } from './pages/OverviewPage'
import { ScoreboardPage } from './pages/ScoreboardPage'
import { PlayerDetailPage } from './pages/PlayerDetailPage'
import { PlayersPage } from './pages/PlayersPage'
import { StandingsPage } from './pages/StandingsPage'
import { TeamDetailPage } from './pages/TeamDetailPage'
import { TeamsPage } from './pages/TeamsPage'
import { SeasonProvider } from './lib/season'
import { ThemeProvider } from './lib/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SeasonProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route
                index
                element={
                  <RouteErrorBoundary>
                    <OverviewPage />
                  </RouteErrorBoundary>
                }
              />
              <Route path="scoreboard" element={<RouteErrorBoundary><ScoreboardPage /></RouteErrorBoundary>} />
              <Route path="players" element={<RouteErrorBoundary><PlayersPage /></RouteErrorBoundary>} />
              <Route path="players/:id" element={<RouteErrorBoundary><PlayerDetailPage /></RouteErrorBoundary>} />
              <Route path="teams" element={<RouteErrorBoundary><TeamsPage /></RouteErrorBoundary>} />
              <Route path="teams/:id" element={<RouteErrorBoundary><TeamDetailPage /></RouteErrorBoundary>} />
              <Route path="standings" element={<RouteErrorBoundary><StandingsPage /></RouteErrorBoundary>} />
              <Route path="games/:gameId" element={<RouteErrorBoundary><GameDetailPage /></RouteErrorBoundary>} />
              <Route path="leaders" element={<RouteErrorBoundary><LeadersPage /></RouteErrorBoundary>} />
              <Route path="compare" element={<RouteErrorBoundary><ComparePage /></RouteErrorBoundary>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </SeasonProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

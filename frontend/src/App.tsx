import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { GameDetailPage } from './pages/GameDetailPage'
import { LeadersPage } from './pages/LeadersPage'
import { OverviewPage } from './pages/OverviewPage'
import { PlayerDetailPage } from './pages/PlayerDetailPage'
import { PlayersPage } from './pages/PlayersPage'
import { StandingsPage } from './pages/StandingsPage'
import { TeamDetailPage } from './pages/TeamDetailPage'
import { TeamsPage } from './pages/TeamsPage'
import { SeasonProvider } from './lib/season'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SeasonProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<OverviewPage />} />
              <Route path="players" element={<PlayersPage />} />
              <Route path="players/:id" element={<PlayerDetailPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="teams/:id" element={<TeamDetailPage />} />
              <Route path="standings" element={<StandingsPage />} />
              <Route path="games/:gameId" element={<GameDetailPage />} />
              <Route path="leaders" element={<LeadersPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SeasonProvider>
    </QueryClientProvider>
  )
}

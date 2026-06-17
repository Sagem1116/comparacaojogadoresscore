import { useDataStore } from './stores/dataStore'
import { Routes, Route, BrowserRouter } from 'react-router-dom'
import Navigation from './components/Navigation'
import ImportPage from './components/pages/ImportPage'
import RoleConfigurationPage from './components/pages/RoleConfigurationPage'
import ScoutingTablePage from './components/pages/ScoutingTablePage'
import PlayerProfilePage from './components/pages/PlayerProfilePage'
import DashboardPage from './components/pages/DashboardPage'
import MetricInfoPage from './components/pages/MetricInfoPage'
import MetricInfoNunoPage from './components/pages/MetricInfoNunoPage'
import SimilarPlayersPage from './components/pages/SimilarPlayersPage'
import NunoScoresPage from './components/pages/NunoScoresPage'
import ScoutingNunoPage from './components/pages/ScoutingNunoPage'
import { ErrorBoundary } from './components/ErrorBoundary'

/**
 * Main Application Component
 * Routes and orchestrates the entire scouting engine
 */

function App() {
  const players = useDataStore((state) => state.players)
  const detectedRoles = useDataStore((state) => state.detectedRoles)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),_transparent_30%),radial-gradient(circle_at_20%_10%,_rgba(129,140,248,0.12),_transparent_18%),linear-gradient(180deg,#020617_0%,#111827_90%)] text-slate-100">
      <ErrorBoundary>
        <BrowserRouter>
          <Navigation />
          <main className="flex-1 pb-10">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/metricas-info" element={<MetricInfoPage />} />
              <Route path="/metricas-info-nuno" element={<MetricInfoNunoPage />} />
              <Route path="/configuration" element={<RoleConfigurationPage />} />
              <Route path="/configuration/:roleId" element={<RoleConfigurationPage />} />
              <Route path="/scouting" element={<ScoutingTablePage />} />
              <Route path="/similares" element={<SimilarPlayersPage />} />
              <Route path="/nuno-scores" element={<NunoScoresPage />} />
              <Route path="/scouting-nuno-scores" element={<ScoutingNunoPage />} />
              <Route path="/player/:playerId" element={<PlayerProfilePage />} />
            </Routes>
          </main>
        </BrowserRouter>
      </ErrorBoundary>
    </div>
  )
}

export default App

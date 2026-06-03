import { useMemo } from 'react'
import { useDataStore } from '../../stores/dataStore'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Sparkles, Users, Settings, TrendingUp, Database, BookOpen } from 'lucide-react'

/**
 * Dashboard Page Component
 * Displays overview, statistics, and quick access to top players
 */
export default function DashboardPage() {
  const navigate = useNavigate()
  const players = useDataStore((state) => state.players)
  const detectedRoles = useDataStore((state) => state.detectedRoles)
  const analyses = useDataStore((state) => state.analyses)

  // Quick stats
  const playerCount = players.length
  const roleCount = detectedRoles.length
  const analysesCount = analyses.size
  const hasData = playerCount > 0 && roleCount > 0
  const recentAnalyses = useMemo(
    () => Array.from(analyses.values()).sort((a, b) => b.lastModified.localeCompare(a.lastModified)).slice(0, 3),
    [analyses]
  )

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        <section className="panel relative overflow-hidden p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.16),_transparent_40%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
                <Sparkles className="w-4 h-4" />
                FMDataLab
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Enhance your Football Manager player recruitment
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                FMDataLab calculates scores for players' proficiency in every playable role within Football Manager. Use these role scores to discover hidden talents, streamline squad and transfer decisions, and revolutionise your scouting.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={() => navigate('/scouting')} className="btn-primary">Role Scores</button>
                <button onClick={() => navigate('/import')} className="btn-secondary">Upload Data</button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-800/70 bg-slate-950/95 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Players</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{playerCount.toLocaleString()}</p>
                </div>
                <div className="rounded-3xl border border-slate-800/70 bg-slate-950/95 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Detected Roles</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{roleCount}</p>
                </div>
                <div className="rounded-3xl border border-slate-800/70 bg-slate-950/95 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Analyses Saved</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{analysesCount}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-[32px] border border-slate-800/70 bg-slate-950/95 p-6">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Live Scouting Snapshot</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">Latest data overview</h2>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                    {playerCount.toLocaleString()} Players
                  </span>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-900/95 p-4 text-sm text-slate-300">
                      <p className="text-slate-400">Players Imported</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{playerCount.toLocaleString()}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/95 p-4 text-sm text-slate-300">
                      <p className="text-slate-400">Roles Detected</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{roleCount}</p>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-900/95 p-4 text-sm text-slate-300">
                    <p className="text-slate-400">Top Role</p>
                    <p className="mt-2 text-lg font-semibold text-white">{detectedRoles[0]?.name ?? 'No role yet'}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[32px] border border-slate-800/70 bg-slate-950/95 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Quick actions</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button className="btn-secondary w-full" onClick={() => navigate('/import')}>Upload Files</button>
                  <button className="btn-secondary w-full" onClick={() => navigate('/configuration')}>Configure Roles</button>
                  <button className="btn-secondary w-full" onClick={() => navigate('/scouting')}>View Analysis</button>
                  <button className="btn-secondary w-full" onClick={() => navigate('/player/0')}>Player Profile</button>
                </div>
                <div className="mt-3 rounded-[24px] border border-slate-800/70 bg-slate-950/95 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Novo</p>
                      <h2 className="mt-2 text-lg font-semibold text-white">Métricas Info</h2>
                      <p className="mt-2 text-sm text-slate-300">Acesse o conteúdo categorizado do Excel com as principais métricas por função.</p>
                    </div>
                    <BookOpen className="h-5 w-5 text-violet-300" />
                  </div>
                  <button className="btn-primary mt-4 w-full" onClick={() => navigate('/metricas-info')}>
                    Abrir páginas de métricas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {hasData ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard label="Total Players" value={playerCount} icon={<Users className="w-5 h-5" />} />
              <StatCard label="Detected Roles" value={roleCount} icon={<BarChart3 className="w-5 h-5" />} />
              <StatCard
                label="Analyses Saved"
                value={analysesCount}
                icon={<TrendingUp className="w-5 h-5" />}
              />
            </div>

            {/* Import Info */}
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-bold mb-4">📊 Dataset Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Players Imported</p>
                  <p className="text-3xl font-bold text-blue-400">{playerCount}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">Detected Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {detectedRoles.slice(0, 5).map((role) => (
                      <span
                        key={role.id}
                        className="px-2 py-1 bg-purple-900 text-purple-200 text-xs rounded"
                      >
                        {role.name}
                      </span>
                    ))}
                    {detectedRoles.length > 5 && (
                      <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded">
                        +{detectedRoles.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="card p-6 bg-blue-950 border-blue-900">
              <h2 className="text-lg font-bold mb-4">🚀 Next Steps</h2>
              <ol className="space-y-3 text-sm text-blue-100">
                <li>
                  <strong>1. Configure Roles:</strong> Select metrics for each role and assign weights
                </li>
                <li>
                  <strong>2. Define Formulas:</strong> Create custom scoring formulas combining metrics
                </li>
                <li>
                  <strong>3. Run Analysis:</strong> Generate scouting reports with rankings
                </li>
                <li>
                  <strong>4. Export Results:</strong> Save configurations and analysis views
                </li>
              </ol>
              <button
                onClick={() => navigate('/configuration')}
                className="mt-4 btn-primary"
              >
                Start Configuration
              </button>
            </div>

            {/* Recent Analyses */}
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">📁 Recent Analyses</h2>
              {recentAnalyses.length > 0 ? (
                <div className="space-y-3">
                  {recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-400">{analysis.roleName}</p>
                          <p className="font-semibold text-slate-100">{analysis.name}</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(analysis.lastModified).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-slate-400">
                        {analysis.players.length} players · Sorted by final score
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400">No saved analyses yet. Create one from the Scouting page after configuring roles.</div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Empty State */}
            <div className="card p-12 text-center">
              <Database className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Data Imported Yet</h2>
              <p className="text-slate-400 mb-6">
                Import FMDataLab CSV exports to start building your scouting profiles
              </p>
              <button
                onClick={() => navigate('/import')}
                className="btn-primary"
              >
                Import CSV Files
              </button>
            </div>

            {/* Help Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <HelpCard
                title="📋 Statistics CSV"
                items={[
                  'Player name and club',
                  'Age and position',
                  'Minutes played',
                  'Statistical metrics',
                  'Advanced statistics',
                  'Per 90 statistics',
                ]}
              />
              <HelpCard
                title="🎯 Role Scores CSV"
                items={[
                  'Player identification',
                  'FMDataLab role scores',
                  'Multiple role columns',
                  'Attribute-based scores',
                  'Auto-detected roles',
                  'Dynamic columns',
                ]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface QuickActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
  status?: 'default' | 'active' | 'disabled'
}

function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  disabled,
  status = 'default',
}: QuickActionCardProps) {
  const statusStyles = {
    default: 'bg-slate-800 border-slate-700 hover:border-blue-600',
    active: 'bg-blue-900 border-blue-700 hover:border-blue-500',
    disabled: 'bg-slate-800 border-slate-700 cursor-not-allowed opacity-50',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`card p-4 border transition-all ${statusStyles[status]}`}
    >
      <div className="text-blue-400 mb-2">{icon}</div>
      <h3 className="font-semibold mb-1 text-left">{title}</h3>
      <p className="text-sm text-slate-400 text-left">{description}</p>
    </button>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="card p-6 border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="text-blue-400">{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}

interface HelpCardProps {
  title: string
  items: string[]
}

function HelpCard({ title, items }: HelpCardProps) {
  return (
    <div className="card p-4 border-slate-800">
      <h3 className="font-semibold mb-3">{title}</h3>
      <ul className="space-y-2 text-sm text-slate-400">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="text-slate-600">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

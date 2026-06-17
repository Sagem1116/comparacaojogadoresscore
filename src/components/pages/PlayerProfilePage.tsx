import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '../../stores/dataStore'
import { ChevronLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { PlayerAnalysis } from '../../types/index'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import PlayerAIInsight from '../PlayerAIInsight'

const PLAYER_INFO_KEYS = new Set([
  'playername',
  'club',
  'age',
  'position',
  'minutes',
  'market value',
  'market_value',
])

function formatStatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)
  }
  return String(value)
}

/**
 * Player Profile Page Component
 * Displays detailed player information and analysis breakdown
 */
export default function PlayerProfilePage() {
  const navigate = useNavigate()
  const { playerId } = useParams()

  const players = useDataStore((state) => state.players)
  const analyses = useDataStore((state) => state.analyses)

  const player = useMemo(
    () => players.find((p) => p.id === playerId),
    [players, playerId]
  )

  const playerStatEntries = useMemo(() => {
    if (!player) return []
    return Object.entries(player.statistics)
      .filter(([key]) => !PLAYER_INFO_KEYS.has(key.toLowerCase()))
      .sort(([, aValue], [, bValue]) => {
        const a = typeof aValue === 'number' ? aValue : 0
        const b = typeof bValue === 'number' ? bValue : 0
        return b - a
      })
  }, [player])

  const playerRoleScoreEntries = useMemo(() => {
    if (!player) return []
    return Object.entries(player.roleScores)
      .filter(([key]) => !PLAYER_INFO_KEYS.has(key.toLowerCase()))
      .sort(([, aScore], [, bScore]) => {
        const a = typeof aScore === 'number' ? aScore : 0
        const b = typeof bScore === 'number' ? bScore : 0
        return b - a
      })
  }, [player])

  const playerAnalyses = useMemo(() => {
    if (!player) return []
    return Array.from(analyses.values())
      .flatMap((view) =>
        view.players
          .filter((analysis) => analysis.playerId === player.id)
          .map((analysis) => ({ ...analysis, viewName: view.name }))
      )
  }, [analyses, player])

  if (!player) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="text-center py-16">
            <p className="text-slate-400">Jogador não encontrado</p>
          </div>
        </div>
      </div>
    )
  }

  const topRoleScore = playerRoleScoreEntries[0]
  const summaryCount = playerStatEntries.length
  const metricPreview = playerStatEntries.slice(0, 12)

  // Radar data for top role scores (normalized to 0-100)
  const roleRadarData = useMemo(() => {
    return playerRoleScoreEntries.slice(0, 8).map(([role, score]) => ({
      role: role.replace(/ Score$/i, '').replace(/\b\w+\b/g, (w) => w[0]).slice(0, 6),
      fullRole: role,
      value: Math.min(100, typeof score === 'number' ? score : Number(score) || 0),
    }))
  }, [playerRoleScoreEntries])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-lg shadow-slate-950/30 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 mb-2">Perfil do Jogador</p>
              <h1 className="text-5xl font-extrabold tracking-tight mb-2">{player.playerName}</h1>
              <p className="text-slate-400 text-lg">{player.club}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="rounded-3xl bg-slate-800 p-4 text-center">
                <p className="text-xs uppercase text-slate-400">Idade</p>
                <p className="mt-2 text-2xl font-bold">{player.age}</p>
              </div>
              <div className="rounded-3xl bg-slate-800 p-4 text-center">
                <p className="text-xs uppercase text-slate-400">Posição</p>
                <p className="mt-2 text-2xl font-bold">{player.position}</p>
              </div>
              <div className="rounded-3xl bg-slate-800 p-4 text-center">
                <p className="text-xs uppercase text-slate-400">Minutos</p>
                <p className="mt-2 text-2xl font-bold">{player.minutes.toLocaleString()}</p>
              </div>
              {player.marketValue !== undefined && (
                <div className="rounded-3xl bg-slate-800 p-4 text-center">
                  <p className="text-xs uppercase text-slate-400">Valor</p>
                  <p className="mt-2 text-2xl font-bold">€{(player.marketValue / 1000000).toFixed(1)}M</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-slate-800 p-5 border border-slate-700">
              <p className="text-xs uppercase text-slate-400">Estatísticas carregadas</p>
              <p className="mt-2 text-3xl font-semibold">{summaryCount}</p>
            </div>
            <div className="rounded-3xl bg-slate-800 p-5 border border-slate-700">
              <p className="text-xs uppercase text-slate-400">Colunas de função</p>
              <p className="mt-2 text-3xl font-semibold">{playerRoleScoreEntries.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-800 p-5 border border-slate-700">
              <p className="text-xs uppercase text-slate-400">Melhor função</p>
              <p className="mt-2 text-2xl font-semibold">{topRoleScore ? topRoleScore[0] : 'N/A'}</p>
            </div>
            <div className="rounded-3xl bg-slate-800 p-5 border border-slate-700">
              <p className="text-xs uppercase text-slate-400">ID do jogador</p>
              <p className="mt-2 text-sm font-mono text-slate-300 break-all">{player.id}</p>
            </div>
          </div>
        </div>

        {/* Radar + AI Insight section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 mb-8">
          <section className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Role Profile</h2>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Top {roleRadarData.length}
              </span>
            </div>
            {roleRadarData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={roleRadarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="role" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar
                      name={player.playerName}
                      dataKey="value"
                      stroke="#a78bfa"
                      fill="#a78bfa"
                      fillOpacity={0.45}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No role scores available.</p>
            )}
          </section>

          <PlayerAIInsight
            player={player}
            topRoles={playerRoleScoreEntries as [string, string | number][]}
            topStats={playerStatEntries}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-8">
          <div className="space-y-8">
            <section className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold">Estatísticas principais</h2>
                  <p className="text-slate-500 text-sm">Visualize os principais indicadores do jogador.</p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                  Top {metricPreview.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metricPreview.map(([key, value]) => (
                  <div key={key} className="rounded-3xl bg-slate-800 p-4 border border-slate-700">
                    <p className="text-sm text-slate-400 truncate">{key}</p>
                    <p className="mt-2 text-xl font-semibold">{formatStatValue(value)}</p>
                  </div>
                ))}
              </div>
              {summaryCount > metricPreview.length && (
                <p className="mt-4 text-xs text-slate-400">+{summaryCount - metricPreview.length} outras métricas</p>
              )}
            </section>

            <section className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Resultados de análise</h2>
              {playerAnalyses.length === 0 ? (
                <p className="text-slate-400">Nenhuma análise salva encontrada para este jogador.</p>
              ) : (
                <div className="space-y-4">
                  {playerAnalyses.map((analysis) => {
                    const topMetrics = Object.entries(analysis.metrics)
                      .sort(([, a], [, b]) => b.contribution - a.contribution)
                      .slice(0, 3)

                    return (
                      <div key={`${analysis.viewName}-${analysis.playerId}`} className="rounded-3xl bg-slate-800 p-5 border border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <div>
                            <p className="text-sm text-slate-400">Visão</p>
                            <p className="text-lg font-semibold">{analysis.viewName}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className="text-xs uppercase text-slate-400">Final</p>
                              <p className="text-xl font-semibold text-blue-300">{analysis.finalScore.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-slate-400">Percentil</p>
                              <p className="text-xl font-semibold text-emerald-300">{analysis.percentile.toFixed(0)}%</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-slate-400">Função</p>
                              <p className="text-xl font-semibold">{analysis.role.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-slate-900 p-4 border border-slate-800">
                            <p className="text-xs uppercase text-slate-400">Score FMDataLab</p>
                            <p className="mt-2 text-lg font-semibold">{analysis.fmdatalabRoleScore.toFixed(1)}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-900 p-4 border border-slate-800">
                            <p className="text-xs uppercase text-slate-400">Score Métricas</p>
                            <p className="mt-2 text-lg font-semibold">{analysis.customMetricScore.toFixed(1)}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-900 p-4 border border-slate-800">
                            <p className="text-xs uppercase text-slate-400">Minutos</p>
                            <p className="mt-2 text-lg font-semibold">{analysis.minutes.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="mt-5 space-y-3">
                          {topMetrics.map(([metricName, metric]) => (
                            <div key={metricName} className="flex items-center justify-between rounded-2xl bg-slate-950/50 p-3">
                              <div>
                                <p className="text-sm text-slate-300">{metricName}</p>
                                <p className="text-xs text-slate-500">Normalizado: {metric.normalizedValue.toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-2 text-slate-100 font-semibold">
                                {metric.contribution >= 0 ? (
                                  <ArrowUp className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <ArrowDown className="w-4 h-4 text-rose-400" />
                                )}
                                <span>{metric.contribution.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-8">
            <section className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Pontuações por função</h2>
              <div className="space-y-3">
                {playerRoleScoreEntries.map(([role, score]) => (
                  <div key={role} className="rounded-3xl bg-slate-800 p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <span className="font-semibold">{role}</span>
                      <span className="text-blue-300 font-bold">{typeof score === 'number' ? score.toFixed(1) : score}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-blue-600"
                        style={{
                          width: `${Math.min(100, ((typeof score === 'number' ? score : 0) / 100) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Informações adicionais</h2>
              <div className="grid gap-3 text-sm">
                <div className="rounded-3xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Clube</p>
                  <p className="mt-1 font-semibold">{player.club}</p>
                </div>
                <div className="rounded-3xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Posição</p>
                  <p className="mt-1 font-semibold">{player.position}</p>
                </div>
                {player.marketValue !== undefined && (
                  <div className="rounded-3xl bg-slate-800 p-4 border border-slate-700">
                    <p className="text-slate-400">Valor de mercado</p>
                    <p className="mt-1 font-semibold">€{(player.marketValue / 1000000).toFixed(1)}M</p>
                  </div>
                )}
                <div className="rounded-3xl bg-slate-800 p-4 border border-slate-700">
                  <p className="text-slate-400">Total de métricas</p>
                  <p className="mt-1 font-semibold">{summaryCount}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

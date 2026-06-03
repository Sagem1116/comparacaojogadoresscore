import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../stores/dataStore'
import { ChevronLeft, Search } from 'lucide-react'
import { Player } from '../../types/index'

function parseNumericValue(value: any): number | null {
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/[^0-9.\-]/g, '')
  const parsed = parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

export default function SimilarPlayersPage() {
  const navigate = useNavigate()
  const players = useDataStore((state) => state.players)

  const [selectedSimilarPlayerId, setSelectedSimilarPlayerId] = useState<string>(players[0]?.id || '')
  const [selectedMetricColumns, setSelectedMetricColumns] = useState<string[]>([])
  const [similarPlayers, setSimilarPlayers] = useState<{ player: Player; distance: number }[]>([])

  const availableStatColumns = useMemo(() => {
    if (players.length === 0) return []
    const basePlayer = players[0]
    const excludedPatterns = ['player', 'playername', 'club', 'age', 'position', 'minutes', 'id', 'role', 'rank']
    return Object.keys(basePlayer.statistics).filter((column) => {
      const lower = column.toLowerCase().trim()
      return !excludedPatterns.some(
        (pattern) =>
          lower === pattern ||
          lower.startsWith(`${pattern} `) ||
          lower.endsWith(` ${pattern}`) ||
          lower.includes(` ${pattern} `)
      )
    })
  }, [players])

  useEffect(() => {
    if (!selectedSimilarPlayerId && players.length > 0) {
      setSelectedSimilarPlayerId(players[0].id)
    }
  }, [players, selectedSimilarPlayerId])

  const getPlayer = (playerId: string): Player | undefined => {
    return players.find((player) => player.id === playerId)
  }

  const getPlayerMetricValue = (player: Player, column: string): number | null => {
    return parseNumericValue(player.statistics[column])
  }

  const calculateMetricBounds = (columns: string[]) => {
    const bounds: Record<string, { min: number; max: number }> = {}

    columns.forEach((column) => {
      let min = Infinity
      let max = -Infinity

      players.forEach((player) => {
        const value = getPlayerMetricValue(player, column)
        if (value !== null) {
          min = Math.min(min, value)
          max = Math.max(max, value)
        }
      })

      bounds[column] = {
        min: min === Infinity ? 0 : min,
        max: max === -Infinity ? 0 : max,
      }
    })

    return bounds
  }

  const getNormalizedMetricValue = (
    player: Player,
    column: string,
    bounds: Record<string, { min: number; max: number }>
  ) => {
    const value = getPlayerMetricValue(player, column)
    if (value === null) return 0
    const { min, max } = bounds[column]
    if (max === min) return 0
    return (value - min) / (max - min)
  }

  const findSimilarPlayers = (player: Player, columns: string[]) => {
    if (columns.length === 0) return []
    const bounds = calculateMetricBounds(columns)
    const referenceValues = columns.map((column) => getNormalizedMetricValue(player, column, bounds))

    return players
      .filter((candidate) => candidate.id !== player.id)
      .map((candidate) => {
        const distance = Math.sqrt(
          columns.reduce((sum, column, index) => {
            const candidateValue = getNormalizedMetricValue(candidate, column, bounds)
            const diff = candidateValue - referenceValues[index]
            return sum + diff * diff
          }, 0)
        )
        return { player: candidate, distance }
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20)
  }

  const handleSearchSimilarPlayers = () => {
    const selectedPlayer = getPlayer(selectedSimilarPlayerId)
    if (!selectedPlayer || selectedMetricColumns.length === 0) {
      setSimilarPlayers([])
      return
    }
    setSimilarPlayers(findSimilarPlayers(selectedPlayer, selectedMetricColumns))
  }

  if (players.length === 0) {
    return (
      <div className="min-h-screen scout-page py-10 px-4">
        <header className="border-b border-border bg-[var(--background-alt)]">
          <div className="flex flex-wrap items-center gap-6 px-4 py-3">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-primary">Money</span>ball
            </h1>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="text-foreground">Players</span>
              <span>Jogadores Similiares Metricas</span>
            </nav>
          </div>
        </header>
        <div className="px-4 py-5 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="scout-panel p-10 text-center">
              <span className="scout-badge">Scouting</span>
              <h2 className="mt-4 text-3xl font-semibold text-white">Nenhum jogador importado</h2>
              <p className="mt-3 text-slate-400">
                Importe seus arquivos CSV para usar a busca de jogadores similares.
              </p>
              <button onClick={() => navigate('/import')} className="btn-primary mt-8">
                Importar dados
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen scout-page text-foreground">
      <header className="border-b border-border bg-[var(--background-alt)]">
        <div className="flex flex-wrap items-center gap-6 px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-primary">Money</span>ball
          </h1>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="text-foreground">Players</span>
            <span>Jogadores Similiares Metricas</span>
          </nav>
        </div>
      </header>

      <div className="px-4 py-5 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[hsl(215_27.9%_16.9%)]/80 px-4 py-2 text-slate-100 transition hover:border-primary hover:text-foreground mb-7"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao dashboard
          </button>

          <div className="scout-card space-y-6">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Seleção de similaridade</p>
              <h1 className="text-3xl font-semibold text-white">Encontre jogadores com métricas próximas</h1>
              <p className="max-w-3xl text-slate-400">
                Escolha um jogador importado, selecione as métricas relevantes e clique em pesquisar para ver os jogadores mais semelhantes.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.22em] text-slate-400">Jogador base</label>
                  <select
                    value={selectedSimilarPlayerId}
                    onChange={(e) => setSelectedSimilarPlayerId(e.target.value)}
                    className="scout-input w-full"
                  >
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.playerName} — {player.club} ({player.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm uppercase tracking-[0.22em] text-slate-400">Métricas</label>
                    <span className="text-xs text-slate-500">{selectedMetricColumns.length} selecionadas</span>
                  </div>
                  <div className="grid max-h-56 gap-2 overflow-y-auto">
                    {availableStatColumns.map((column) => (
                      <label
                        key={column}
                        className="inline-flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMetricColumns.includes(column)}
                          onChange={(e) =>
                            setSelectedMetricColumns((prev) =>
                              e.target.checked ? [...prev, column] : prev.filter((item) => item !== column)
                            )
                          }
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-400"
                        />
                        <span>{column}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSearchSimilarPlayers}
                  disabled={selectedMetricColumns.length === 0}
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  Pesquisar
                </button>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Instruções</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• Escolha um jogador importado como referência.</li>
                  <li>• Marque as métricas que você quer comparar.</li>
                  <li>• Clique em pesquisar para ver a lista de jogadores com perfil parecido.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-5">
              <h2 className="text-xl font-semibold text-white">Resultados similares</h2>
              {similarPlayers.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {similarPlayers.map(({ player, distance }, index) => (
                    <div key={player.id} className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-white">{index + 1}. {player.playerName}</p>
                          <p className="text-sm text-slate-400">{player.club} • {player.position}</p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                          Distância {distance.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/95 p-5 text-slate-500">
                  Selecione um jogador e pelo menos uma métrica para mostrar resultados similares.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

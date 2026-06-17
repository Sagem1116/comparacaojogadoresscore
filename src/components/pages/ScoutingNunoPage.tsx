import { useState, useMemo, useEffect, useRef, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../stores/dataStore'
import { ChevronLeft, Copy, Check, Download, Settings, Search } from 'lucide-react'
import { PlayerAnalysis, Role, Player } from '../../types/index'
import { useFilteredAnalyses, usePagination } from '../../hooks/useAnalysis'
import { exportAnalysisToCSV } from '../../services/analysisService'
import { calculateNunoAnalyses } from '../../services/nunoAnalysisService'
import AIScoutAssistant from '../AIScoutAssistant'

function parseNumericValue(value: any): number | null {
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/[^0-9.\-]/g, '')
  const parsed = parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Scouting Nuno Page — same layout as ScoutingTablePage but uses Nuno per-role config
 * (attributes + metrics + custom formula). Scores shown: Attribute Score, Metric Score, Final Score.
 */
export default function ScoutingNunoPage() {
  const navigate = useNavigate()

  const players = useDataStore((state) => state.players)
  const currentRole = useDataStore((state) => state.currentRole)
  const nunoConfigs = useDataStore((state) => state.nunoConfigs)
  const detectedRoles = useDataStore((state) => state.detectedRoles)
  const customAttributes = useDataStore((state) => state.customAttributes)

  const configuredRole = useMemo(() => {
    return detectedRoles.find((role) => !!nunoConfigs[role.id]) || null
  }, [detectedRoles, nunoConfigs])

  const [selectedRole, setSelectedRole] = useState<Role | null>(currentRole || configuredRole || detectedRoles[0] || null)
  const [copiedPlayerName, setCopiedPlayerName] = useState<string | null>(null)

  const playersById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players])

  const availableStatColumns = useMemo(() => {
    if (players.length === 0) return []
    const basePlayer = players[0]
    const excludedPatterns = ['player', 'playername', 'club', 'age', 'position', 'minutes', 'id', 'role', 'rank']
    return Object.keys(basePlayer.statistics).filter((column) => {
      const lower = column.toLowerCase().trim()
      return !excludedPatterns.some((pattern) => lower === pattern || lower.startsWith(`${pattern} `) || lower.endsWith(` ${pattern}`) || lower.includes(` ${pattern} `))
    })
  }, [players])

  const availablePlayerInfoColumns = useMemo(() => {
    return ['Club', 'Age', 'Position', 'Minutes']
  }, [])

  const copyPlayerName = async (playerName: string) => {
    try {
      await navigator.clipboard.writeText(playerName)
      setCopiedPlayerName(playerName)
      window.setTimeout(() => setCopiedPlayerName((current) => (current === playerName ? null : current)), 1500)
    } catch {
      // Clipboard access may be unavailable in some browsers
    }
  }

  const availableRoleColumns = useMemo(() => {
    if (players.length === 0) return []
    const basePlayer = players[0]
    const excludedPatterns = ['player', 'playername', 'club', 'age', 'position', 'minutes', 'id']
    return Object.keys(basePlayer.roleScores).filter((column) => {
      const lower = column.toLowerCase().trim()
      return !excludedPatterns.some((pattern) => lower === pattern || lower.startsWith(`${pattern} `) || lower.endsWith(` ${pattern}`) || lower.includes(` ${pattern} `))
    })
  }, [players])

  const availableColumns = useMemo(
    () => [
      ...availablePlayerInfoColumns.map((column) => `Info: ${column}`),
      ...availableStatColumns.map((column) => `Stats: ${column}`),
      ...availableRoleColumns.map((column) => `Role: ${column}`),
    ],
    [availablePlayerInfoColumns, availableStatColumns, availableRoleColumns]
  )

  const salaryColumns = useMemo(
    () => availableStatColumns.filter((column) => /wage|salary/i.test(column)),
    [availableStatColumns]
  )

  const transferValueColumns = useMemo(
    () => availableStatColumns.filter((column) => /transfer value|transfer|market value|market_value/i.test(column)),
    [availableStatColumns]
  )

  const STORAGE_KEY_SCOUTING_STATE = 'scouting-nuno-state'

  const [searchQuery, setSearchQuery] = useState('')
  const [columnSearch, setColumnSearch] = useState('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('finalScore')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [pageIndex, setPageIndex] = useState(0)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [columnFilterRanges, setColumnFilterRanges] = useState<Record<string, { min: string; max: string }>>({})
  const [columnSortBy, setColumnSortBy] = useState<Record<string, 'asc' | 'desc'>>({})
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const hasInitializedDefaultsRef = useRef(false)
  const hadSavedStateRef = useRef(false)
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [transferMin, setTransferMin] = useState('')
  const [transferMax, setTransferMax] = useState('')
  const pageSize = 20

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_SCOUTING_STATE)
      if (!raw) return

      const parsed = JSON.parse(raw)
      hadSavedStateRef.current = true
      if (Array.isArray(parsed.selectedColumns)) {
        setSelectedColumns(parsed.selectedColumns)
      }

      if (parsed.columnFilters && typeof parsed.columnFilters === 'object') {
        setColumnFilters(parsed.columnFilters)
      }

      if (parsed.columnFilterRanges && typeof parsed.columnFilterRanges === 'object') {
        setColumnFilterRanges(parsed.columnFilterRanges)
      }

      if (parsed.columnWidths && typeof parsed.columnWidths === 'object') {
        setColumnWidths(parsed.columnWidths)
      }

      if (typeof parsed.salaryMin === 'string') {
        setSalaryMin(parsed.salaryMin)
      }
      if (typeof parsed.salaryMax === 'string') {
        setSalaryMax(parsed.salaryMax)
      }
      if (typeof parsed.transferMin === 'string') {
        setTransferMin(parsed.transferMin)
      }
      if (typeof parsed.transferMax === 'string') {
        setTransferMax(parsed.transferMax)
      }
    } catch {
      // Ignore malformed storage data
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stateToSave = {
      selectedColumns,
      columnFilters,
      columnFilterRanges,
      columnWidths,
      salaryMin,
      salaryMax,
      transferMin,
      transferMax,
    }

    window.localStorage.setItem(STORAGE_KEY_SCOUTING_STATE, JSON.stringify(stateToSave))
  }, [selectedColumns, columnFilters, columnFilterRanges, columnWidths, salaryMin, salaryMax, transferMin, transferMax])

  // Default visible columns when nothing is saved yet:
  // include wage + transfer value Stats columns by default
  useEffect(() => {
    if (hasInitializedDefaultsRef.current) return
    if (players.length === 0) return
    if (hadSavedStateRef.current) {
      hasInitializedDefaultsRef.current = true
      return
    }
    const defaults = [
      ...transferValueColumns.map((c) => `Stats: ${c}`),
      ...salaryColumns.map((c) => `Stats: ${c}`),
    ]
    if (defaults.length > 0) {
      setSelectedColumns((prev) => {
        if (prev.length > 0) return prev
        return Array.from(new Set(defaults))
      })
    }
    hasInitializedDefaultsRef.current = true
  }, [players, salaryColumns, transferValueColumns])

  const filteredAvailableColumns = useMemo(() => {
    const lowerSearch = columnSearch.toLowerCase().trim()

    return availableColumns.filter((column) =>
      column.toLowerCase().includes(lowerSearch)
    )
  }, [availableColumns, columnSearch])

  useEffect(() => {
    if (!selectedRole) {
      setSelectedRole(currentRole || configuredRole || detectedRoles[0] || null)
    }
  }, [currentRole, configuredRole, detectedRoles, selectedRole])

  // Get Nuno configuration for selected role
  const configuration = useMemo(() => {
    if (!selectedRole) return null
    return nunoConfigs[selectedRole.id] || null
  }, [selectedRole, nunoConfigs])

  const analyses = useMemo(() => {
    if (!selectedRole || !configuration || players.length === 0) return []
    return calculateNunoAnalyses(players, selectedRole, configuration, customAttributes)
  }, [players, selectedRole, configuration, customAttributes])

  // Compatibility flag — never show legacy Nuno column on this page
  const hasNunoData = false
  const nunoScoreByPlayerId: Record<string, number | null> = {}

  // Helper function to get player by ID
  const getPlayer = (playerId: string): Player | undefined => {
    return playersById.get(playerId)
  }

  // Helper function to get value for a specific column
  const getValueForColumn = (playerId: string, column: string) => {
    const player = getPlayer(playerId)
    if (!player) return '-'

    if (column.startsWith('Info: ')) {
      const key = column.replace('Info: ', '')
      switch (key) {
        case 'Club':
          return player.club
        case 'Age':
          return player.age
        case 'Position':
          return player.position
        case 'Minutes':
          return player.minutes
        default:
          return '-'
      }
    }

    if (column.startsWith('Stats: ')) {
      const key = column.replace('Stats: ', '')
      return player.statistics[key] ?? '-'
    }

    if (column.startsWith('Role: ')) {
      const key = column.replace('Role: ', '')
      return player.roleScores[key] ?? '-'
    }

    return '-'
  }

  const getAnalysisValueForColumn = (analysis: PlayerAnalysis, column: string) => {
    switch (column) {
      case 'Rank':
        return analysis.rank
      case 'Player':
        return analysis.playerName
      case 'Club':
        return analysis.club
      case 'Age':
        return analysis.age
      case 'Position':
        return analysis.position
      case 'Minutes':
        return analysis.minutes
      case 'Attr %':
        return analysis.customMetricPercentile ?? analysis.customMetricScore * 100
      case 'Attribute Score':
        return analysis.customMetricScore
      case 'Metric Score':
        return analysis.fmdatalabRoleScore
      case 'Final Score':
        return analysis.finalScore
      case 'Nuno Legacy': {
        const v = nunoScoreByPlayerId[analysis.playerId]
        return v ?? '-'
      }
      default:
        return getValueForColumn(analysis.playerId, column)
    }
  }

  const getScoreDisplayValue = (column: string, numeric: number) => {
    if (column === 'Attr %') {
      return numeric
    }

    if (column === 'Attribute Score') {
      return numeric <= 1 ? numeric * 100 : numeric
    }

    if (column === 'Metric Score') {
      return numeric
    }

    if (column === 'Final Score') {
      return finalScoreMax > 0 ? (numeric / finalScoreMax) * 100 : numeric
    }

    return numeric
  }

  const getValueToneClass = (column: string, value: any) => {
    const numeric = parseNumericValue(value)
    if (numeric === null) return 'text-slate-300'

    if (['Attr %', 'Attribute Score', 'Metric Score', 'Final Score', 'Nuno Legacy'].includes(column)) {
      const scaled = getScoreDisplayValue(column, numeric)
      const tone = getScoreTone(scaled)
      return tone === 'green'
        ? 'text-emerald-300'
        : tone === 'cyan'
        ? 'text-cyan-300'
        : tone === 'amber'
        ? 'text-amber-300'
        : 'text-rose-300'
    }

    if (typeof value === 'number' || !Number.isNaN(numeric)) {
      if (numeric >= 10000000) return 'text-emerald-300'
      if (numeric >= 5000000) return 'text-cyan-300'
      if (numeric >= 1000000) return 'text-slate-200'
    }

    return 'text-slate-300'
  }

  const formatColumnValue = (value: any) => {
    if (value === null || value === undefined || value === '') return '-'
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1)
    }
    return String(value)
  }

  const getNumericAnalysisValue = (analysis: PlayerAnalysis, columns: string[]) => {
    for (const column of columns) {
      const value = parseNumericValue(getValueForColumn(analysis.playerId, `Stats: ${column}`))
      if (value !== null) return value
    }
    return null
  }

  const isColumnNumeric = (column: string) => {
    const numericColumns = ['Rank', 'Age', 'Minutes', 'Attr %', 'Attribute Score', 'Metric Score', 'Final Score', 'Nuno Legacy']
    if (numericColumns.includes(column)) return true

    const exampleAnalysis = analyses[0]
    if (!exampleAnalysis) return false

    const value = getAnalysisValueForColumn(exampleAnalysis, column)
    return parseNumericValue(value) !== null
  }

  // Filter data based on column filters
  const applyColumnFilters = (data: PlayerAnalysis[]): PlayerAnalysis[] => {
    return data.filter((analysis) => {
      if (salaryColumns.length > 0 && (salaryMin !== '' || salaryMax !== '')) {
        const salaryValue = getNumericAnalysisValue(analysis, salaryColumns)
        if (salaryValue === null) return false
        if (salaryMin !== '' && salaryValue < Number(salaryMin)) return false
        if (salaryMax !== '' && salaryValue > Number(salaryMax)) return false
      }
      if (transferValueColumns.length > 0 && (transferMin !== '' || transferMax !== '')) {
        const transferValue = getNumericAnalysisValue(analysis, transferValueColumns)
        if (transferValue === null) return false
        if (transferMin !== '' && transferValue < Number(transferMin)) return false
        if (transferMax !== '' && transferValue > Number(transferMax)) return false
      }

      const filterColumns = [
        'Player',
        'Club',
        'Age',
        'Position',
        'Minutes',
        'Attr %',
        'Attribute Score',
        'Metric Score',
        'Final Score',
        ...(hasNunoData ? ['Nuno Legacy'] : []),
        ...selectedColumns,
      ]

      for (const column of filterColumns) {
        const range = columnFilterRanges[column]
        if (isColumnNumeric(column) && range) {
          const numericValue = parseNumericValue(getAnalysisValueForColumn(analysis, column))
          if (numericValue === null) return false
          if (range.min !== '' && numericValue < Number(range.min)) return false
          if (range.max !== '' && numericValue > Number(range.max)) return false
        }

        const filterValue = columnFilters[column]?.toLowerCase().trim()
        if (filterValue) {
          const cellValue = String(getAnalysisValueForColumn(analysis, column)).toLowerCase()
          if (!cellValue.includes(filterValue)) {
            return false
          }
        }
      }
      return true
    })
  }

  // Sort data based on column sorts
  const applySortToColumns = (data: PlayerAnalysis[]): PlayerAnalysis[] => {
    let result = [...data]

    selectedColumns.forEach((column) => {
      if (columnSortBy[column]) {
        const direction = columnSortBy[column]
        result.sort((a, b) => {
          const aVal = getValueForColumn(a.playerId, column)
          const bVal = getValueForColumn(b.playerId, column)

          // Try numeric comparison first
          const aNum = parseFloat(String(aVal))
          const bNum = parseFloat(String(bVal))

          if (!isNaN(aNum) && !isNaN(bNum)) {
            return direction === 'asc' ? aNum - bNum : bNum - aNum
          }

          // Fall back to string comparison
          const aStr = String(aVal).toLowerCase()
          const bStr = String(bVal).toLowerCase()
          return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
        })
      }
    })

    return result
  }

  const searchFilteredAnalyses = useFilteredAnalyses(
    analyses,
    { search: searchQuery },
    sortBy,
    sortDirection
  )

  // Filter and paginate
  const filteredAnalyses = useMemo(() => {
    let filtered = searchFilteredAnalyses

    // Apply column filters
    filtered = applyColumnFilters(filtered)

    // Apply column sorts
    filtered = applySortToColumns(filtered)

    return filtered
  }, [searchFilteredAnalyses, columnFilters, columnSortBy, selectedColumns, salaryMin, salaryMax, transferMin, transferMax])

  const finalScoreMax = useMemo(() => {
    if (filteredAnalyses.length === 0) return 100
    return Math.max(1, ...filteredAnalyses.map((analysis) => Number(analysis.finalScore)))
  }, [filteredAnalyses])

  const roleScoreMax = useMemo(() => {
    if (filteredAnalyses.length === 0) return 100
    return Math.max(1, ...filteredAnalyses.map((analysis) => Number(analysis.fmdatalabRoleScore)))
  }, [filteredAnalyses])

  const paginatedData = usePagination(filteredAnalyses, pageSize, pageIndex)

  // All columns rendered in the table, in order — used for colgroup widths
  const orderedTableColumns = useMemo(
    () => [
      'Rank',
      'Player',
      'Club',
      'Age',
      'Position',
      'Minutes',
      'Attr %',
      'Attribute Score',
      'Metric Score',
      'Final Score',
      ...(hasNunoData ? ['Nuno Legacy'] : []),
      ...selectedColumns,
    ],
    [selectedColumns, hasNunoData]
  )

  const defaultColumnWidth = (column: string) => {
    if (column === 'Rank') return 56
    if (column === 'Player') return 180
    if (column === 'Club') return 130
    if (column === 'Age' || column === 'Minutes') return 70
    if (column === 'Position') return 90
    if (['Attr %', 'Attribute Score', 'Metric Score', 'Final Score', 'Nuno Legacy'].includes(column)) return 140
    return 110
  }

  const startResize = (column: string, event: ReactMouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startWidth = columnWidths[column] ?? defaultColumnWidth(column)

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX
      const next = Math.max(60, Math.min(900, startWidth + delta))
      setColumnWidths((prev) => ({ ...prev, [column]: next }))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Unique-value suggestions for autofill on text filter inputs
  const columnSuggestions = useMemo(() => {
    const result: Record<string, string[]> = {}
    const collect = (column: string) => {
      if (isColumnNumeric(column)) return
      const seen = new Set<string>()
      for (const a of analyses) {
        const v = getAnalysisValueForColumn(a, column)
        if (v === null || v === undefined || v === '') continue
        const s = String(v)
        if (!seen.has(s)) seen.add(s)
        if (seen.size >= 300) break
      }
      result[column] = Array.from(seen).sort()
    }
    ;['Player', 'Club', 'Position', ...selectedColumns].forEach(collect)
    return result
  }, [analyses, selectedColumns])

  const analysisSummary = useMemo(() => {
    if (filteredAnalyses.length === 0) {
      return {
        averageFinalScore: 0,
        highestFinalScore: 0,
        highestPlayer: null as PlayerAnalysis | null,
        topTierCount: 0,
      }
    }

    const total = filteredAnalyses.length
    const averageFinalScore =
      filteredAnalyses.reduce((sum, analysis) => sum + analysis.finalScore, 0) / total
    const highestPlayer = filteredAnalyses.reduce((best, analysis) =>
      analysis.finalScore > best.finalScore ? analysis : best,
      filteredAnalyses[0]
    )
    const topTierCount = filteredAnalyses.filter(
      (analysis) => typeof analysis.rank === 'number' && analysis.rank <= 3
    ).length

    return {
      averageFinalScore,
      highestFinalScore: highestPlayer.finalScore,
      highestPlayer,
      topTierCount,
    }
  }, [filteredAnalyses])

  const handleExport = () => {
    const csv = exportAnalysisToCSV(filteredAnalyses)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scouting_${selectedRole?.name || 'analysis'}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
              <span>Role Scores</span>
              <span>Fantasy Draft</span>
              <span>Jogadores Similiares Metricas</span>
            </nav>
          </div>
        </header>
        <div className="px-4 py-5 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="scout-panel p-10 text-center">
              <span className="scout-badge">Scouting</span>
              <h2 className="mt-4 text-3xl font-semibold text-white">No data available</h2>
              <p className="mt-3 text-slate-400">
                Import your CSV files to unlock the scouting dashboard and analytics table.
              </p>
              <button onClick={() => navigate('/import')} className="btn-primary mt-8">
                Import Data
              </button>
            </div>
          </div>
        </div>
        <AIScoutAssistant analyses={[]} role={null} />
      </div>
    )
  }

  const sortColumnsByAvailableOrder = (columns: string[]) => {
    return [...columns].sort((a, b) => {
      const aIndex = availableColumns.indexOf(a)
      const bIndex = availableColumns.indexOf(b)
      if (aIndex === -1 || bIndex === -1) return a.localeCompare(b)
      return aIndex - bIndex
    })
  }

  const selectAllColumns = () => {
    setSelectedColumns(
      sortColumnsByAvailableOrder([
        ...availablePlayerInfoColumns.map((column) => `Info: ${column}`),
        ...availableStatColumns.map((column) => `Stats: ${column}`),
        ...availableRoleColumns.map((column) => `Role: ${column}`),
      ])
    )
  }

  const selectAllStats = () => {
    setSelectedColumns((prev) =>
      sortColumnsByAvailableOrder([
        ...new Set([...(prev || []), ...availableStatColumns.map((column) => `Stats: ${column}`)]),
      ])
    )
  }

  const selectAllInfo = () => {
    setSelectedColumns((prev) =>
      sortColumnsByAvailableOrder([
        ...new Set([...(prev || []), ...availablePlayerInfoColumns.map((column) => `Info: ${column}`)]),
      ])
    )
  }

  const selectAllRoleScores = () => {
    setSelectedColumns((prev) =>
      sortColumnsByAvailableOrder([
        ...new Set([...(prev || []), ...availableRoleColumns.map((column) => `Role: ${column}`)]),
      ])
    )
  }

  const removeColumn = (column: string) => {
    setSelectedColumns((prev) => prev.filter((col) => col !== column))
    setColumnFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[column]
      return newFilters
    })
    setColumnSortBy((prev) => {
      const newSort = { ...prev }
      delete newSort[column]
      return newSort
    })
  }

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === selectedColumns.length - 1) return

    const newColumns = [...selectedColumns]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newColumns[index], newColumns[swapIndex]] = [newColumns[swapIndex], newColumns[index]]
    setSelectedColumns(newColumns)
  }

  const toggleColumnSort = (column: string) => {
    setColumnSortBy((prev) => ({
      ...prev,
      [column]: prev[column] === 'asc' ? 'desc' : 'asc',
    }))
  }

  if (!selectedRole || !configuration) {
    return (
      <div className="min-h-screen scout-page py-10 px-4">
        <header className="border-b border-border bg-[var(--background-alt)]">
          <div className="flex flex-wrap items-center gap-6 px-4 py-3">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-primary">Money</span>ball
            </h1>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="text-foreground">Players</span>
              <span>Role Scores</span>
              <span>Fantasy Draft</span>
              <span>Jogadores Similiares Metricas</span>
            </nav>
          </div>
        </header>
        <div className="px-4 py-5 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="scout-panel p-10 text-center space-y-6">
              <Settings className="mx-auto h-10 w-10 text-cyan-300" />
              <h2 className="text-3xl font-semibold text-white">Sem configuração Nuno</h2>
              <p className="text-slate-400">
                Não existe configuração Nuno para esta role. Cria uma em Nuno Scores para ver o dashboard.
              </p>
              <button onClick={() => navigate('/nuno-scores')} className="btn-primary">
                Configurar Nuno Scores
              </button>
            </div>
          </div>
        </div>
        <AIScoutAssistant analyses={[]} players={players} role={selectedRole} />
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
            <span>Role Scores</span>
            <span>Fantasy Draft</span>
            <span>Jogadores Similiares Metricas</span>
          </nav>
        </div>
      </header>
      <div className="px-4 py-5 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-[hsl(215_27.9%_16.9%)]/80 px-4 py-2 text-slate-100 transition hover:border-primary hover:text-foreground mb-7"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to dashboard
            </button>

            <div className="grid gap-4 xl:grid-cols-[1.7fr_0.95fr] mb-6">
          <div className="scout-panel overflow-hidden relative p-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)] opacity-70" />
            <div className="relative space-y-4">
              <span className="scout-badge">FMDataLab scouting</span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Scouting analysis with premium table controls
                </h1>
                <p className="mt-2 max-w-3xl text-slate-400 text-sm">
                  Browse player rankings, role scores, salary filters and custom column visibility in a modern analytics workspace inspired by FMDataLab.
                </p>
              </div>

              <div className="grid gap-2.5 grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/95 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Players analyzed</p>
                  <p className="mt-1 text-lg font-semibold text-white">{filteredAnalyses.length.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/95 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Selected role</p>
                  <p className="mt-1 text-lg font-semibold text-white truncate">{selectedRole?.name || 'Not selected'}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/95 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Avg. final score</p>
                  <p className="mt-1 text-lg font-semibold text-white">{analysisSummary.averageFinalScore.toFixed(1)}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/95 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Top 3 performers</p>
                  <p className="mt-1 text-lg font-semibold text-white">{analysisSummary.topTierCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="scout-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Quick actions</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Tools</h2>
                </div>
                <button onClick={handleExport} className="btn-primary inline-flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              <div className="mt-3 grid gap-2.5 grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/95 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Current role</p>
                  <p className="mt-1 text-base font-semibold text-white truncate">{selectedRole?.name || 'None selected'}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/95 px-3 py-2.5">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Data imported</p>
                  <p className="mt-1 text-base font-semibold text-white">{players.length.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="scout-card">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.22em] text-slate-400">Select role</label>
                  <select
                    value={selectedRole?.id || ''}
                    onChange={(e) => {
                      const role = detectedRoles.find((r) => r.id === e.target.value)
                      setSelectedRole(role || null)
                      setPageIndex(0)
                    }}
                    className="scout-input"
                  >
                    <option value="">Choose a role...</option>
                    {detectedRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.22em] text-slate-400">Search players</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setPageIndex(0)
                      }}
                      placeholder="Player name, club, position..."
                      className="scout-input pl-10"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Role analysis snapshot</p>
                  <div className="mt-2.5 grid gap-2 grid-cols-3">
                    <div className="rounded-xl bg-slate-900 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Top score</p>
                      <p className="mt-1 text-sm font-semibold text-white">{analysisSummary.highestFinalScore.toFixed(1)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Best player</p>
                      <p className="mt-1 text-sm font-semibold text-white truncate">{analysisSummary.highestPlayer?.playerName || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-900 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Summary</p>
                      <p className="mt-1 text-sm font-semibold text-white">{analysisSummary.topTierCount} top-3</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] mb-6">
          <div className="scout-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Column manager</p>
                <h2 className="text-xl font-semibold text-white">Select & reorder fields</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={selectAllColumns} className="scout-toggle">Add all</button>
                <button onClick={selectAllInfo} className="scout-toggle">Info</button>
                <button onClick={selectAllStats} className="scout-toggle">Stats</button>
                <button onClick={selectAllRoleScores} className="scout-toggle">Roles</button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <span className="text-sm text-slate-400">{selectedColumns.length} columns selected</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedColumns([])
                    setColumnFilters({})
                    setColumnSortBy({})
                  }}
                  className="rounded-full bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600"
                >
                  Clear selection
                </button>
              </div>

              {selectedColumns.length === 0 ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-5 text-slate-500">No extra columns selected.</div>
              ) : (
                <div className="space-y-3">
                  {selectedColumns.map((column, idx) => (
                    <div key={column} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/95 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-slate-200">{column}</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => moveColumn(idx, 'up')}
                          disabled={idx === 0}
                          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-300 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveColumn(idx, 'down')}
                          disabled={idx === selectedColumns.length - 1}
                          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-300 disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeColumn(column)}
                          className="rounded-full border border-red-600 bg-red-600/10 px-3 py-1 text-[11px] text-red-200 hover:bg-red-600/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="scout-card">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Find columns</p>
                  <p className="text-xs text-slate-500">Search by column name and toggle visibility.</p>
                </div>
                <button type="button" onClick={() => setSelectedColumns(availableColumns)} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-200 hover:bg-cyan-500/15">
                  Show all
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input type="text" value={columnSearch} onChange={(e) => setColumnSearch(e.target.value)} placeholder="Search columns..." className="scout-input pl-10" />
              </div>

              <div className="max-h-72 overflow-auto rounded-3xl border border-slate-800 bg-slate-950/95 p-3 text-sm text-slate-300 space-y-2">
                {filteredAvailableColumns.length === 0 ? (
                  <p className="text-slate-500">No matching columns found.</p>
                ) : (
                  filteredAvailableColumns.map((column) => (
                    <button
                      key={column}
                      type="button"
                      onClick={() => setSelectedColumns((prev) => {
                        const next = prev.includes(column)
                          ? prev.filter((item) => item !== column)
                          : [...prev, column]
                        return sortColumnsByAvailableOrder(next)
                      })}
                      className={`w-full rounded-2xl px-4 py-3 text-left transition ${selectedColumns.includes(column)
                        ? 'bg-cyan-500/15 text-cyan-100 border border-cyan-500/30'
                        : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800'}`}
                    >
                      {column}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="scout-card mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Filter panel</p>
              <h2 className="text-2xl font-semibold text-white">Salary & transfer filters</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSalaryMin('')
                setSalaryMax('')
                setTransferMin('')
                setTransferMax('')
              }}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:border-cyan-400"
            >
              Reset filters
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {salaryColumns.length > 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Salary</p>
                <p className="mt-2 text-sm text-slate-300">{salaryColumns.join(', ')}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="Min salary" className="scout-input" />
                  <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="Max salary" className="scout-input" />
                </div>
              </div>
            )}

            {transferValueColumns.length > 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Transfer value</p>
                <p className="mt-2 text-sm text-slate-300">{transferValueColumns.join(', ')}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input type="number" value={transferMin} onChange={(e) => setTransferMin(e.target.value)} placeholder="Min transfer" className="scout-input" />
                  <input type="number" value={transferMax} onChange={(e) => setTransferMax(e.target.value)} placeholder="Max transfer" className="scout-input" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        <div className="grid gap-3 mb-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-amber-300/80">Top performer</p>
            <p className="mt-1.5 text-lg font-semibold text-white truncate">{analysisSummary.highestPlayer?.playerName || 'No data'}</p>
            <p className="mt-0.5 text-xs text-slate-400">Score: <span className="text-amber-300 font-semibold">{analysisSummary.highestFinalScore.toFixed(1)}</span></p>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-violet-300/80">Configuration</p>
            <p className="mt-1.5 text-lg font-semibold text-white truncate">{selectedRole?.name || 'Unconfigured'}</p>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500 line-clamp-1">{configuration.formula}</p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">Columns</p>
            <p className="mt-1.5 text-lg font-semibold text-white">{selectedColumns.length}<span className="text-sm text-slate-500"> / {availableColumns.length}</span></p>
            <p className="mt-0.5 text-xs text-slate-400">columns visible</p>
          </div>
        </div>

        <div className="scout-panel overflow-hidden">
          <div className="border-b border-slate-800/70 bg-slate-950/95 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Scouting table</p>
                <h2 className="text-2xl font-semibold text-white">Interactive FMDataLab-style grid</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="scout-badge">Min/max</span>
                <span className="scout-badge">Live search</span>
                <button
                  type="button"
                  onClick={() => setColumnFilterRanges({})}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-200 hover:border-cyan-400 hover:bg-cyan-500/10"
                >
                  Reset min/max
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto table-scrollbar">
            <table className="scout-table" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
              <colgroup>
                {orderedTableColumns.map((column) => (
                  <col
                    key={column}
                    style={{ width: `${columnWidths[column] ?? defaultColumnWidth(column)}px` }}
                  />
                ))}
              </colgroup>
              <thead className="bg-slate-950/95 backdrop-blur-xl sticky top-0 z-10">
                <tr>
                  <TableHeaderCell
                    label="Rank"
                    sortKey="rank"
                    currentSort={sortBy}
                    direction={sortDirection}
                    onResizeStart={(e) => startResize('Rank', e)}
                    onSort={(key) => {
                      if (sortBy === key) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy(key)
                        setSortDirection('desc')
                      }
                    }}
                  />
                  <TableHeaderCell
                    label="Player"
                    sortKey="playerName"
                    currentSort={sortBy}
                    direction={sortDirection}
                    onResizeStart={(e) => startResize('Player', e)}
                    onSort={(key) => {
                      if (sortBy === key) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy(key)
                        setSortDirection('desc')
                      }
                    }}
                  />
                  <TableHeaderCell label="Club" onResizeStart={(e) => startResize('Club', e)} />
                  <TableHeaderCell label="Age" onResizeStart={(e) => startResize('Age', e)} />
                  <TableHeaderCell label="Position" onResizeStart={(e) => startResize('Position', e)} />
                  <TableHeaderCell label="Minutes" onResizeStart={(e) => startResize('Minutes', e)} />
                  <TableHeaderCell
                    label="Attr %"
                    sortKey="customMetricPercentile"
                    currentSort={sortBy}
                    direction={sortDirection}
                    onResizeStart={(e) => startResize('Attr %', e)}
                    onSort={(key) => {
                      if (sortBy === key) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy(key)
                        setSortDirection('desc')
                      }
                    }}
                  />
                  <TableHeaderCell
                    label="Attribute Score"
                    sortKey="customMetricScore"
                    currentSort={sortBy}
                    direction={sortDirection}
                    onResizeStart={(e) => startResize('Attribute Score', e)}
                    onSort={(key) => {
                      if (sortBy === key) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy(key)
                        setSortDirection('desc')
                      }
                    }}
                  />
                  <TableHeaderCell
                    label="Metric Score"
                    sortKey="fmdatalabRoleScore"
                    currentSort={sortBy}
                    direction={sortDirection}
                    onResizeStart={(e) => startResize('Metric Score', e)}
                    onSort={(key) => {
                      if (sortBy === key) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy(key)
                        setSortDirection('desc')
                      }
                    }}
                  />
                  <TableHeaderCell
                    label="Final Score"
                    sortKey="finalScore"
                    currentSort={sortBy}
                    direction={sortDirection}
                    onResizeStart={(e) => startResize('Final Score', e)}
                    onSort={(key) => {
                      if (sortBy === key) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy(key)
                        setSortDirection('desc')
                      }
                    }}
                  />
                  {hasNunoData && (
                    <TableHeaderCell
                      label="Nuno Legacy"
                      sortKey="Nuno Legacy"
                      currentSort={columnSortBy['Nuno Legacy'] ? 'Nuno Legacy' : undefined}
                      direction={columnSortBy['Nuno Legacy']}
                      onSort={toggleColumnSort}
                      onResizeStart={(e) => startResize('Nuno Legacy', e)}
                    />
                  )}
                  {selectedColumns.map((column) => (
                    <TableHeaderCell
                      key={column}
                      label={column}
                      sortKey={column}
                      currentSort={columnSortBy[column] ? column : undefined}
                      direction={columnSortBy[column]}
                      onSort={toggleColumnSort}
                      onResizeStart={(e) => startResize(column, e)}
                    />
                  ))}
                </tr>
                <tr className="bg-slate-950/95">
                  {['Rank', 'Player', 'Club', 'Age', 'Position', 'Minutes', 'Attr %', 'Attribute Score', 'Metric Score', 'Final Score', ...(hasNunoData ? ['Nuno Legacy'] : []), ...selectedColumns].map((column) => (
                    <th key={`${column}-filter`} className="align-top">
                      {isColumnNumeric(column) ? (
                        <div className="grid gap-2">
                          <input
                            type="number"
                            value={columnFilterRanges[column]?.min || ''}
                            onChange={(e) =>
                              setColumnFilterRanges((prev) => ({
                                ...prev,
                                [column]: {
                                  min: e.target.value,
                                  max: prev[column]?.max || '',
                                },
                              }))
                            }
                            placeholder="Min"
                            className="scout-input scout-filter-input"
                          />
                          <input
                            type="number"
                            value={columnFilterRanges[column]?.max || ''}
                            onChange={(e) =>
                              setColumnFilterRanges((prev) => ({
                                ...prev,
                                [column]: {
                                  min: prev[column]?.min || '',
                                  max: e.target.value,
                                },
                              }))
                            }
                            placeholder="Max"
                            className="scout-input scout-filter-input"
                          />
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            list={`dl-${column}`}
                            autoComplete="off"
                            value={columnFilters[column] || ''}
                            onChange={(e) =>
                              setColumnFilters((prev) => ({
                                ...prev,
                                [column]: e.target.value,
                              }))
                            }
                            placeholder={`Search ${column}`}
                            className="scout-input scout-filter-input"
                          />
                          {columnSuggestions[column] && columnSuggestions[column].length > 0 && (
                            <datalist id={`dl-${column}`}>
                              {columnSuggestions[column].map((s) => (
                                <option key={s} value={s} />
                              ))}
                            </datalist>
                          )}
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.items.map((analysis, idx) => (
                  <tr
                    key={analysis.playerId}
                    className={`cursor-pointer ${
                      analysis.rank <= 3
                        ? 'border-l-[3px] border-amber-400'
                        : analysis.rank <= 10
                        ? 'border-l-[3px] border-cyan-400/70'
                        : 'border-l-[3px] border-transparent'
                    } ${idx % 2 === 1 ? 'row-zebra' : ''}`}
                    onClick={() => navigate(`/player/${analysis.playerId}`)}
                  >
                    <TableCell className="font-semibold text-cyan-200">{analysis.rank}</TableCell>
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span>{analysis.playerName}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            void copyPlayerName(analysis.playerName)
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/75 bg-slate-900/80 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
                          aria-label="Copy player name"
                          title="Copy player name"
                        >
                          {copiedPlayerName === analysis.playerName ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400">{analysis.club}</TableCell>
                    <TableCell className="text-slate-400">{analysis.age}</TableCell>
                    <TableCell className="text-slate-400">{analysis.position}</TableCell>
                    <TableCell className="text-slate-400">{analysis.minutes > 0 ? analysis.minutes.toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      <ScoreBar
                        value={
                          analysis.customMetricPercentile !== undefined
                            ? analysis.customMetricPercentile
                            : analysis.customMetricScore * 100
                        }
                        max={100}
                        suffix="%"
                      />
                    </TableCell>
                    <TableCell>
                      <ScoreBar value={analysis.customMetricScore} max={1} />
                    </TableCell>
                    <TableCell>
                      <ScoreBar value={analysis.fmdatalabRoleScore} max={roleScoreMax} />
                    </TableCell>
                    <TableCell className="font-semibold text-white">
                      <ScoreBar value={analysis.finalScore} max={finalScoreMax} />
                    </TableCell>
                    {hasNunoData && (
                      <TableCell className="font-semibold text-violet-200">
                        {(() => {
                          const v = nunoScoreByPlayerId[analysis.playerId]
                          return v === null || v === undefined
                            ? <span className="text-slate-500">-</span>
                            : <ScoreBar value={v} max={100} />
                        })()}
                      </TableCell>
                    )}
                    {selectedColumns.map((column) => {
                      const value = getAnalysisValueForColumn(analysis, column)
                      return (
                        <TableCell key={column} className={`${getValueToneClass(column, value)} text-sm`}>
                          {formatColumnValue(value)}
                        </TableCell>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            Showing {paginatedData.items.length > 0 ? pageIndex * pageSize + 1 : 0} to{' '}
            {Math.min((pageIndex + 1) * pageSize, paginatedData.total)} of {paginatedData.total}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
              disabled={pageIndex === 0}
              className="rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm transition hover:border-violet-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-slate-300 rounded-full border border-slate-800/70 bg-slate-950/80">
              Page {pageIndex + 1} of {paginatedData.pageCount}
            </span>
            <button
              onClick={() => setPageIndex(Math.min(paginatedData.pageCount - 1, pageIndex + 1))}
              disabled={pageIndex >= paginatedData.pageCount - 1}
              className="rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm transition hover:border-violet-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
    <AIScoutAssistant analyses={filteredAnalyses} players={players} role={selectedRole} />
  </div>
  )
}

interface TableHeaderCellProps {
  label: string
  sortKey?: string
  currentSort?: string
  direction?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onResizeStart?: (event: ReactMouseEvent) => void
}

function TableHeaderCell({
  label,
  sortKey,
  currentSort,
  direction,
  onSort,
  onResizeStart,
}: TableHeaderCellProps) {
  const isSorted = sortKey && currentSort === sortKey
  return (
    <th
      onClick={() => sortKey && onSort?.(sortKey)}
      className={`relative px-2 py-2 text-left font-semibold tracking-wide text-slate-200 uppercase text-[10px] ${sortKey ? 'cursor-pointer hover:bg-slate-700/70' : ''}`}
    >
      <div className="flex items-center gap-2 truncate">
        {label}
        {isSorted && (
          <span className="text-xs text-cyan-300">{direction === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
      {onResizeStart && (
        <span
          onMouseDown={onResizeStart}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none bg-transparent hover:bg-cyan-400/40"
          title="Drag to resize"
        />
      )}
    </th>
  )
}

interface TableCellProps {
  children: ReactNode
  className?: string
}

function TableCell({ children, className }: TableCellProps) {
  return <td className={`px-2 py-1.5 text-xs text-slate-300 ${className || ''}`}>{children}</td>
}

interface ScoreBarProps {
  value: number
  max: number
  suffix?: string
}

function getScoreTone(numeric: number) {
  if (numeric >= 80) return 'green'
  if (numeric >= 60) return 'cyan'
  if (numeric >= 40) return 'amber'
  return 'rose'
}

function getScoreToneStyles(tone: string) {
  switch (tone) {
    case 'green':
      return {
        fill: 'rgb(16 185 129)',
        pillBg: 'rgba(52, 211, 153, 0.18)',
        pillBorder: 'rgba(16, 185, 129, 0.35)',
        text: 'rgb(167, 243, 208)',
      }
    case 'cyan':
      return {
        fill: 'rgb(34 211 238)',
        pillBg: 'rgba(56, 189, 248, 0.18)',
        pillBorder: 'rgba(34, 211, 238, 0.35)',
        text: 'rgb(191, 219, 254)',
      }
    case 'amber':
      return {
        fill: 'rgb(251 191 36)',
        pillBg: 'rgba(251, 191, 36, 0.18)',
        pillBorder: 'rgba(251, 191, 36, 0.35)',
        text: 'rgb(253, 230, 138)',
      }
    default:
      return {
        fill: 'rgb(244 63 94)',
        pillBg: 'rgba(244, 63, 94, 0.18)',
        pillBorder: 'rgba(244, 63, 94, 0.35)',
        text: 'rgb(251, 207, 232)',
      }
  }
}

function ScoreBar({ value, max, suffix }: ScoreBarProps) {
  const raw = parseNumericValue(value) ?? 0
  const numeric = raw
  const percentage = max > 0 ? Math.max(0, Math.min(100, (numeric / max) * 100)) : 0
  const tone = getScoreTone(percentage)
  const toneStyles = getScoreToneStyles(tone)

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-900/70">
        <span
          className="h-full rounded-full shadow-lg transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: toneStyles.fill }}
        />
      </div>
      <span
        className="score-pill"
        style={{
          borderColor: toneStyles.pillBorder,
          backgroundColor: toneStyles.pillBg,
          color: toneStyles.text,
        }}
      >
        {numeric.toFixed(1)}{suffix || ''}
      </span>
    </div>
  )
}

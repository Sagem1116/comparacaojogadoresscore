import { useCallback, useMemo, useState } from 'react'
import { Player, Role, MetricProfile, RoleConfiguration, PlayerAnalysis } from '../types/index'
import { calculateAllPlayersAnalysis, createAnalysisView } from '../services/analysisService'
import { calculateMetricStats } from '../utils/metrics'

/**
 * React Hooks for Analysis
 */

/**
 * Hook for calculating player analysis
 */
export function usePlayerAnalysis(
  players: Player[],
  role: Role | null,
  metricProfile: MetricProfile | null,
  configuration: RoleConfiguration | null
) {
  const analyses = useMemo(() => {
    if (!role || !metricProfile || !configuration || players.length === 0) {
      return []
    }

    return calculateAllPlayersAnalysis(
      players,
      role,
      metricProfile,
      configuration
    )
  }, [players, role, metricProfile, configuration])

  return analyses
}

/**
 * Hook for getting analysis statistics
 */
export function useAnalysisStats(analyses: PlayerAnalysis[]) {
  return useMemo(() => {
    if (analyses.length === 0) {
      return {
        totalPlayers: 0,
        avgFinalScore: 0,
        maxFinalScore: 0,
        minFinalScore: 0,
        avgCustomScore: 0,
        avgRoleScore: 0,
        avgAge: 0,
      }
    }

    const scores = analyses.map((a) => a.finalScore)
    const customScores = analyses.map((a) => a.customMetricScore)
    const roleScores = analyses.map((a) => a.fmdatalabRoleScore)
    const ages = analyses.map((a) => a.age)

    return {
      totalPlayers: analyses.length,
      avgFinalScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      maxFinalScore: Math.max(...scores),
      minFinalScore: Math.min(...scores),
      avgCustomScore: customScores.reduce((a, b) => a + b, 0) / customScores.length,
      avgRoleScore: roleScores.reduce((a, b) => a + b, 0) / roleScores.length,
      avgAge: ages.reduce((a, b) => a + b, 0) / ages.length,
    }
  }, [analyses])
}

/**
 * Hook for filtering and sorting analyses
 */
export function useFilteredAnalyses(
  analyses: PlayerAnalysis[],
  filters: Record<string, any> = {},
  sortBy: string = 'finalScore',
  sortDirection: 'asc' | 'desc' = 'desc'
) {
  return useMemo(() => {
    let filtered = [...analyses]

    // Apply filters
    if (filters.minAge !== undefined) {
      filtered = filtered.filter((a) => a.age >= filters.minAge)
    }
    if (filters.maxAge !== undefined) {
      filtered = filtered.filter((a) => a.age <= filters.maxAge)
    }
    if (filters.minMinutes !== undefined) {
      filtered = filtered.filter((a) => a.minutes >= filters.minMinutes)
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.playerName.toLowerCase().includes(searchLower) ||
          a.club.toLowerCase().includes(searchLower) ||
          a.position.toLowerCase().includes(searchLower)
      )
    }
    if (filters.minScore !== undefined) {
      filtered = filtered.filter((a) => a.finalScore >= filters.minScore)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof PlayerAnalysis]
      const bVal = b[sortBy as keyof PlayerAnalysis]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'desc'
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal)
      }

      return 0
    })

    return filtered
  }, [analyses, filters, sortBy, sortDirection])
}

/**
 * Hook for pagination
 */
export function usePagination(
  items: any[],
  pageSize: number = 50,
  pageIndex: number = 0
) {
  const paginatedItems = useMemo(() => {
    const start = pageIndex * pageSize
    return items.slice(start, start + pageSize)
  }, [items, pageSize, pageIndex])

  const pageCount = Math.ceil(items.length / pageSize)

  return {
    items: paginatedItems,
    pageCount,
    pageIndex,
    pageSize,
    total: items.length,
  }
}

/**
 * Hook for table visibility state
 */
export function useColumnVisibility(initialState: Record<string, boolean> = {}) {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(initialState)

  const toggle = useCallback((columnId: string) => {
    setVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }))
  }, [])

  const toggleAll = useCallback((visible: boolean) => {
    const newVisibility: Record<string, boolean> = {}
    for (const key of Object.keys(visibility)) {
      newVisibility[key] = visible
    }
    setVisibility(newVisibility)
  }, [visibility])

  return { visibility, toggle, toggleAll }
}

/**
 * Hook for getting top players
 */
export function useTopPlayers(analyses: PlayerAnalysis[], count: number = 10) {
  return useMemo(() => {
    return analyses.slice(0, count)
  }, [analyses, count])
}

/**
 * Hook for getting young talents
 */
export function useYoungTalents(
  analyses: PlayerAnalysis[],
  maxAge: number = 23,
  count: number = 10
) {
  return useMemo(() => {
    return analyses
      .filter((a) => a.age <= maxAge)
      .sort((a, b) => a.age - b.age)
      .slice(0, count)
  }, [analyses, maxAge, count])
}

/**
 * Hook for metric statistics
 */
export function useMetricStats(analyses: PlayerAnalysis[], metricName: string) {
  return useMemo(() => {
    const values = analyses.map((a) => {
      const metric = a.metrics[metricName]
      return metric ? metric.normalizedValue : 0
    })
    return calculateMetricStats(values)
  }, [analyses, metricName])
}

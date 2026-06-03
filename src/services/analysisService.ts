import {
  Player,
  Role,
  MetricProfile,
  RoleConfiguration,
  PlayerAnalysis,
  AnalysisView,
  CalculationResult,
  PercentileStats,
} from '../types/index'
import {
  calculateWeightedMetricScore,
  calculateMetricStats,
  calculatePercentileRank,
} from '../utils/metrics'
import { evaluateFormula, extractFormulaVariables } from '../utils/formula'

/**
 * Analysis Service
 * Orchestrates player analysis, calculation, and ranking
 */

/**
 * Calculate analysis for a single player
 */
export function calculatePlayerAnalysis(
  player: Player,
  role: Role,
  metricProfile: MetricProfile,
  configuration: RoleConfiguration,
  allPlayers: Player[],
  percentileStatsMap: Map<string, PercentileStats>
): PlayerAnalysis {
  // Calculate custom metric score
  const { score: customMetricScore, normalizedMetrics } =
    calculateWeightedMetricScore(
      player.statistics,
      metricProfile.metrics,
      percentileStatsMap
    )

  // Extract role score from player data
  const fmdatalabRoleScore = extractRoleScore(player, role)

  // Calculate final score using formula
  const formulaVariables = {
    CustomMetricScore: customMetricScore,
    RoleScore: fmdatalabRoleScore,
    Age: player.age,
    MinutesPlayed: player.minutes,
    MarketValue: player.marketValue || 0,
  }

  const { result: finalScore } = evaluateFormula(
    configuration.finalScoreFormula,
    formulaVariables
  )

  // Calculate percentile (will be done after all players)
  const percentile = 0 // Placeholder, updated in batch

  return {
    playerId: player.id,
    playerName: player.playerName,
    club: player.club,
    age: player.age,
    position: player.position,
    minutes: player.minutes,
    role,
    metrics: convertNormalizedMetricsToDetails(normalizedMetrics, metricProfile),
    customMetricScore,
    fmdatalabRoleScore,
    finalScore,
    percentile,
  }
}

/**
 * Convert normalized metrics to detailed breakdown
 */
function convertNormalizedMetricsToDetails(
  normalizedMetrics: Record<string, number>,
  metricProfile: MetricProfile
): PlayerAnalysis['metrics'] {
  const details: PlayerAnalysis['metrics'] = {}

  for (const metric of metricProfile.metrics.filter((m) => m.enabled)) {
    const normalized = normalizedMetrics[metric.name] || 0
    details[metric.name] = {
      rawValue: 0, // Not included in normalized form
      normalizedValue: normalized,
      weight: metric.weight,
      contribution: normalized * metric.weight,
    }
  }

  return details
}

/**
 * Extract FMDataLab role score for a player
 */
function extractRoleScore(player: Player, role: Role): number {
  const score = player.roleScores[role.columnName]

  if (typeof score === 'number') {
    return Math.max(0, Math.min(100, score)) // Clamp to 0-100
  }

  if (typeof score === 'string') {
    const parsed = parseFloat(score)
    if (!isNaN(parsed)) {
      return Math.max(0, Math.min(100, parsed))
    }
  }

  return 0
}

/**
 * Calculate analysis for all players
 */
export function calculateAllPlayersAnalysis(
  players: Player[],
  role: Role,
  metricProfile: MetricProfile,
  configuration: RoleConfiguration
): PlayerAnalysis[] {
  // Pre-calculate metric statistics for normalization
  const percentileStatsMap = new Map<string, PercentileStats>()

  for (const metric of metricProfile.metrics.filter((m) => m.enabled)) {
    const values = players.map((player) => {
      const value = player.statistics[metric.columnName]

      if (typeof value === 'number') {
        return value
      }

      if (typeof value === 'string') {
        const parsed = Number.parseFloat(value)
        return Number.isNaN(parsed) ? null : parsed
      }

      return null
    })

    percentileStatsMap.set(metric.columnName, calculateMetricStats(values))
  }

  // Calculate analysis for each player
  const analyses = players.map((player) =>
    calculatePlayerAnalysis(
      player,
      role,
      metricProfile,
      configuration,
      players,
      percentileStatsMap
    )
  )

  // Calculate percentiles and rank
  const finalScores = analyses.map((a) => a.finalScore)
  const customMetricScores = analyses.map((a) => a.customMetricScore)

  const sortedAnalyses = analyses
    .map((analysis, index) => ({
      ...analysis,
      customMetricPercentile: calculatePercentileRank(analysis.customMetricScore, customMetricScores),
      percentile: calculatePercentileRank(analysis.finalScore, finalScores),
      rank: index + 1,
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((analysis, index) => ({
      ...analysis,
      rank: index + 1,
    }))

  return sortedAnalyses
}

/**
 * Create analysis view from calculated analyses
 */
export function createAnalysisView(
  analyses: PlayerAnalysis[],
  role: Role,
  filters?: any[]
): AnalysisView {
  let filteredAnalyses = analyses

  if (filters && filters.length > 0) {
    filteredAnalyses = applyFiltersToAnalyses(analyses, filters)
  }

  // Sort by final score descending
  const sortedAnalyses = filteredAnalyses.sort(
    (a, b) => b.finalScore - a.finalScore
  )

  return {
    id: `analysis-${Date.now()}`,
    name: `${role.name} Analysis - ${new Date().toLocaleDateString()}`,
    roleId: role.id,
    roleName: role.name,
    players: sortedAnalyses,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    filters,
    sortBy: 'finalScore',
    sortDirection: 'desc',
  }
}

/**
 * Apply filters to analyses
 */
function applyFiltersToAnalyses(analyses: PlayerAnalysis[], filters: any[]): PlayerAnalysis[] {
  return analyses.filter((analysis) =>
    filters.every((filter) => {
      const fieldValue = analysis[filter.field as keyof PlayerAnalysis]

      if (fieldValue === undefined || fieldValue === null) {
        return false
      }

      switch (filter.operator) {
        case 'greaterThan':
          return Number(fieldValue) > filter.value
        case 'lessThan':
          return Number(fieldValue) < filter.value
        case 'between':
          return Number(fieldValue) >= filter.value[0] && Number(fieldValue) <= filter.value[1]
        case 'contains':
          return String(fieldValue).toLowerCase().includes(filter.value.toLowerCase())
        default:
          return fieldValue === filter.value
      }
    })
  )
}

/**
 * Get top players from analysis
 */
export function getTopPlayers(
  analyses: PlayerAnalysis[],
  count: number = 10
): PlayerAnalysis[] {
  return analyses.slice(0, count)
}

/**
 * Get youngest talents
 */
export function getYoungestTalents(
  analyses: PlayerAnalysis[],
  maxAge: number = 23,
  count: number = 10
): PlayerAnalysis[] {
  return analyses
    .filter((a) => a.age <= maxAge)
    .sort((a, b) => a.age - b.age)
    .slice(0, count)
}

/**
 * Get best value players (high score, young age)
 */
export function getBestValue(
  analyses: PlayerAnalysis[],
  count: number = 10
): PlayerAnalysis[] {
  return analyses
    .map((a) => ({
      ...a,
      valueScore: (a.finalScore / Math.max(a.age, 1)) * 10,
    }))
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, count)
}

/**
 * Calculate comparative statistics
 */
export function calculateAnalysisStats(analyses: PlayerAnalysis[]) {
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
}

/**
 * Export analysis to CSV format
 */
export function exportAnalysisToCSV(analyses: PlayerAnalysis[]): string {
  if (analyses.length === 0) {
    return ''
  }

  const headers = [
    'Rank',
    'Player Name',
    'Club',
    'Age',
    'Position',
    'Minutes',
    'Custom Metric Score',
    'Role Score',
    'Final Score',
    'Percentile',
  ]

  const rows = analyses.map((a, index) => [
    index + 1,
    a.playerName,
    a.club,
    a.age,
    a.position,
    a.minutes,
    a.customMetricScore.toFixed(2),
    a.fmdatalabRoleScore.toFixed(2),
    a.finalScore.toFixed(2),
    a.percentile.toFixed(2),
  ])

  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')

  return csv
}

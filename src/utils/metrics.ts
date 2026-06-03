import { MetricConfig, NormalizedMetrics, CalculationResult, PercentileStats } from '../types/index'

/**
 * Metric Calculation and Normalization Engine
 * Handles metric normalization, weighting, and score calculation
 */

/**
 * Normalize a single metric using specified normalization type
 */
export function normalizeMetric(
  value: number | null | undefined,
  config: MetricConfig,
  stats: PercentileStats
): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0
  }

  let normalized = 0

  switch (config.normalizationType) {
    case 'minMax':
      normalized = normalizeMinMax(value, stats.min, stats.max)
      break

    case 'zScore':
      normalized = normalizeZScore(value, stats.mean, stats.stdDev)
      break

    case 'percentile':
      normalized = normalizePercentile(value, stats)
      break

    default:
      normalized = value
  }

  // Apply inverse if needed
  if (config.inverse) {
    normalized = 1 - normalized
  }

  return Math.max(0, Math.min(1, normalized)) // Clamp to 0-1
}

/**
 * Min-Max normalization: (value - min) / (max - min)
 */
export function normalizeMinMax(value: number, min: number, max: number): number {
  if (max === min) return 0.5 // Handle edge case
  return (value - min) / (max - min)
}

/**
 * Z-Score normalization: (value - mean) / stdDev
 * Maps to 0-1 range (approximately)
 */
export function normalizeZScore(
  value: number,
  mean: number,
  stdDev: number
): number {
  if (stdDev === 0) return 0.5
  const zScore = (value - mean) / stdDev
  // Use sigmoid function to map to 0-1
  return 1 / (1 + Math.exp(-zScore))
}

/**
 * Percentile normalization
 */
export function normalizePercentile(value: number, stats: PercentileStats): number {
  if (value <= stats.p10) return 0
  if (value >= stats.p90) return 1

  if (value <= stats.p50) {
    return (value - stats.p10) / (stats.p50 - stats.p10) * 0.5
  } else {
    return 0.5 + ((value - stats.p50) / (stats.p90 - stats.p50)) * 0.5
  }
}

/**
 * Calculate statistics for a metric across all players
 */
export function calculateMetricStats(values: (number | null | undefined)[]): PercentileStats {
  const validValues = values.filter((v) => v !== null && v !== undefined && !isNaN(v)) as number[]

  if (validValues.length === 0) {
    return {
      p10: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      min: 0,
      max: 0,
      mean: 0,
      stdDev: 0,
      count: 0,
    }
  }

  validValues.sort((a, b) => a - b)

  const min = validValues[0]
  const max = validValues[validValues.length - 1]
  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length

  const variance =
    validValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    validValues.length
  const stdDev = Math.sqrt(variance)

  const getPercentile = (p: number): number => {
    const index = (p / 100) * (validValues.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1

    if (lower === upper) {
      return validValues[lower]
    }

    return validValues[lower] * (1 - weight) + validValues[upper] * weight
  }

  return {
    p10: getPercentile(10),
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
    min,
    max,
    mean,
    stdDev,
    count: validValues.length,
  }
}

/**
 * Calculate weighted metric score for a player
 */
export function calculateWeightedMetricScore(
  playerData: Record<string, any>,
  metricConfigs: MetricConfig[],
  metricsStats: Map<string, PercentileStats>
): { score: number; normalizedMetrics: NormalizedMetrics } {
  const enabledMetrics = metricConfigs.filter((m) => m.enabled)
  const normalizedMetrics: NormalizedMetrics = {}

  if (enabledMetrics.length === 0) {
    return { score: 0, normalizedMetrics }
  }

  let totalWeight = 0
  let weightedSum = 0

  for (const metric of enabledMetrics) {
    const value = playerData[metric.columnName]
    const stats = metricsStats.get(metric.columnName)

    if (stats) {
      const normalized = normalizeMetric(value, metric, stats)
      normalizedMetrics[metric.name] = normalized
      weightedSum += normalized * metric.weight
      totalWeight += metric.weight
    }
  }

  const score = totalWeight > 0 ? weightedSum / totalWeight : 0

  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimals
    normalizedMetrics,
  }
}

/**
 * Get player's percentile rank among all players
 */
export function calculatePercentileRank(
  playerScore: number,
  allScores: number[]
): number {
  const sortedScores = allScores.sort((a, b) => a - b)
  const rank = sortedScores.filter((s) => s < playerScore).length
  return (rank / sortedScores.length) * 100
}

/**
 * Validate metric configuration
 */
export function validateMetricConfig(config: MetricConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.name || config.name.trim() === '') {
    errors.push('Metric name is required')
  }
  if (!config.columnName || config.columnName.trim() === '') {
    errors.push('Column name is required')
  }
  if (config.weight < 0 || config.weight > 100) {
    errors.push('Weight must be between 0 and 100')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate metric configurations
 */
export function validateMetricConfigs(
  configs: MetricConfig[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (configs.length === 0) {
    errors.push('At least one metric is required')
    return { isValid: false, errors }
  }

  const enabledMetrics = configs.filter((m) => m.enabled)
  if (enabledMetrics.length === 0) {
    errors.push('At least one metric must be enabled')
  }

  for (const config of configs) {
    const validation = validateMetricConfig(config)
    if (!validation.isValid) {
      errors.push(`Invalid metric "${config.name}": ${validation.errors.join(', ')}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Create default metric config
 */
export function createDefaultMetricConfig(columnName: string, index: number): MetricConfig {
  return {
    id: `metric-${Date.now()}-${index}`,
    name: columnName,
    columnName,
    weight: 100 / (index + 1), // Distribute weights
    enabled: true,
    normalizationType: 'minMax',
    inverse: false,
    description: '',
  }
}

/**
 * Normalize all metrics for all players at once
 * Returns a map of playerId -> normalized metrics
 */
export function normalizeAllMetrics(
  players: Array<{ id: string; statistics: Record<string, any> }>,
  metricConfigs: MetricConfig[]
): Map<string, NormalizedMetrics> {
  const result = new Map<string, NormalizedMetrics>()

  // Calculate stats for each metric
  const metricStats = new Map<string, PercentileStats>()
  for (const metric of metricConfigs.filter((m) => m.enabled)) {
    const values = players.map((p) => p.statistics[metric.columnName])
    metricStats.set(metric.columnName, calculateMetricStats(values))
  }

  // Normalize for each player
  for (const player of players) {
    const normalized: NormalizedMetrics = {}
    for (const metric of metricConfigs.filter((m) => m.enabled)) {
      const value = player.statistics[metric.columnName]
      const stats = metricStats.get(metric.columnName)!
      normalized[metric.name] = normalizeMetric(value, metric, stats)
    }
    result.set(player.id, normalized)
  }

  return result
}

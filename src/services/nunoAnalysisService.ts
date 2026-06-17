import {
  Player,
  Role,
  PlayerAnalysis,
  MetricConfig,
  PercentileStats,
} from '../types/index'
import {
  calculateWeightedMetricScore,
  calculateMetricStats,
  calculatePercentileRank,
} from '../utils/metrics'
import { evaluateFormula } from '../utils/formula'

export interface NunoRoleConfig {
  attributes: MetricConfig[]
  metrics: MetricConfig[]
  formula: string
}

export const DEFAULT_NUNO_FORMULA = '(AttributeScore * 0.6) + (MetricScore * 0.4)'

export const NUNO_FORMULA_VARIABLES = [
  'AttributeScore',
  'MetricScore',
  'Age',
  'MinutesPlayed',
  'MarketValue',
]

/**
 * Calculate Nuno analyses for all players.
 * The returned PlayerAnalysis is shaped so the existing scouting table renderer can be reused:
 *  - customMetricScore  ← AttributeScore (0..1)
 *  - fmdatalabRoleScore ← MetricScore    (0..100)
 *  - finalScore         ← formula result
 */
export function calculateNunoAnalyses(
  players: Player[],
  role: Role,
  config: NunoRoleConfig,
  customAttributes: Record<string, Record<string, number>>
): PlayerAnalysis[] {
  // Build attribute "statistics" per player from customAttributes
  const playersForAttrs = players.map((p) => ({
    id: p.id,
    statistics: customAttributes[p.id] || {},
  }))

  const attrStats = new Map<string, PercentileStats>()
  for (const m of config.attributes.filter((m) => m.enabled)) {
    const values = playersForAttrs.map((p) => p.statistics[m.columnName] as number | null | undefined)
    attrStats.set(m.columnName, calculateMetricStats(values))
  }

  const metricStats = new Map<string, PercentileStats>()
  for (const m of config.metrics.filter((m) => m.enabled)) {
    const values = players.map((p) => {
      const v = p.statistics[m.columnName]
      if (typeof v === 'number') return v
      if (typeof v === 'string') {
        const n = Number.parseFloat(v)
        return Number.isNaN(n) ? null : n
      }
      return null
    })
    metricStats.set(m.columnName, calculateMetricStats(values))
  }

  const analyses: PlayerAnalysis[] = players.map((p) => {
    const attrPlayerData = customAttributes[p.id] || {}
    const { score: attributeScore01 } = calculateWeightedMetricScore(
      attrPlayerData,
      config.attributes,
      attrStats
    )
    const { score: metricScore01 } = calculateWeightedMetricScore(
      p.statistics,
      config.metrics,
      metricStats
    )

    const attributeScore = attributeScore01 * 100
    const metricScore = metricScore01 * 100

    const { result: finalScore } = evaluateFormula(config.formula, {
      AttributeScore: attributeScore,
      MetricScore: metricScore,
      Age: p.age,
      MinutesPlayed: p.minutes,
      MarketValue: p.marketValue || 0,
    })

    return {
      playerId: p.id,
      playerName: p.playerName,
      club: p.club,
      age: p.age,
      position: p.position,
      minutes: p.minutes,
      role,
      metrics: {},
      customMetricScore: attributeScore01, // stays 0..1 so ScoreBar with max=1 still works
      fmdatalabRoleScore: metricScore,
      finalScore,
      percentile: 0,
    }
  })

  const finalScores = analyses.map((a) => a.finalScore)
  const customScores = analyses.map((a) => a.customMetricScore)

  return analyses
    .map((a) => ({
      ...a,
      customMetricPercentile: calculatePercentileRank(a.customMetricScore, customScores),
      percentile: calculatePercentileRank(a.finalScore, finalScores),
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((a, idx) => ({ ...a, rank: idx + 1 }))
}

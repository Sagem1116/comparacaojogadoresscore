/**
 * Core data types for FM Scouting Engine
 * All types are dynamically driven from imported CSV data
 */

// ==================== PLAYER TYPES ====================

export interface PlayerStatistics extends Record<string, string | number | null | undefined> {
  playerName: string
  club: string
  age: number
  position: string
  minutes: number
  marketValue?: number
}

export interface PlayerRoleScores extends Record<string, string | number | null | undefined> {
  playerName: string
  club: string
  age: number
}

export interface Player {
  id: string // UUID or composite key
  playerName: string
  club: string
  age: number
  position: string
  minutes: number
  marketValue?: number
  statistics: PlayerStatistics
  roleScores: PlayerRoleScores
  metrics?: { [key: string]: number }
  finalScore?: number
  rank?: number
}

// ==================== DATASET TYPES ====================

export interface Dataset {
  id: string
  name: string
  type: 'statistics' | 'roleScores'
  uploadedAt: string
  rowCount: number
  columns: string[]
  data: any[]
}

export interface ImportedData {
  statistics?: Dataset
  roleScores?: Dataset
  detectedRoles: string[]
  players: Player[]
  playerCount: number
}

// ==================== METRIC TYPES ====================

export interface MetricConfig {
  id: string
  name: string
  columnName: string
  weight: number
  enabled: boolean
  normalizationType: 'minMax' | 'zScore' | 'percentile'
  inverse: boolean // If true, higher values = lower score
  threshold?: number
  description?: string
}

export interface MetricProfile {
  id: string
  roleId: string
  roleName: string
  metrics: MetricConfig[]
  lastModified: string
  description?: string
}

export interface NormalizedMetrics {
  [metricName: string]: number
}

// ==================== ROLE TYPES ====================

export interface Role {
  id: string
  name: string
  columnName: string // The exact column name from CSV (e.g., "Ball Winning Midfielder Score")
  description?: string
  fmdatalabScore?: number // Raw FMDataLab score value
  detectedAt: string
  isActive: boolean
}

export interface RoleConfiguration {
  id: string
  roleId: string
  roleName: string
  metricProfile: MetricProfile
  finalScoreFormula: string
  customMetricWeight: number
  roleScoreWeight: number
  created: string
  lastModified: string
  description?: string
}

// ==================== FORMULA TYPES ====================

export enum FormulaVariableType {
  CustomMetricScore = 'CustomMetricScore',
  RoleScore = 'RoleScore',
  Age = 'Age',
  MinutesPlayed = 'MinutesPlayed',
  MarketValue = 'MarketValue',
  StatisticColumn = 'StatisticColumn', // Any imported metric column
}

export interface FormulaVariable {
  name: string
  type: FormulaVariableType
  columnName?: string // For StatisticColumn type
  value?: number
}

export interface FormulaValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface Formula {
  id: string
  roleId: string
  expression: string
  variables: FormulaVariable[]
  validation: FormulaValidation
  created: string
  lastModified: string
}

// ==================== ANALYSIS TYPES ====================

export interface PlayerAnalysis {
  playerId: string
  playerName: string
  club: string
  age: number
  position: string
  minutes: number
  role: Role
  metrics: {
    [metricName: string]: {
      rawValue: number
      normalizedValue: number
      weight: number
      contribution: number
    }
  }
  customMetricScore: number
  customMetricPercentile?: number
  fmdatalabRoleScore: number
  finalScore: number
  percentile: number
  rank?: number
  explanation?: string
}

export interface AnalysisView {
  id: string
  name: string
  roleId: string
  roleName: string
  players: PlayerAnalysis[]
  created: string
  lastModified: string
  filters?: FilterCriteria[]
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

// ==================== FILTER & SORT TYPES ====================

export interface FilterCriteria {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in'
  value: any
  caseSensitive?: boolean
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface TableState {
  columnVisibility: { [columnKey: string]: boolean }
  sorting: SortConfig[]
  filters: FilterCriteria[]
  pagination: {
    pageIndex: number
    pageSize: number
  }
  globalFilter?: string
}

// ==================== CONFIGURATION TYPES ====================

export interface ScoutingConfiguration {
  id: string
  name: string
  roles: Role[]
  metricProfiles: MetricProfile[]
  formulas: Formula[]
  views: AnalysisView[]
  created: string
  lastModified: string
}

export interface ExportedConfiguration {
  version: string
  exportedAt: string
  configuration: ScoutingConfiguration
  metadata: {
    description?: string
    author?: string
    tags?: string[]
  }
}

// ==================== CALCULATION TYPES ====================

export interface PercentileStats {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  p95: number
  p99: number
  min: number
  max: number
  mean: number
  stdDev: number
  count: number
}

export interface CalculationResult {
  customMetricScore: number
  normalizedMetrics: NormalizedMetrics
  fmdatalabRoleScore: number
  finalScore: number
  percentile: number
  details: {
    [metricName: string]: {
      rawValue: number
      normalizedValue: number
      weight: number
    }
  }
}

export interface PercentileStats {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  p95: number
  p99: number
  min: number
  max: number
  mean: number
  stdDev: number
}

// ==================== PROFILE TYPES ====================

export interface PlayerProfileData {
  player: Player
  analysis: PlayerAnalysis
  percentiles: {
    [metricName: string]: number
  }
  radar: {
    [metricName: string]: number
  }
  trends?: {
    [metricName: string]: number[]
  }
  comparison?: {
    similar: Player[]
    position: Player[]
  }
}

// ==================== DASHBOARD TYPES ====================

export interface DashboardMetrics {
  totalPlayers: number
  rolesCount: number
  averageScore: number
  topPlayerScore: number
  highestMetric: string
  lowestMetric: string
}

export interface TopPlayersResult {
  topRanked: PlayerAnalysis[]
  youngestTalents: PlayerAnalysis[]
  bestValue: PlayerAnalysis[]
  highestMetricScore: PlayerAnalysis[]
  highestRoleScore: PlayerAnalysis[]
}

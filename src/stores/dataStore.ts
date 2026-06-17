import { create } from 'zustand'
import {
  Player,
  Dataset,
  ImportedData,
  Role,
  MetricProfile,
  RoleConfiguration,
  AnalysisView,
  TableState,
  ScoutingConfiguration,
  ExportedConfiguration,
  FilterCriteria,
  SortConfig,
} from '../types/index'
import type { NunoRoleConfig } from '../services/nunoAnalysisService'

/**
 * Global State Management using Zustand
 * Manages all data import, configuration, and analysis states
 */

interface DataStore {
  // Data Import State
  statisticsDataset: Dataset | null
  roleScoresDataset: Dataset | null
  players: Player[]
  detectedRoles: Role[]
  importProgress: number
  importError: string | null

  // Custom (Nuno) attributes — optional 3rd CSV/HTML
  customAttributes: Record<string, Record<string, number>>
  customAttributeColumns: string[]
  nunoRoleWeights: Record<string, Record<string, number>> // legacy
  nunoConfigs: Record<string, NunoRoleConfig>

  // Configuration State
  roles: Map<string, Role>
  metricProfiles: Map<string, MetricProfile>
  roleConfigurations: Map<string, RoleConfiguration>

  // UI State
  currentRole: Role | null
  currentView: AnalysisView | null
  tableState: TableState
  isLoading: boolean

  // Analysis Results
  analyses: Map<string, AnalysisView>
  selectedPlayers: Set<string>

  // Actions - Data Import
  setStatisticsDataset: (dataset: Dataset) => void
  setRoleScoresDataset: (dataset: Dataset) => void
  setPlayers: (players: Player[]) => void
  setDetectedRoles: (roles: Role[]) => void
  setImportProgress: (progress: number) => void
  setImportError: (error: string | null) => void
  setCustomAttributes: (attrs: Record<string, Record<string, number>>, columns: string[]) => void
  clearCustomAttributes: () => void
  setNunoRoleWeights: (roleId: string, weights: Record<string, number>) => void
  setNunoConfig: (roleId: string, config: NunoRoleConfig) => void
  clearNunoConfig: (roleId: string) => void
  clearImport: () => void

  // Actions - Configuration
  addRole: (role: Role) => void
  removeRole: (roleId: string) => void
  updateRole: (roleId: string, updates: Partial<Role>) => void

  addMetricProfile: (profile: MetricProfile) => void
  updateMetricProfile: (profileId: string, updates: Partial<MetricProfile>) => void
  removeMetricProfile: (profileId: string) => void

  addRoleConfiguration: (config: RoleConfiguration) => void
  updateRoleConfiguration: (configId: string, updates: Partial<RoleConfiguration>) => void
  removeRoleConfiguration: (configId: string) => void

  // Actions - UI State
  selectRole: (role: Role | null) => void
  selectView: (view: AnalysisView | null) => void
  setTableState: (state: Partial<TableState>) => void
  togglePlayerSelection: (playerId: string) => void
  clearSelection: () => void
  setLoading: (isLoading: boolean) => void

  // Actions - Analysis
  saveAnalysis: (analysis: AnalysisView) => void
  removeAnalysis: (analysisId: string) => void
  getAnalysis: (analysisId: string) => AnalysisView | undefined

  // Actions - Export/Import
  exportConfiguration: () => ExportedConfiguration
  importConfiguration: (config: ExportedConfiguration) => void
  resetAll: () => void
}

const initialTableState: TableState = {
  columnVisibility: {},
  sorting: [],
  filters: [],
  pagination: {
    pageIndex: 0,
    pageSize: 50,
  },
  globalFilter: '',
}

const STORAGE_KEY_CUSTOM_ATTRS = 'nuno-custom-attributes-v1'
const STORAGE_KEY_NUNO_WEIGHTS = 'nuno-role-weights-v1'
const STORAGE_KEY_NUNO_CONFIGS = 'nuno-configs-v2'

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveJSON(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota errors
  }
}

const initialCustomAttrs = loadJSON<{
  customAttributes: Record<string, Record<string, number>>
  customAttributeColumns: string[]
}>(STORAGE_KEY_CUSTOM_ATTRS, { customAttributes: {}, customAttributeColumns: [] })

const initialNunoWeights = loadJSON<Record<string, Record<string, number>>>(
  STORAGE_KEY_NUNO_WEIGHTS,
  {}
)
const initialNunoConfigs = loadJSON<Record<string, NunoRoleConfig>>(
  STORAGE_KEY_NUNO_CONFIGS,
  {}
)

export const useDataStore = create<DataStore>((set, get) => ({
  // Initial State
  statisticsDataset: null,
  roleScoresDataset: null,
  players: [],
  detectedRoles: [],
  importProgress: 0,
  importError: null,

  customAttributes: initialCustomAttrs.customAttributes,
  customAttributeColumns: initialCustomAttrs.customAttributeColumns,
  nunoRoleWeights: initialNunoWeights,
  nunoConfigs: initialNunoConfigs,

  roles: new Map(),
  metricProfiles: new Map(),
  roleConfigurations: new Map(),

  currentRole: null,
  currentView: null,
  tableState: initialTableState,
  isLoading: false,

  analyses: new Map(),
  selectedPlayers: new Set(),

  // Data Import Actions
  setStatisticsDataset: (dataset) =>
    set({ statisticsDataset: dataset, importProgress: 33 }),

  setRoleScoresDataset: (dataset) =>
    set({ roleScoresDataset: dataset, importProgress: 66 }),

  setPlayers: (players) =>
    set({ players, importProgress: 100 }),

  setDetectedRoles: (roles) =>
    set({
      detectedRoles: roles,
      roles: new Map(roles.map((r) => [r.id, r])),
    }),

  setImportProgress: (progress) => set({ importProgress: progress }),

  setImportError: (error) => set({ importError: error }),

  setCustomAttributes: (attrs, columns) => {
    saveJSON(STORAGE_KEY_CUSTOM_ATTRS, { customAttributes: attrs, customAttributeColumns: columns })
    set({ customAttributes: attrs, customAttributeColumns: columns })
  },

  clearCustomAttributes: () => {
    saveJSON(STORAGE_KEY_CUSTOM_ATTRS, { customAttributes: {}, customAttributeColumns: [] })
    set({ customAttributes: {}, customAttributeColumns: [] })
  },

  setNunoRoleWeights: (roleId, weights) => {
    const next = { ...get().nunoRoleWeights, [roleId]: weights }
    saveJSON(STORAGE_KEY_NUNO_WEIGHTS, next)
    set({ nunoRoleWeights: next })
  },

  setNunoConfig: (roleId, config) => {
    const next = { ...get().nunoConfigs, [roleId]: config }
    saveJSON(STORAGE_KEY_NUNO_CONFIGS, next)
    set({ nunoConfigs: next })
  },

  clearNunoConfig: (roleId) => {
    const next = { ...get().nunoConfigs }
    delete next[roleId]
    saveJSON(STORAGE_KEY_NUNO_CONFIGS, next)
    set({ nunoConfigs: next })
  },

  clearImport: () =>
    set({
      statisticsDataset: null,
      roleScoresDataset: null,
      players: [],
      detectedRoles: [],
      importProgress: 0,
      importError: null,
      roles: new Map(),
      metricProfiles: new Map(),
      roleConfigurations: new Map(),
    }),

  // Configuration Actions
  addRole: (role) => {
    const { roles } = get()
    const newRoles = new Map(roles)
    newRoles.set(role.id, role)
    set({ roles: newRoles })
  },

  removeRole: (roleId) => {
    const { roles, roleConfigurations, metricProfiles } = get()
    const newRoles = new Map(roles)
    newRoles.delete(roleId)

    // Also remove associated configurations
    const newConfigs = new Map(roleConfigurations)
    for (const [id, config] of newConfigs) {
      if (config.roleId === roleId) {
        newConfigs.delete(id)
      }
    }

    set({ roles: newRoles, roleConfigurations: newConfigs })
  },

  updateRole: (roleId, updates) => {
    const { roles } = get()
    const role = roles.get(roleId)
    if (role) {
      const newRoles = new Map(roles)
      newRoles.set(roleId, { ...role, ...updates })
      set({ roles: newRoles })
    }
  },

  addMetricProfile: (profile) => {
    const { metricProfiles } = get()
    const newProfiles = new Map(metricProfiles)
    newProfiles.set(profile.id, profile)
    set({ metricProfiles: newProfiles })
  },

  updateMetricProfile: (profileId, updates) => {
    const { metricProfiles } = get()
    const profile = metricProfiles.get(profileId)
    if (profile) {
      const newProfiles = new Map(metricProfiles)
      newProfiles.set(profileId, { ...profile, ...updates })
      set({ metricProfiles: newProfiles })
    }
  },

  removeMetricProfile: (profileId) => {
    const { metricProfiles } = get()
    const newProfiles = new Map(metricProfiles)
    newProfiles.delete(profileId)
    set({ metricProfiles: newProfiles })
  },

  addRoleConfiguration: (config) => {
    const { roleConfigurations } = get()
    const newConfigs = new Map(roleConfigurations)
    newConfigs.set(config.id, config)
    set({ roleConfigurations: newConfigs })
  },

  updateRoleConfiguration: (configId, updates) => {
    const { roleConfigurations } = get()
    const config = roleConfigurations.get(configId)
    if (config) {
      const newConfigs = new Map(roleConfigurations)
      newConfigs.set(configId, { ...config, ...updates })
      set({ roleConfigurations: newConfigs })
    }
  },

  removeRoleConfiguration: (configId) => {
    const { roleConfigurations } = get()
    const newConfigs = new Map(roleConfigurations)
    newConfigs.delete(configId)
    set({ roleConfigurations: newConfigs })
  },

  // UI State Actions
  selectRole: (role) => set({ currentRole: role }),

  selectView: (view) => set({ currentView: view }),

  setTableState: (updates) =>
    set(({ tableState }) => ({
      tableState: { ...tableState, ...updates },
    })),

  togglePlayerSelection: (playerId) => {
    const { selectedPlayers } = get()
    const newSelection = new Set(selectedPlayers)
    if (newSelection.has(playerId)) {
      newSelection.delete(playerId)
    } else {
      newSelection.add(playerId)
    }
    set({ selectedPlayers: newSelection })
  },

  clearSelection: () => set({ selectedPlayers: new Set() }),

  setLoading: (isLoading) => set({ isLoading }),

  // Analysis Actions
  saveAnalysis: (analysis) => {
    const { analyses } = get()
    const newAnalyses = new Map(analyses)
    newAnalyses.set(analysis.id, analysis)
    set({ analyses: newAnalyses })
  },

  removeAnalysis: (analysisId) => {
    const { analyses } = get()
    const newAnalyses = new Map(analyses)
    newAnalyses.delete(analysisId)
    set({ analyses: newAnalyses })
  },

  getAnalysis: (analysisId) => {
    const { analyses } = get()
    return analyses.get(analysisId)
  },

  // Export/Import Actions
  exportConfiguration: () => {
    const {
      roles,
      metricProfiles,
      roleConfigurations,
      analyses,
    } = get()

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      configuration: {
        id: `config-${Date.now()}`,
        name: 'FM Scouting Configuration',
        roles: Array.from(roles.values()),
        metricProfiles: Array.from(metricProfiles.values()),
        formulas: Array.from(roleConfigurations.values()).map((rc) => ({
          id: rc.id,
          roleId: rc.roleId,
          expression: rc.finalScoreFormula,
          variables: [],
          validation: { isValid: true, errors: [], warnings: [] },
          created: rc.created,
          lastModified: rc.lastModified,
        })),
        views: Array.from(analyses.values()),
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      metadata: {
        description: 'FM Scouting Engine configuration export',
        author: 'User',
        tags: ['scouting', 'configuration'],
      },
    }
  },

  importConfiguration: (config) => {
    const rolesMap = new Map(config.configuration.roles.map((r) => [r.id, r]))
    const profilesMap = new Map(config.configuration.metricProfiles.map((p) => [p.id, p]))

    // Build role configurations from formulas
    const configsMap = new Map(
      config.configuration.views.map((v) => [v.id, { ...v } as unknown as RoleConfiguration])
    )

    set({
      roles: rolesMap,
      metricProfiles: profilesMap,
      roleConfigurations: configsMap,
    })
  },

  resetAll: () =>
    set({
      statisticsDataset: null,
      roleScoresDataset: null,
      players: [],
      detectedRoles: [],
      importProgress: 0,
      importError: null,
      roles: new Map(),
      metricProfiles: new Map(),
      roleConfigurations: new Map(),
      currentRole: null,
      currentView: null,
      tableState: initialTableState,
      isLoading: false,
      analyses: new Map(),
      selectedPlayers: new Set(),
    }),
}))

import { useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDataStore } from '../../stores/dataStore'
import { Plus, Trash2, Save, ChevronLeft, AlertCircle, Download, UploadCloud } from 'lucide-react'
import { MetricConfig, Role, MetricProfile, RoleConfiguration } from '../../types/index'
import { createDefaultMetricConfig, validateMetricConfigs } from '../../utils/metrics'
import { validateFormula } from '../../utils/formula'

interface FormulaTemplate {
  expression: string
  description: string
  category?: string
}

const FORMULA_TEMPLATES: Record<string, FormulaTemplate> = {
  'Equilibrado 70/30': {
    category: 'Geral',
    expression: '(CustomMetricScore * 0.7) + (RoleScore * 0.3)',
    description: 'Padrão recomendado: 70% das tuas métricas customizadas e 30% do role score do FMDataLab. Bom ponto de partida para qualquer posição.',
  },
  'Equilibrado 50/50': {
    category: 'Geral',
    expression: '(CustomMetricScore * 0.5) + (RoleScore * 0.5)',
    description: 'Peso igual entre as métricas customizadas e o role score. Útil quando confias tanto na tua avaliação como na do FMDataLab.',
  },
  'Métricas Custom Puras': {
    category: 'Geral',
    expression: 'CustomMetricScore * 100',
    description: 'Usa apenas as tuas métricas selecionadas, ignorando o role score. Ideal quando queres controlo total sobre a avaliação.',
  },
  'Role Score Puro': {
    category: 'Geral',
    expression: 'RoleScore',
    description: 'Confia totalmente no role score do FMDataLab. Útil para comparar rapidamente sem configurar métricas.',
  },
  'Talento Jovem': {
    category: 'Perfil',
    expression: '(CustomMetricScore * 0.45) + (RoleScore * 0.25) + ((30 - Age) * 1.0)',
    description: 'Destaca jogadores com menos de 30 anos: cada ano abaixo dessa idade adiciona pontos. Excelente para identificar promessas.',
  },
  'Sub-23 Premium': {
    category: 'Perfil',
    expression: '(CustomMetricScore * 0.5) + (RoleScore * 0.3) + ((23 - Age) * 2)',
    description: 'Foco agressivo em jovens até 23 anos. Penaliza jogadores mais velhos para fazer destacar as próximas estrelas.',
  },
  'Veterano Experiente': {
    category: 'Perfil',
    expression: '(CustomMetricScore * 0.4) + (RoleScore * 0.4) + (MinutesPlayed / 90 * 0.2)',
    description: 'Premeia jogadores com performance consolidada e muitos minutos jogados. Ideal para contratações de impacto imediato.',
  },
  'Titularidade Comprovada': {
    category: 'Perfil',
    expression: '((CustomMetricScore * 0.6) + (RoleScore * 0.4)) * (MinutesPlayed / 2000)',
    description: 'Multiplica a performance pela proporção de minutos jogados (base 2000). Filtra naturalmente jogadores com pouca utilização.',
  },
  'Caça-Pechinchas': {
    category: 'Valor',
    expression: '((CustomMetricScore * 0.6) + (RoleScore * 0.4)) / (1 + (MarketValue / 5000000))',
    description: 'Divide o score pelo valor de mercado (escala 5M). Quanto mais barato e melhor o jogador, maior a pontuação final.',
  },
  'Valor por Milhão': {
    category: 'Valor',
    expression: '(CustomMetricScore * 0.7 + RoleScore * 0.3) / (1 + MarketValue / 1000000)',
    description: 'Calcula performance por milhão investido. Excelente para clubes com orçamento limitado que procuram máximo retorno.',
  },
  'Investimento Seguro': {
    category: 'Valor',
    expression: '(CustomMetricScore * 0.5) + (RoleScore * 0.4) + (MinutesPlayed / 90 * 0.1)',
    description: 'Combina performance, fit ao role e regularidade. Reduz o risco ao priorizar jogadores já testados em campo.',
  },
  'Performance Pura': {
    category: 'Tático',
    expression: '(CustomMetricScore * 0.85) + (RoleScore * 0.15)',
    description: 'Foco quase total nas tuas métricas customizadas. Usa quando tens uma definição muito clara do perfil que procuras.',
  },
  'Criativo / Playmaker': {
    category: 'Tático',
    expression: '(CustomMetricScore * 0.6) + (RoleScore * 0.25) + (MinutesPlayed / 90 * 0.15)',
    description: 'Equilibra criatividade (métricas) com fit no papel e minutos. Ideal para médios criadores e número 10.',
  },
  'Finalizador': {
    category: 'Tático',
    expression: '(CustomMetricScore * 0.75) + (RoleScore * 0.25)',
    description: 'Peso elevado nas métricas customizadas, perfeito para perfis ofensivos onde golos e finalização dominam a avaliação.',
  },
  'Defensivo Sólido': {
    category: 'Tático',
    expression: '(CustomMetricScore * 0.4) + (RoleScore * 0.5) + (MinutesPlayed / 90 * 0.1)',
    description: 'Dá maior peso ao role score (defesa exige consistência tática) e valoriza minutos jogados como sinal de confiança do treinador.',
  },
  'Híbrido com Idade': {
    category: 'Geral',
    expression: '(CustomMetricScore * 0.55) + (RoleScore * 0.3) + ((28 - Age) * 0.5)',
    description: 'Combinação flexível que dá ligeiro bónus a jogadores abaixo dos 28 anos sem penalizar excessivamente os mais velhos.',
  },
}

/**
 * Role Configuration Page Component
 * Allows users to configure metrics and formulas for a specific role
 */
export default function RoleConfigurationPage() {
  const navigate = useNavigate()
  const { roleId } = useParams()

  const players = useDataStore((state) => state.players)
  const roles = useDataStore((state) => state.roles)
  const roleConfigurations = useDataStore((state) => state.roleConfigurations)
  const addMetricProfile = useDataStore((state) => state.addMetricProfile)
  const addRoleConfiguration = useDataStore((state) => state.addRoleConfiguration)
  const updateMetricProfile = useDataStore((state) => state.updateMetricProfile)
  const updateRoleConfiguration = useDataStore((state) => state.updateRoleConfiguration)
  const selectRole = useDataStore((state) => state.selectRole)

  const role = roleId ? roles.get(roleId) : null
  const [metrics, setMetrics] = useState<MetricConfig[]>([])
  const [formula, setFormula] = useState<string>('(CustomMetricScore * 0.7) + (RoleScore * 0.3)')
  const [formulaError, setFormulaError] = useState<string>('')
  const [metricsError, setMetricsError] = useState<string>('')
  const [importError, setImportError] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Get available metric columns from imported data
  const availableMetrics = useMemo(() => {
    if (players.length === 0) return []

    const player = players[0]
    const excludePatterns = ['player', 'club', 'age', 'position', 'name', 'id', 'role', 'score']

    return Object.keys(player.statistics).filter((key) => {
      const lowerKey = key.toLowerCase()
      return !excludePatterns.some((pattern) => lowerKey.includes(pattern))
    })
  }, [players])

  const sortedRoles = useMemo(() => Array.from(roles.values()).sort((a, b) => a.name.localeCompare(b.name)), [roles])

  const handleRoleSelect = (selectedRole: Role) => {
    navigate(`/configuration/${selectedRole.id}`)
  }

  const handleImportClick = () => {
    setImportError('')
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('')
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const imported = JSON.parse(text) as {
        roleId?: string
        roleName?: string
        metrics?: MetricConfig[]
        formula?: string
      }

      if (!imported || !Array.isArray(imported.metrics) || typeof imported.formula !== 'string') {
        throw new Error('Invalid configuration file format.')
      }

      if (!role) {
        throw new Error('No role selected for import.')
      }

      if (imported.roleId && imported.roleId !== role.id) {
        // Allow import if role names match, even if IDs differ
        if (imported.roleName && imported.roleName !== role.name) {
          throw new Error(`The imported configuration is for role ${imported.roleName}, not ${role.name}.`)
        }
      }

      const normalizedMetrics: MetricConfig[] = imported.metrics.map((metric, index) => ({
        id: typeof metric.id === 'string' && metric.id ? metric.id : `metric-${Date.now()}-${index}`,
        name: typeof metric.name === 'string' ? metric.name : `Metric ${index + 1}`,
        columnName: typeof metric.columnName === 'string' ? metric.columnName : '',
        weight: typeof metric.weight === 'number' ? metric.weight : 1,
        enabled: typeof metric.enabled === 'boolean' ? metric.enabled : true,
        normalizationType:
          metric.normalizationType === 'zScore' || metric.normalizationType === 'percentile'
            ? metric.normalizationType
            : 'minMax',
        inverse: typeof metric.inverse === 'boolean' ? metric.inverse : false,
        threshold: typeof metric.threshold === 'number' ? metric.threshold : undefined,
        description: typeof metric.description === 'string' ? metric.description : undefined,
      }))

      setMetrics(normalizedMetrics)
      handleFormulaChange(imported.formula)
      setImportError('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import configuration.'
      setImportError(message)
    } finally {
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleAddMetric = () => {
    if (metrics.length >= 20) {
      setMetricsError('Maximum 20 metrics allowed')
      return
    }

    const newMetric = createDefaultMetricConfig(availableMetrics[metrics.length] || '', metrics.length)
    setMetrics([...metrics, newMetric])
    setMetricsError('')
  }

  const handleRemoveMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index))
  }

  const handleMetricChange = (index: number, updates: Partial<MetricConfig>) => {
    const newMetrics = [...metrics]
    newMetrics[index] = { ...newMetrics[index], ...updates }
    setMetrics(newMetrics)
  }

  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula)

    // Validate formula
    const validation = validateFormula(newFormula, [
      'CustomMetricScore',
      'RoleScore',
      'Age',
      'MinutesPlayed',
      'MarketValue',
    ])

    if (!validation.isValid) {
      setFormulaError(validation.errors[0] || 'Invalid formula')
    } else {
      setFormulaError('')
    }
  }

  const handleSave = async () => {
    // Validate metrics
    const metricsValidation = validateMetricConfigs(metrics)
    if (!metricsValidation.isValid) {
      setMetricsError(metricsValidation.errors[0])
      return
    }

    // Validate formula
    const formulaValidation = validateFormula(formula, [
      'CustomMetricScore',
      'RoleScore',
      'Age',
      'MinutesPlayed',
      'MarketValue',
    ])
    if (!formulaValidation.isValid) {
      setFormulaError(formulaValidation.errors[0])
      return
    }

    if (!role) {
      setMetricsError('No role selected')
      return
    }

    setIsSaving(true)

    try {
      const existingConfiguration = Array.from(roleConfigurations.values()).find(
        (configuration) => configuration.roleId === role.id
      )

      const profileId = existingConfiguration?.metricProfile.id ?? `profile-${Date.now()}`
      const configId = existingConfiguration?.id ?? `config-${Date.now()}`

      const profile: MetricProfile = {
        id: profileId,
        roleId: role.id,
        roleName: role.name,
        metrics,
        lastModified: new Date().toISOString(),
        description: `Metrics for ${role.name}`,
      }

      const config: RoleConfiguration = {
        id: configId,
        roleId: role.id,
        roleName: role.name,
        metricProfile: profile,
        finalScoreFormula: formula,
        customMetricWeight: 70,
        roleScoreWeight: 30,
        created: existingConfiguration?.created ?? new Date().toISOString(),
        lastModified: new Date().toISOString(),
      }

      addMetricProfile(profile)
      addRoleConfiguration(config)

      if (existingConfiguration) {
        updateMetricProfile(profileId, profile)
        updateRoleConfiguration(configId, config)
      }

      selectRole(role)

      // Redirect to scouting page
      setTimeout(() => {
        navigate('/scouting')
      }, 500)
    } finally {
      setIsSaving(false)
    }
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.16),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%),#020617] py-8 px-4 text-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="panel p-8 mb-6">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm uppercase tracking-[0.24em] text-violet-300">
                Role configuration
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Configure your scouting roles</h2>
                <p className="mt-3 text-slate-400">
                  {roleId
                    ? `The requested role could not be found. Select a different role below or import data.`
                    : 'Choose a role to configure your custom scouting metrics and formula.'}
                </p>
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Available roles</h3>
                <p className="text-sm text-slate-400">Select a role to continue.</p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm text-slate-200">
                {sortedRoles.length} roles available
              </span>
            </div>
            {sortedRoles.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-4">
                <p className="text-lg">No detected roles available yet.</p>
                <button onClick={() => navigate('/import')} className="btn-primary">
                  Import Data
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedRoles.map((availableRole) => (
                  <button
                    key={availableRole.id}
                    onClick={() => handleRoleSelect(availableRole)}
                    className="card p-4 text-left border border-slate-800 bg-slate-900 hover:border-blue-500 transition-colors"
                  >
                    <p className="text-sm text-slate-400 mb-2">Role</p>
                    <p className="text-lg font-semibold text-slate-100">{availableRole.name}</p>
                    <p className="text-xs text-slate-500 mt-2">Detected at {new Date(availableRole.detectedAt).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const exportCurrentConfiguration = () => {
    if (!role) return

    const exportObject = {
      roleId: role.id,
      roleName: role.name,
      metrics,
      formula,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
      type: 'application/json',
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${role.name.replace(/\s+/g, '_').toLowerCase()}_configuration.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.16),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%),#020617] py-10 px-4 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="panel p-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm text-slate-300 transition hover:border-violet-500 hover:text-white mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to dashboard
          </button>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/10 px-4 py-2 text-sm uppercase tracking-[0.24em] text-violet-300">
              Role configuration
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Configure {role.name}</h1>
              <p className="mt-3 text-slate-400 max-w-3xl">
                Set up metrics and formulas for {role.name} so your scouting analysis delivers role-specific insights.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_0.95fr]">
          <div className="panel p-6 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Metrics</h2>
                <p className="text-sm text-slate-400">Choose the metric columns used in this role.</p>
              </div>
              <button
                onClick={handleAddMetric}
                disabled={metrics.length >= 20}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Metric
              </button>
            </div>

            {metricsError && (
              <div className="rounded-3xl border border-red-700/60 bg-red-950/70 p-4 text-sm text-red-200">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{metricsError}</span>
                </div>
              </div>
            )}

            {metrics.length === 0 ? (
              <div className="rounded-3xl border border-slate-800/70 bg-slate-900/90 p-8 text-center text-slate-400">
                <p className="mb-2 text-white">No metrics added yet</p>
                <p className="text-sm">Click the button above to begin building your scoring profile.</p>
              </div>
            ) : (
              <div className="space-y-2">

                {metrics.map((metric, idx) => (
                  <MetricRow
                    key={idx}
                    metric={metric}
                    index={idx}
                    availableMetrics={availableMetrics}
                    onChange={(updates) => handleMetricChange(idx, updates)}
                    onRemove={() => handleRemoveMetric(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="panel p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Formula</h2>
                <p className="text-sm text-slate-400">Build your final scoring formula.</p>
              </div>

              {formulaError && (
                <div className="rounded-3xl border border-red-700/60 bg-red-950/70 p-4 text-sm text-red-200">
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{formulaError}</span>
                  </div>
                </div>
              )}

              <label className="block text-sm font-medium text-slate-300">Final score formula</label>
              <textarea
                value={formula}
                onChange={(e) => handleFormulaChange(e.target.value)}
                className="input-field h-28 font-mono text-sm"
                placeholder="e.g., (CustomMetricScore * 0.7) + (RoleScore * 0.3)"
              />

              <div className="rounded-3xl border border-slate-800/70 bg-slate-900/90 p-4 text-sm text-slate-400">
                <p className="mb-3 font-semibold text-slate-200">Available variables</p>
                <div className="grid gap-1 text-xs sm:grid-cols-2">
                  <span>• CustomMetricScore</span>
                  <span>• RoleScore</span>
                  <span>• Age</span>
                  <span>• MinutesPlayed</span>
                  <span>• MarketValue</span>
                </div>
              </div>
            </div>

            <div className="panel p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Templates de fórmulas</h3>
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-violet-300">
                  {Object.keys(FORMULA_TEMPLATES).length} presets
                </span>
              </div>
              <p className="mb-4 text-xs leading-5 text-slate-500">
                Clica num template para preencher a fórmula. Podes editá-la depois manualmente.
              </p>
              {(() => {
                const grouped = Object.entries(FORMULA_TEMPLATES).reduce<Record<string, Array<[string, FormulaTemplate]>>>(
                  (acc, entry) => {
                    const cat = entry[1].category || 'Outros'
                    acc[cat] = acc[cat] || []
                    acc[cat].push(entry)
                    return acc
                  },
                  {}
                )
                const order = ['Geral', 'Perfil', 'Tático', 'Valor', 'Outros']
                const sortedCats = Object.keys(grouped).sort(
                  (a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
                )
                return (
                  <div className="space-y-5">
                    {sortedCats.map((cat) => (
                      <div key={cat}>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-300/80">{cat}</p>
                        <div className="grid gap-2">
                          {grouped[cat].map(([name, template]) => {
                            const isActive = formula.trim() === template.expression.trim()
                            return (
                              <button
                                key={name}
                                onClick={() => handleFormulaChange(template.expression)}
                                title={template.description}
                                className={`group text-left rounded-2xl border px-4 py-3 text-sm transition ${
                                  isActive
                                    ? 'border-violet-400 bg-violet-500/10 text-violet-100 shadow-[0_0_0_1px_rgba(167,139,250,0.25)]'
                                    : 'border-slate-800/80 bg-slate-950/90 text-slate-200 hover:border-violet-500/70 hover:bg-slate-900'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-semibold">{name}</p>
                                  {isActive && (
                                    <span className="rounded-full bg-violet-500/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-100">
                                      ativo
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1.5 break-all font-mono text-[11px] text-slate-500">{template.expression}</p>
                                <p className="mt-2 text-xs leading-5 text-slate-400">{template.description}</p>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={handleSave}
            disabled={isSaving || metrics.length === 0}
            className="btn-primary w-full"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Configuration & Analyze'}
          </button>
          <button
            onClick={exportCurrentConfiguration}
            type="button"
            className="rounded-full border border-slate-700 bg-slate-950/90 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-blue-400 hover:text-blue-200"
          >
            <Download className="w-4 h-4 inline-block mr-2" />
            Export Role Config
          </button>
          <button
            onClick={handleImportClick}
            type="button"
            className="rounded-full border border-slate-700 bg-slate-950/90 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-blue-400 hover:text-blue-200"
          >
            <UploadCloud className="w-4 h-4 inline-block mr-2" />
            Import Role Config
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        {importError ? (
          <div className="rounded-3xl border border-red-600 bg-red-950/50 p-4 text-sm text-red-200">
            <strong>Import error:</strong> {importError}
          </div>
        ) : null}
      </div>
    </div>
  )
}

interface MetricRowProps {
  metric: MetricConfig
  index: number
  availableMetrics: string[]
  onChange: (updates: Partial<MetricConfig>) => void
  onRemove: () => void
}

function MetricRow({
  metric,
  index,
  availableMetrics,
  onChange,
  onRemove,
}: MetricRowProps) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-2.5 space-y-2 transition hover:border-violet-500/40">
      <div className="flex gap-2 items-end">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1 block">Metric</label>
          <select
            value={metric.columnName}
            onChange={(e) => onChange({ columnName: e.target.value, name: e.target.value })}
            className="input-field text-xs py-1.5 px-2 rounded-lg"
          >
            <option value="">Select metric...</option>
            {availableMetrics.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
        <div className="w-16">
          <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1 block">Weight</label>
          <input
            type="number"
            value={metric.weight}
            onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
            className="input-field text-xs py-1.5 px-2 rounded-lg"
            min="0"
            max="100"
          />
        </div>
        <div className="w-24">
          <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1 block">Norm.</label>
          <select
            value={metric.normalizationType}
            onChange={(e) =>
              onChange({ normalizationType: e.target.value as MetricConfig['normalizationType'] })
            }
            className="input-field text-xs py-1.5 px-2 rounded-lg"
          >
            <option value="minMax">Min-Max</option>
            <option value="zScore">Z-Score</option>
            <option value="percentile">Pctl</option>
          </select>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 text-red-400 hover:bg-red-950/60 rounded-lg transition-colors"
          aria-label="Remove metric"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-4 pl-0.5">
        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={metric.inverse}
            onChange={(e) => onChange({ inverse: e.target.checked })}
            className="rounded h-3 w-3"
          />
          <span>Inverse</span>
        </label>
        <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-slate-300">
          <input
            type="checkbox"
            checked={metric.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="rounded h-3 w-3"
          />
          <span>Enabled</span>
        </label>
      </div>
    </div>
  )
}

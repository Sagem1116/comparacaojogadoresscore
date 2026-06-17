import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '../../stores/dataStore'
import { Plus, Trash2, Save, Sparkles, Upload, AlertCircle, BarChart3 } from 'lucide-react'
import { MetricConfig } from '../../types/index'
import { validateMetricConfigs } from '../../utils/metrics'
import { validateFormula } from '../../utils/formula'
import { DEFAULT_NUNO_FORMULA, NUNO_FORMULA_VARIABLES } from '../../services/nunoAnalysisService'

const FORMULA_TEMPLATES: Record<string, { expression: string; description: string }> = {
  'Equilibrado 60/40': {
    expression: '(AttributeScore * 0.6) + (MetricScore * 0.4)',
    description: 'Combina atributos (FM) e métricas (estatísticas) com peso maior nos atributos.',
  },
  'Equilibrado 50/50': {
    expression: '(AttributeScore * 0.5) + (MetricScore * 0.5)',
    description: 'Peso igual entre atributos e métricas.',
  },
  'Só Atributos': {
    expression: 'AttributeScore',
    description: 'Usa apenas a pontuação dos atributos.',
  },
  'Só Métricas': {
    expression: 'MetricScore',
    description: 'Usa apenas a pontuação das métricas estatísticas.',
  },
  'Métricas dominantes': {
    expression: '(AttributeScore * 0.3) + (MetricScore * 0.7)',
    description: '70% métricas, 30% atributos — confia mais no rendimento real.',
  },
  'Talento Jovem': {
    expression: '(AttributeScore * 0.45) + (MetricScore * 0.35) + ((30 - Age) * 2)',
    description: 'Bonifica jogadores com menos de 30 anos.',
  },
  'Caça-pechinchas': {
    expression: '((AttributeScore * 0.5) + (MetricScore * 0.5)) / (1 + MarketValue / 5000000)',
    description: 'Divide o score pelo valor de mercado — privilegia barato + bom.',
  },
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function createConfig(columnName: string): MetricConfig {
  return {
    id: uid('metric'),
    name: columnName,
    columnName,
    weight: 10,
    enabled: true,
    normalizationType: 'minMax',
    inverse: false,
  }
}

export default function NunoScoresPage() {
  const navigate = useNavigate()
  const players = useDataStore((s) => s.players)
  const detectedRoles = useDataStore((s) => s.detectedRoles)
  const customAttributeColumns = useDataStore((s) => s.customAttributeColumns)
  const customAttributes = useDataStore((s) => s.customAttributes)
  const nunoConfigs = useDataStore((s) => s.nunoConfigs)
  const setNunoConfig = useDataStore((s) => s.setNunoConfig)
  const clearCustomAttributes = useDataStore((s) => s.clearCustomAttributes)

  const [selectedRoleId, setSelectedRoleId] = useState<string>(detectedRoles[0]?.id || '')
  const [attributes, setAttributes] = useState<MetricConfig[]>([])
  const [metrics, setMetrics] = useState<MetricConfig[]>([])
  const [formula, setFormula] = useState(DEFAULT_NUNO_FORMULA)
  const [formulaError, setFormulaError] = useState('')
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const availableMetrics = useMemo(() => {
    if (players.length === 0) return []
    const exclude = ['player', 'club', 'age', 'position', 'name', 'id', 'role', 'score']
    return Object.keys(players[0].statistics).filter((k) => {
      const l = k.toLowerCase()
      return !exclude.some((p) => l.includes(p))
    })
  }, [players])

  useEffect(() => {
    if (!selectedRoleId && detectedRoles[0]) setSelectedRoleId(detectedRoles[0].id)
  }, [detectedRoles, selectedRoleId])

  // Load config when role changes
  useEffect(() => {
    const cfg = nunoConfigs[selectedRoleId]
    if (cfg) {
      setAttributes(cfg.attributes)
      setMetrics(cfg.metrics)
      setFormula(cfg.formula || DEFAULT_NUNO_FORMULA)
    } else {
      setAttributes([])
      setMetrics([])
      setFormula(DEFAULT_NUNO_FORMULA)
    }
    setError('')
    setFormulaError('')
  }, [selectedRoleId, nunoConfigs])

  const matchedPlayerCount = Object.keys(customAttributes).length

  const handleAddAttribute = () => {
    if (customAttributeColumns.length === 0) {
      setError('Importa primeiro um ficheiro de atributos.')
      return
    }
    const available = customAttributeColumns.find((c) => !attributes.some((a) => a.columnName === c))
    setAttributes([...attributes, createConfig(available || customAttributeColumns[0])])
  }

  const handleAddMetric = () => {
    if (availableMetrics.length === 0) {
      setError('Sem métricas disponíveis nos dados Statistics.')
      return
    }
    const available = availableMetrics.find((c) => !metrics.some((m) => m.columnName === c))
    setMetrics([...metrics, createConfig(available || availableMetrics[0])])
  }

  const updateAttr = (i: number, u: Partial<MetricConfig>) => {
    const next = [...attributes]
    next[i] = { ...next[i], ...u }
    setAttributes(next)
  }
  const updateMetric = (i: number, u: Partial<MetricConfig>) => {
    const next = [...metrics]
    next[i] = { ...next[i], ...u }
    setMetrics(next)
  }

  const handleFormulaChange = (f: string) => {
    setFormula(f)
    const v = validateFormula(f, NUNO_FORMULA_VARIABLES)
    setFormulaError(v.isValid ? '' : v.errors[0] || 'Fórmula inválida')
  }

  const handleSave = (navigateAfter = false) => {
    if (!selectedRoleId) {
      setError('Seleciona uma role.')
      return
    }
    if (attributes.length === 0 && metrics.length === 0) {
      setError('Adiciona pelo menos um atributo ou métrica.')
      return
    }
    if (attributes.length > 0) {
      const v = validateMetricConfigs(attributes)
      if (!v.isValid) {
        setError(`Atributos: ${v.errors[0]}`)
        return
      }
    }
    if (metrics.length > 0) {
      const v = validateMetricConfigs(metrics)
      if (!v.isValid) {
        setError(`Métricas: ${v.errors[0]}`)
        return
      }
    }
    const fv = validateFormula(formula, NUNO_FORMULA_VARIABLES)
    if (!fv.isValid) {
      setFormulaError(fv.errors[0])
      return
    }
    setError('')
    setNunoConfig(selectedRoleId, { attributes, metrics, formula })
    setSavedAt(Date.now())
    if (navigateAfter) {
      setTimeout(() => navigate('/scouting-nuno-scores'), 400)
    }
  }

  if (customAttributeColumns.length === 0 && players.length === 0) {
    return (
      <div className="min-h-screen px-4 py-10 text-slate-100">
        <div className="max-w-3xl mx-auto panel p-10 text-center space-y-5">
          <Sparkles className="mx-auto h-10 w-10 text-violet-300" />
          <h1 className="text-3xl font-bold text-white">Nuno Scores</h1>
          <p className="text-slate-400">
            Começa por importar os ficheiros base em <strong>Importar CSV</strong>. O ficheiro de atributos (HTML do FM) é opcional mas dá-te a pontuação de atributos.
          </p>
          <button onClick={() => navigate('/import')} className="btn-primary inline-flex items-center gap-2">
            <Upload className="w-4 h-4" /> Ir para Importar
          </button>
        </div>
      </div>
    )
  }

  if (detectedRoles.length === 0) {
    return (
      <div className="min-h-screen px-4 py-10 text-slate-100">
        <div className="max-w-3xl mx-auto panel p-10 text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Sem roles disponíveis</h1>
          <p className="text-slate-400">Importa primeiro Statistics + Role Scores.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="panel p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-violet-300">Nuno Scores</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Configuração de scores personalizados</h1>
            <p className="mt-2 text-sm text-slate-400">
              {customAttributeColumns.length} atributos disponíveis · {matchedPlayerCount} jogadores com atributos · {availableMetrics.length} métricas
            </p>
          </div>
          <div className="flex gap-2">
            {customAttributeColumns.length > 0 && (
              <button
                onClick={clearCustomAttributes}
                className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs text-rose-200 hover:bg-rose-500/15"
              >
                <Trash2 className="w-4 h-4" /> Limpar atributos
              </button>
            )}
            <button onClick={() => navigate('/scouting-nuno-scores')} className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-xs text-violet-200 hover:bg-violet-500/15">
              <BarChart3 className="w-4 h-4" /> Abrir Scouting Nuno
            </button>
          </div>
        </header>

        <section className="panel p-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.22em] text-slate-400">Role a configurar</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-violet-400"
            >
              {detectedRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          {error && (
            <div className="rounded-2xl border border-red-700/60 bg-red-950/70 p-3 text-sm text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" /> {error}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Atributos */}
          <section className="panel p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Atributos (Nuno)</h2>
                <p className="text-xs text-slate-400">Vêm do HTML do FM. Pesos 0–100.</p>
              </div>
              <button
                onClick={handleAddAttribute}
                disabled={customAttributeColumns.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
            {attributes.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Nenhum atributo selecionado.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 table-scrollbar">
                {attributes.map((a, i) => (
                  <ConfigRow
                    key={a.id}
                    config={a}
                    options={customAttributeColumns}
                    onChange={(u) => updateAttr(i, u)}
                    onRemove={() => setAttributes(attributes.filter((_, k) => k !== i))}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Métricas */}
          <section className="panel p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Métricas (Statistics)</h2>
                <p className="text-xs text-slate-400">Colunas estatísticas. Pesos 0–100.</p>
              </div>
              <button
                onClick={handleAddMetric}
                disabled={availableMetrics.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
            {metrics.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Nenhuma métrica selecionada.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 table-scrollbar">
                {metrics.map((m, i) => (
                  <ConfigRow
                    key={m.id}
                    config={m}
                    options={availableMetrics}
                    onChange={(u) => updateMetric(i, u)}
                    onRemove={() => setMetrics(metrics.filter((_, k) => k !== i))}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Formula */}
        <section className="panel p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Fórmula do Score Final</h2>
            <p className="text-xs text-slate-400">
              Variáveis: <span className="font-mono text-violet-300">AttributeScore</span>, <span className="font-mono text-cyan-300">MetricScore</span>, Age, MinutesPlayed, MarketValue
            </p>
          </div>
          <textarea
            value={formula}
            onChange={(e) => handleFormulaChange(e.target.value)}
            className="input-field h-24 font-mono text-sm"
            placeholder={DEFAULT_NUNO_FORMULA}
          />
          {formulaError && (
            <div className="rounded-2xl border border-red-700/60 bg-red-950/70 p-3 text-sm text-red-200">{formulaError}</div>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400 mb-2">Templates rápidos</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(FORMULA_TEMPLATES).map(([name, t]) => (
                <button
                  key={name}
                  onClick={() => handleFormulaChange(t.expression)}
                  className={`text-left rounded-2xl border px-4 py-3 text-sm transition ${
                    formula.trim() === t.expression.trim()
                      ? 'border-violet-400 bg-violet-500/10 text-violet-100'
                      : 'border-slate-800 bg-slate-950/90 text-slate-200 hover:border-violet-500/70'
                  }`}
                >
                  <p className="font-semibold">{name}</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-500 break-all">{t.expression}</p>
                  <p className="mt-1.5 text-xs text-slate-400">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {savedAt && (
            <span className="text-xs text-emerald-300 self-center">✓ Guardado</span>
          )}
          <button
            onClick={() => handleSave(false)}
            className="rounded-full border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm hover:border-violet-400"
          >
            <Save className="w-4 h-4 inline-block mr-2" /> Guardar configuração
          </button>
          <button onClick={() => handleSave(true)} className="btn-primary">
            <BarChart3 className="w-4 h-4 inline-block mr-2" /> Guardar & abrir Scouting Nuno
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfigRow({
  config,
  options,
  onChange,
  onRemove,
}: {
  config: MetricConfig
  options: string[]
  onChange: (u: Partial<MetricConfig>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-2.5 space-y-2 hover:border-violet-500/40 transition">
      <div className="flex gap-2 items-end">
        <div className="flex-1 min-w-0">
          <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1 block">Coluna</label>
          <select
            value={config.columnName}
            onChange={(e) => onChange({ columnName: e.target.value, name: e.target.value })}
            className="input-field text-xs py-1.5 px-2 rounded-lg"
          >
            <option value="">Seleciona...</option>
            {options.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="w-16">
          <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1 block">Peso</label>
          <input
            type="number"
            min={0}
            max={100}
            value={config.weight}
            onChange={(e) => onChange({ weight: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
            className="input-field text-xs py-1.5 px-2 rounded-lg"
          />
        </div>
        <div className="w-24">
          <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1 block">Norm.</label>
          <select
            value={config.normalizationType}
            onChange={(e) => onChange({ normalizationType: e.target.value as MetricConfig['normalizationType'] })}
            className="input-field text-xs py-1.5 px-2 rounded-lg"
          >
            <option value="minMax">Min-Max</option>
            <option value="zScore">Z-Score</option>
            <option value="percentile">Pctl</option>
          </select>
        </div>
        <button onClick={onRemove} className="p-1.5 text-red-400 hover:bg-red-950/60 rounded-lg" aria-label="Remover">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-4 pl-0.5">
        <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={config.inverse}
            onChange={(e) => onChange({ inverse: e.target.checked })}
            className="rounded h-3 w-3"
          />
          <span>Inverse (menor é melhor)</span>
        </label>
        <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="rounded h-3 w-3"
          />
          <span>Ativo</span>
        </label>
      </div>
    </div>
  )
}

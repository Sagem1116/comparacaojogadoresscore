import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  PanelTop,
  Shield,
  Sparkles,
  Target,
  Users,
  Edit3,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Download,
  Save,
  Upload,
} from 'lucide-react'
import { metricasInfoNunoData } from '../../data/metricasInfoNuno'
import type { MetricCategoryInfo, MetricInfoItem } from '../../data/metricasInfo'

const cloneData = () => JSON.parse(JSON.stringify(metricasInfoNunoData)) as MetricCategoryInfo[]
const STORAGE_KEY = 'metricas-info-nuno-editor-data'

const loadStoredData = () => {
  if (typeof window === 'undefined') return null
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved) as MetricCategoryInfo[]
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export default function MetricInfoNunoPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [metricData, setMetricData] = useState<MetricCategoryInfo[]>(() => loadStoredData() ?? cloneData())
  const [editingRoleKey, setEditingRoleKey] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const allCategories = ['Todos', ...metricData.map((category) => category.category)]

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metricData))
    setSaveStatus('Salvo localmente')
  }, [metricData])

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return metricData
      .filter((group) => activeCategory === 'Todos' || group.category === activeCategory)
      .map((group) => ({
        ...group,
        roles: group.roles.filter((role) => {
          if (!normalizedSearch) return true
          const haystack = `${role.name} ${role.description} ${role.metrics
            .map((metric) => `${metric.name} ${metric.description}`)
            .join(' ')}`.toLowerCase()
          return haystack.includes(normalizedSearch)
        }),
      }))
      .filter((group) => group.roles.length > 0)
  }, [activeCategory, metricData, search])

  const totalRoles = metricData.reduce((sum, group) => sum + group.roles.length, 0)
  const totalMetrics = metricData.reduce(
    (sum, group) => sum + group.roles.reduce((roleSum, role) => roleSum + role.metrics.length, 0),
    0
  )

  const updateRole = (categoryIndex: number, roleIndex: number, updates: Partial<MetricCategoryInfo['roles'][number]>) => {
    setMetricData((current) =>
      current.map((group, groupIndex) =>
        groupIndex === categoryIndex
          ? {
              ...group,
              roles: group.roles.map((role, rolePosition) =>
                rolePosition === roleIndex ? { ...role, ...updates } : role
              ),
            }
          : group
      )
    )
  }

  const updateMetric = (
    categoryIndex: number,
    roleIndex: number,
    metricIndex: number,
    updates: Partial<MetricInfoItem>
  ) => {
    setMetricData((current) =>
      current.map((group, groupIndex) =>
        groupIndex === categoryIndex
          ? {
              ...group,
              roles: group.roles.map((role, rolePosition) =>
                rolePosition === roleIndex
                  ? {
                      ...role,
                      metrics: role.metrics.map((metric, metricPosition) =>
                        metricPosition === metricIndex ? { ...metric, ...updates } : metric
                      ),
                    }
                  : role
              ),
            }
          : group
      )
    )
  }

  const addMetric = (categoryIndex: number, roleIndex: number) => {
    setMetricData((current) =>
      current.map((group, groupIndex) =>
        groupIndex === categoryIndex
          ? {
              ...group,
              roles: group.roles.map((role, rolePosition) =>
                rolePosition === roleIndex
                  ? {
                      ...role,
                      metrics: [
                        ...role.metrics,
                        { name: 'Nova métrica', weight: 5, description: 'Atualize a descrição desta métrica.', inverse: false },
                      ],
                    }
                  : role
              ),
            }
          : group
      )
    )
  }

  const removeMetric = (categoryIndex: number, roleIndex: number, metricIndex: number) => {
    setMetricData((current) =>
      current.map((group, groupIndex) =>
        groupIndex === categoryIndex
          ? {
              ...group,
              roles: group.roles.map((role, rolePosition) =>
                rolePosition === roleIndex
                  ? { ...role, metrics: role.metrics.filter((_, itemIndex) => itemIndex !== metricIndex) }
                  : role
              ),
            }
          : group
      )
    )
  }

  const resetEdits = () => {
    setMetricData(cloneData)
    setEditingRoleKey(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    setSaveStatus('Dados originais (Nuno) restaurados')
  }

  const exportCurrentData = () => {
    const blob = new Blob([JSON.stringify(metricData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'metricas-info-nuno-edited.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setSaveStatus('Exportação pronta para download')
  }

  const importDataFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as MetricCategoryInfo[]
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Arquivo inválido. Envie um JSON com categorias e funções.')
      }
      const isValid = parsed.every((group) =>
        typeof group.category === 'string' &&
        Array.isArray(group.roles) &&
        group.roles.every(
          (role) =>
            typeof role.name === 'string' &&
            typeof role.description === 'string' &&
            Array.isArray(role.metrics) &&
            role.metrics.every(
              (metric) =>
                typeof metric.name === 'string' &&
                typeof metric.description === 'string' &&
                typeof metric.weight === 'number'
            )
        )
      )
      if (!isValid) throw new Error('O JSON não segue o formato esperado.')
      setMetricData(parsed)
      setEditingRoleKey(null)
      setSaveStatus('Importação concluída')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível importar o arquivo.'
      setSaveStatus(message)
    } finally {
      if (event.target) event.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="panel overflow-hidden p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                <Sparkles className="h-4 w-4" />
                Métricas Info — Nuno
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Pesos personalizados de atributos e métricas
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-slate-300">
                  Os teus pesos por role, divididos em <span className="text-emerald-300 font-semibold">Atributos</span> (FM)
                  e <span className="text-emerald-300 font-semibold">Métricas-chave</span> (dados do jogo). Edita à vontade —
                  fica guardado no browser.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1">{metricData.length} categorias</span>
                <span className="rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1">{totalRoles} roles</span>
                <span className="rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1">{totalMetrics} itens</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <SummaryStat label="Categorias" value={metricData.length} icon={<PanelTop className="h-4 w-4" />} />
              <SummaryStat label="Roles" value={totalRoles} icon={<Users className="h-4 w-4" />} />
              <SummaryStat label="Itens" value={totalMetrics} icon={<Shield className="h-4 w-4" />} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetEdits}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm text-slate-100 transition hover:border-emerald-500"
            >
              <RotateCcw className="h-4 w-4" />
              Repor dados originais
            </button>
            <button
              type="button"
              onClick={exportCurrentData}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm text-slate-100 transition hover:border-emerald-500"
            >
              <Download className="h-4 w-4" />
              Exportar JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm text-slate-100 transition hover:border-emerald-500"
            >
              <Upload className="h-4 w-4" />
              Importar JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importDataFromFile} />
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
              <Save className="h-4 w-4" />
              {saveStatus || 'Salvas automáticas no navegador'}
            </span>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="panel p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Busca rápida</p>
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                  <Search className="h-4 w-4 text-emerald-300" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por role, atributo ou métrica"
                    className="w-full border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Filtrar por categoria</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {allCategories.map((category) => {
                    const isActive = activeCategory === category
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                            : 'border border-slate-800 bg-slate-900/90 text-slate-200'
                        }`}
                      >
                        {category}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Resumo do filtro</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {filteredGroups.length} categorias com conteúdo visível
                </p>
              </div>
              <div className="rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-sm text-slate-200">
                {search ? 'Busca ativa' : 'Todos os conteúdos'}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {filteredGroups.map((group) => (
                <div key={group.category} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-emerald-200">{group.category}</p>
                      <p className="mt-2 text-sm text-slate-300">{group.roles.length} roles disponíveis</p>
                    </div>
                    <Target className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {filteredGroups.map((group) => (
            <div key={group.category} className="panel p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-200">{group.category}</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">{group.category}</h2>
                </div>
                <span className="rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-sm text-slate-200">
                  {group.roles.length} roles
                </span>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {group.roles.map((role, roleIndex) => {
                  const categoryIndex = metricData.findIndex((item) => item.category === group.category)
                  const roleKey = `${group.category}-${roleIndex}`
                  const isEditing = editingRoleKey === roleKey

                  return (
                    <article key={roleKey} className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-5">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Nome do role</label>
                            <input
                              value={role.name}
                              onChange={(event) => updateRole(categoryIndex, roleIndex, { name: event.target.value })}
                              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Descrição</label>
                            <textarea
                              value={role.description}
                              onChange={(event) => updateRole(categoryIndex, roleIndex, { description: event.target.value })}
                              rows={3}
                              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none"
                            />
                          </div>
                          <div className="space-y-3">
                            {role.metrics.map((metric, metricIndex) => (
                              <div key={`${roleKey}-${metric.name}-${metricIndex}`} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                                <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr_3fr_auto] md:items-end">
                                  <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Nome</label>
                                    <input
                                      value={metric.name}
                                      onChange={(event) => updateMetric(categoryIndex, roleIndex, metricIndex, { name: event.target.value })}
                                      className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Peso (%)</label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={metric.weight}
                                      onChange={(event) =>
                                        updateMetric(categoryIndex, roleIndex, metricIndex, { weight: Number(event.target.value) || 0 })
                                      }
                                      className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Descrição</label>
                                    <input
                                      value={metric.description}
                                      onChange={(event) => updateMetric(categoryIndex, roleIndex, metricIndex, { description: event.target.value })}
                                      className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
                                    />
                                  </div>
                                  <div className="flex items-center gap-3 md:justify-end">
                                    <label className="flex items-center gap-2 text-sm text-slate-200">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(metric.inverse)}
                                        onChange={(event) =>
                                          updateMetric(categoryIndex, roleIndex, metricIndex, { inverse: event.target.checked })
                                        }
                                        className="rounded border-slate-700 bg-slate-950"
                                      />
                                      Invertido
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => removeMetric(categoryIndex, roleIndex, metricIndex)}
                                      className="rounded-full border border-red-500/30 bg-red-500/10 p-2 text-red-200 transition hover:bg-red-500/20"
                                      aria-label="Remover"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => addMetric(categoryIndex, roleIndex)}
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                            >
                              <Plus className="h-4 w-4" />
                              Adicionar item
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRoleKey(null)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm text-slate-100 transition hover:border-emerald-500"
                            >
                              <Check className="h-4 w-4" />
                              Concluir edição
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                              <p className="mt-3 text-sm leading-relaxed text-slate-300">{role.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                                {role.metrics.length} itens
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingRoleKey(roleKey)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 transition hover:border-emerald-500"
                              >
                                <Edit3 className="h-4 w-4" />
                                Editar
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {role.metrics.map((metric) => (
                              <div key={`${roleKey}-${metric.name}`} className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-100">{metric.name}</p>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{metric.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-100">
                                      {metric.weight}%
                                    </span>
                                    {metric.inverse && (
                                      <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                                        Invertido
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="panel p-10 text-center">
              <p className="text-lg font-semibold text-white">Nenhum role encontrado</p>
              <p className="mt-2 text-sm text-slate-300">Tente outro termo de busca ou outra categoria.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SummaryStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-900/90 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-full border border-slate-800 bg-slate-950/90 p-2 text-emerald-200">{icon}</div>
      </div>
    </div>
  )
}

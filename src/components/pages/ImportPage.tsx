import React, { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { useDataStore } from '../../stores/dataStore'
import { importScoutingData, validateImportFiles, getFileSizeMB, isFileTooLarge } from '../../services/importService'
import { parseCSV, extractPlayerInfoColumns } from '../../utils/csvParser'
import { parseFMAttributesHTML } from '../../utils/fmHtmlParser'
import { useNavigate } from 'react-router-dom'
import type { Player } from '../../types/index'

/**
 * Import Page Component
 * Handles CSV import workflow with progress tracking
 */

const ATTR_EXCLUDED = new Set([
  'player', 'name', 'club', 'team', 'age', 'position', 'pos', 'id', 'uid',
  'minutes', 'mins', 'nationality', 'nation', 'nat', 'foot', 'preferred foot',
  'inf', 'rec', 'height', 'weight', 'wage', 'salary', 'value', 'transfer value',
  'expires', 'contract', 'caps', 'goals',
])

function isAttributeColumn(header: string): boolean {
  const lower = header.toLowerCase().trim()
  if (!lower) return false
  return !ATTR_EXCLUDED.has(lower)
}


function normalizeKey(s: any) {
  return String(s ?? '').toLowerCase().trim()
}

export interface AttrImportDebug {
  fileType: 'html' | 'csv'
  totalHeaders: number
  totalRows: number
  info: {
    uid?: string
    playerName: string
    club: string
  }
  ignoredColumns: { header: string; reason: string }[]
  acceptedColumns: string[]
  matchBreakdown: {
    byUid: number
    byNameClub: number
    byName: number
    unmatched: number
  }
  unmatchedSamples: { uid: string; name: string; club: string }[]
  playersIndexed: { withUid: number; total: number }
}

async function processAttributesFile(
  file: File,
  players: Player[]
): Promise<{
  attrs: Record<string, Record<string, number>>
  columns: string[]
  matched: number
  debug: AttrImportDebug
}> {
  const isHtml = /\.(html?|htm)$/i.test(file.name)
  const parsed = isHtml ? await parseFMAttributesHTML(file) : await parseCSV(file)
  const info = extractPlayerInfoColumns(parsed.headers)

  const ignoredColumns: { header: string; reason: string }[] = []
  const numericColumns: string[] = []

  for (const header of parsed.headers) {
    if (!isAttributeColumn(header)) {
      ignoredColumns.push({ header, reason: 'excluído (info do jogador: nome/clube/idade/posição/uid/…)' })
      continue
    }
    let numericCount = 0
    let total = 0
    for (let i = 0; i < Math.min(parsed.rows.length, 50); i++) {
      const v = parsed.rows[i][header]
      if (v === null || v === undefined || v === '') continue
      total += 1
      if (typeof v === 'number' || !Number.isNaN(Number(v))) numericCount += 1
    }
    if (total === 0) {
      ignoredColumns.push({ header, reason: 'sem valores nas primeiras 50 linhas' })
    } else if (numericCount / total < 0.8) {
      ignoredColumns.push({
        header,
        reason: `apenas ${Math.round((numericCount / total) * 100)}% numérico (mínimo 80%)`,
      })
    } else {
      numericColumns.push(header)
    }
  }

  // Index players by UID (preferred), then name+club, then name only
  const byUid = new Map<string, Player>()
  const byNameClub = new Map<string, Player>()
  const byName = new Map<string, Player>()
  let withUid = 0
  for (const p of players) {
    if (p.uid) {
      byUid.set(normalizeKey(p.uid), p)
      withUid += 1
    }
    byNameClub.set(`${normalizeKey(p.playerName)}|${normalizeKey(p.club)}`, p)
    byName.set(normalizeKey(p.playerName), p)
  }

  const attrs: Record<string, Record<string, number>> = {}
  let matched = 0
  const breakdown = { byUid: 0, byNameClub: 0, byName: 0, unmatched: 0 }
  const unmatchedSamples: { uid: string; name: string; club: string }[] = []

  for (const row of parsed.rows) {
    const uid = info.uid ? normalizeKey(row[info.uid]) : ''
    const name = normalizeKey(row[info.playerName])
    const club = normalizeKey(row[info.club])

    let player: Player | undefined
    let how: 'byUid' | 'byNameClub' | 'byName' | null = null
    if (uid && byUid.get(uid)) {
      player = byUid.get(uid)
      how = 'byUid'
    } else if (name && byNameClub.get(`${name}|${club}`)) {
      player = byNameClub.get(`${name}|${club}`)
      how = 'byNameClub'
    } else if (name && byName.get(name)) {
      player = byName.get(name)
      how = 'byName'
    }

    if (!player || !how) {
      breakdown.unmatched += 1
      if (unmatchedSamples.length < 8) unmatchedSamples.push({ uid, name, club })
      continue
    }

    breakdown[how] += 1
    matched += 1
    const playerAttrs: Record<string, number> = {}
    for (const col of numericColumns) {
      const v = row[col]
      const num = typeof v === 'number' ? v : Number(v)
      if (Number.isFinite(num)) playerAttrs[col] = num
    }
    attrs[player.id] = playerAttrs
  }

  const debug: AttrImportDebug = {
    fileType: isHtml ? 'html' : 'csv',
    totalHeaders: parsed.headers.length,
    totalRows: parsed.rows.length,
    info: { uid: info.uid, playerName: info.playerName, club: info.club },
    ignoredColumns,
    acceptedColumns: numericColumns,
    matchBreakdown: breakdown,
    unmatchedSamples,
    playersIndexed: { withUid, total: players.length },
  }

  return { attrs, columns: numericColumns, matched, debug }
}


export default function ImportPage() {
  const navigate = useNavigate()
  const setPlayers = useDataStore((state) => state.setPlayers)
  const setDetectedRoles = useDataStore((state) => state.setDetectedRoles)
  const setImportProgress = useDataStore((state) => state.setImportProgress)
  const setCustomAttributes = useDataStore((state) => state.setCustomAttributes)
  const clearCustomAttributes = useDataStore((state) => state.clearCustomAttributes)
  const customAttributeColumns = useDataStore((state) => state.customAttributeColumns)

  const [statisticsFile, setStatisticsFile] = useState<File | null>(null)
  const [roleScoresFile, setRoleScoresFile] = useState<File | null>(null)
  const [attributesFile, setAttributesFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [importStats, setImportStats] = useState<any>(null)
  const [attrStats, setAttrStats] = useState<{ columns: number; matched: number } | null>(null)
  const [attrDebug, setAttrDebug] = useState<AttrImportDebug | null>(null)
  const [debugMode, setDebugMode] = useState(false)

  const statsInputRef = useRef<HTMLInputElement>(null)
  const rolesInputRef = useRef<HTMLInputElement>(null)
  const attrsInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (
    file: File | null,
    type: 'statistics' | 'roleScores' | 'attributes'
  ) => {
    if (!file) return
    const isAttrs = type === 'attributes'
    const lowerName = file.name.toLowerCase()
    if (!isAttrs && !lowerName.endsWith('.csv')) {
      setError(`Ficheiro deve ser CSV`)
      return
    }
    if (isAttrs && !(lowerName.endsWith('.csv') || lowerName.endsWith('.html') || lowerName.endsWith('.htm'))) {
      setError(`Atributos Nuno aceita .html (FM export) ou .csv`)
      return
    }
    if (isFileTooLarge(file)) {
      setError(`Ficheiro demasiado grande (${getFileSizeMB(file).toFixed(2)}MB). Máximo 100MB.`)
      return
    }
    setError('')
    if (type === 'statistics') setStatisticsFile(file)
    else if (type === 'roleScores') setRoleScoresFile(file)
    else setAttributesFile(file)
  }

  const handleImport = async () => {
    const validation = validateImportFiles(statisticsFile, roleScoresFile)
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }

    setIsImporting(true)
    setError('')
    setSuccess(false)
    setAttrStats(null)
    setAttrDebug(null)
    setImportStatus('A iniciar import...')

    try {
      const result = await importScoutingData(
        statisticsFile!,
        roleScoresFile!,
        (progress) => {
          setImportStatus(`${progress.stage}: ${progress.message}`)
          setImportProgress(progress.progress)
        }
      )

      if (!result.success) {
        setError(result.errors.join('\n'))
        setIsImporting(false)
        return
      }

      setPlayers(result.players)
      setDetectedRoles(result.detectedRoles)
      setImportStats(result.statistics)

      // Optional: process attributes file (CSV or FM HTML export)
      if (attributesFile) {
        setImportStatus('A processar atributos (Nuno)...')
        try {
          const { attrs, columns, matched, debug } = await processAttributesFile(attributesFile, result.players)
          setAttrDebug(debug)
          if (columns.length === 0) {
            setError('Nenhuma coluna numérica de atributos detetada no ficheiro Nuno. Ativa o modo debug para ver porquê.')
            setDebugMode(true)
          } else if (matched === 0) {
            setError('Nenhum jogador emparelhado com o ficheiro de atributos. Ativa o modo debug para ver porquê.')
            setDebugMode(true)
            setCustomAttributes(attrs, columns)
            setAttrStats({ columns: columns.length, matched })
          } else {
            setCustomAttributes(attrs, columns)
            setAttrStats({ columns: columns.length, matched })
          }
        } catch (e) {
          setError(`Falha ao processar atributos: ${e instanceof Error ? e.message : String(e)}`)
        }
      }


      setSuccess(true)
      setImportStatus('Import concluído!')
      setImportProgress(100)

      // Don't auto-navigate if the attributes import produced issues — let the user read the debug panel
    } catch (err) {
      setError(`Import falhou: ${err instanceof Error ? err.message : String(err)}`)
      setImportProgress(0)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen py-10 px-4 text-slate-100">
      <div className="max-w-3xl mx-auto space-y-8">
        <section className="panel overflow-hidden p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/10 px-4 py-2 text-sm uppercase tracking-[0.24em] text-violet-300">
            FMDataLab import
          </div>
          <div className="mt-6 space-y-3">
            <h1 className="text-4xl font-bold text-white">Importar dados</h1>
            <p className="text-slate-400 leading-relaxed">
              Faz upload dos teus exports do Football Manager Data Lab. O 3º ficheiro (atributos Nuno) é opcional —
              se o enviares, ganhas a coluna <span className="text-violet-300 font-semibold">Nuno Score</span> calculada
              com os teus próprios pesos por atributo em cada role.
            </p>
          </div>
        </section>

        <div className="panel p-6 space-y-6">
          <div className="grid gap-6">
            <div className="space-y-3">
              <label className="block text-sm uppercase tracking-[0.2em] text-slate-400">1. Statistics CSV <span className="text-rose-400">*</span></label>
              <FileUploadArea
                file={statisticsFile}
                inputRef={statsInputRef}
                onSelect={(file) => handleFileSelect(file, 'statistics')}
                placeholder="Estatísticas e métricas avançadas dos jogadores"
                disabled={isImporting}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm uppercase tracking-[0.2em] text-slate-400">2. Role Scores CSV <span className="text-rose-400">*</span></label>
              <FileUploadArea
                file={roleScoresFile}
                inputRef={rolesInputRef}
                onSelect={(file) => handleFileSelect(file, 'roleScores')}
                placeholder="Scores FMDataLab para cada role"
                disabled={isImporting}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm uppercase tracking-[0.2em] text-violet-300">3. Atributos (Nuno) — .html ou .csv <span className="text-slate-500">(opcional)</span></label>
              <FileUploadArea
                file={attributesFile}
                inputRef={attrsInputRef}
                onSelect={(file) => handleFileSelect(file, 'attributes')}
                placeholder="Export HTML do Football Manager ou CSV com atributos numéricos"
                disabled={isImporting}
                accent="violet"
                accept=".csv,.html,.htm"
              />
              {customAttributeColumns.length > 0 && !attributesFile && (
                <div className="flex items-center justify-between rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs text-violet-200">
                  <span>{customAttributeColumns.length} atributos guardados de import anterior</span>
                  <button onClick={clearCustomAttributes} className="text-violet-300 hover:text-white underline">Limpar</button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-3xl border border-red-700/60 bg-red-950/70 p-4 text-sm text-red-200">
              <div className="flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200 mb-1">Erro</p>
                  <p className="whitespace-pre-wrap">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-3xl border border-green-700/60 bg-green-950/65 p-4 text-sm text-green-200">
              <div className="flex gap-3 items-start">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-200 mb-2">Import concluído!</p>
                  <div className="space-y-1 text-slate-300">
                    <p>✓ Jogadores: {importStats?.totalPlayers}</p>
                    <p>✓ Emparelhados: {importStats?.matchedPlayers}</p>
                    <p>✓ Roles detetadas: {importStats?.detectedRoles}</p>
                    {attrStats && (
                      <p className="text-violet-300">✓ Atributos Nuno: {attrStats.columns} colunas, {attrStats.matched} jogadores</p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => navigate('/configuration')} className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white">
                      Continuar para Configuração →
                    </button>
                    <button onClick={() => navigate('/scouting-nuno-scores')} className="rounded-full border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 px-4 py-1.5 text-xs font-semibold text-violet-200">
                      Abrir Scouting Nuno
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isImporting && (
            <div className="rounded-3xl border border-blue-700/60 bg-blue-950/60 p-4 text-sm text-blue-200">
              <div className="flex gap-3 items-center">
                <Loader className="w-5 h-5 text-blue-400 animate-spin" />
                <p>{importStatus}</p>
              </div>
            </div>
          )}

          {attrDebug && (
            <div className="rounded-3xl border border-violet-700/60 bg-violet-950/40 p-4 text-xs text-violet-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-violet-200 text-sm">🔍 Debug Atributos (Nuno)</p>
                <button
                  onClick={() => setDebugMode((v) => !v)}
                  className="text-[11px] text-violet-300 hover:text-white underline"
                >
                  {debugMode ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <Stat label="Tipo" value={attrDebug.fileType.toUpperCase()} />
                <Stat label="Linhas" value={attrDebug.totalRows} />
                <Stat label="Headers" value={attrDebug.totalHeaders} />
                <Stat label="Colunas aceites" value={attrDebug.acceptedColumns.length} />
                <Stat label="UID detetado" value={attrDebug.info.uid || '—'} />
                <Stat label="Coluna nome" value={attrDebug.info.playerName} />
                <Stat label="Coluna clube" value={attrDebug.info.club} />
                <Stat label="Jogadores c/ UID" value={`${attrDebug.playersIndexed.withUid}/${attrDebug.playersIndexed.total}`} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <Stat label="Match por UID" value={attrDebug.matchBreakdown.byUid} tone="ok" />
                <Stat label="Match nome+clube" value={attrDebug.matchBreakdown.byNameClub} tone="ok" />
                <Stat label="Match só nome" value={attrDebug.matchBreakdown.byName} tone="warn" />
                <Stat label="Sem match" value={attrDebug.matchBreakdown.unmatched} tone="err" />
              </div>

              {debugMode && (
                <div className="space-y-3 pt-2 border-t border-violet-800/60">
                  {attrDebug.ignoredColumns.length > 0 && (
                    <div>
                      <p className="font-semibold text-violet-200 mb-1">Colunas ignoradas ({attrDebug.ignoredColumns.length})</p>
                      <div className="max-h-44 overflow-y-auto rounded-xl bg-slate-950/60 p-2 space-y-1 font-mono">
                        {attrDebug.ignoredColumns.map((c, i) => (
                          <div key={i} className="flex justify-between gap-3">
                            <span className="text-slate-200 truncate">{c.header || '(vazio)'}</span>
                            <span className="text-slate-500 text-right">{c.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {attrDebug.acceptedColumns.length > 0 && (
                    <div>
                      <p className="font-semibold text-violet-200 mb-1">Colunas aceites ({attrDebug.acceptedColumns.length})</p>
                      <p className="text-slate-300 font-mono break-words">
                        {attrDebug.acceptedColumns.join(', ')}
                      </p>
                    </div>
                  )}
                  {attrDebug.unmatchedSamples.length > 0 && (
                    <div>
                      <p className="font-semibold text-violet-200 mb-1">
                        Amostra de linhas sem match ({attrDebug.unmatchedSamples.length})
                      </p>
                      <div className="rounded-xl bg-slate-950/60 p-2 space-y-1 font-mono">
                        {attrDebug.unmatchedSamples.map((s, i) => (
                          <div key={i} className="grid grid-cols-3 gap-2">
                            <span className="text-slate-400">uid: {s.uid || '—'}</span>
                            <span className="text-slate-200 truncate">{s.name || '—'}</span>
                            <span className="text-slate-400 truncate">{s.club || '—'}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Dica: se UID está vazio aqui ou no Statistics, o match cai para nome+clube. Confirma que ambos os exports têm a coluna UID e que os nomes coincidem.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          <button
            onClick={handleImport}
            disabled={!statisticsFile || !roleScoresFile || isImporting}
            className={`w-full rounded-full px-6 py-3 text-sm font-semibold transition ${
              !statisticsFile || !roleScoresFile || isImporting
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {isImporting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                A importar...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Importar ficheiros
              </div>
            )}
          </button>

          <div className="rounded-3xl border border-slate-800/70 bg-slate-900/90 p-5 text-sm text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-200">Notas</p>
            <p>💡 Statistics + Role Scores são obrigatórios e devem ter colunas Player/Club consistentes.</p>
            <p>🎯 O 3º ficheiro (Nuno) usa Player (e Club, se existir) para emparelhar. Configura pesos em <span className="text-violet-300">Nuno Scores</span>.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FileUploadAreaProps {
  file: File | null
  inputRef: React.RefObject<HTMLInputElement>
  onSelect: (file: File | null) => void
  placeholder: string
  disabled?: boolean
  accent?: 'default' | 'violet'
  accept?: string
}

function FileUploadArea({
  file,
  inputRef,
  onSelect,
  placeholder,
  disabled,
  accent = 'default',
  accept = '.csv',
}: FileUploadAreaProps) {
  const baseAccent = accent === 'violet' ? 'border-violet-700/60 hover:border-violet-400 hover:bg-violet-950/10' : 'border-slate-700 hover:border-blue-500 hover:bg-blue-950/10'
  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        file
          ? 'border-green-600 bg-green-950/20'
          : disabled
            ? 'border-slate-700 bg-slate-800/20 cursor-not-allowed'
            : `${baseAccent} bg-slate-800/20`
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onSelect(e.target.files?.[0] || null)}
        className="hidden"
        disabled={disabled}
      />

      {file ? (
        <div className="space-y-2">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
          <p className="font-medium text-green-200">{file.name}</p>
          <p className="text-sm text-green-300">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-medium text-slate-200">Clica para selecionar</p>
          <p className="text-sm text-slate-400">{placeholder}</p>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'ok' | 'warn' | 'err' }) {
  const toneClass =
    tone === 'ok' ? 'text-emerald-300' :
    tone === 'warn' ? 'text-amber-300' :
    tone === 'err' ? 'text-rose-300' : 'text-violet-100'
  return (
    <div className="rounded-xl bg-slate-950/60 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`font-mono text-xs truncate ${toneClass}`}>{value}</p>
    </div>
  )
}

import React, { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { useDataStore } from '../../stores/dataStore'
import { importScoutingData, validateImportFiles, getFileSizeMB, isFileTooLarge } from '../../services/importService'
import { useNavigate } from 'react-router-dom'

/**
 * Import Page Component
 * Handles CSV import workflow with progress tracking
 */
export default function ImportPage() {
  const navigate = useNavigate()
  const setStatisticsDataset = useDataStore((state) => state.setStatisticsDataset)
  const setRoleScoresDataset = useDataStore((state) => state.setRoleScoresDataset)
  const setPlayers = useDataStore((state) => state.setPlayers)
  const setDetectedRoles = useDataStore((state) => state.setDetectedRoles)
  const setImportProgress = useDataStore((state) => state.setImportProgress)
  const setImportError = useDataStore((state) => state.setImportError)

  const [statisticsFile, setStatisticsFile] = useState<File | null>(null)
  const [roleScoresFile, setRoleScoresFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [importStats, setImportStats] = useState<any>(null)

  const statsInputRef = useRef<HTMLInputElement>(null)
  const rolesInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (
    file: File | null,
    type: 'statistics' | 'roleScores'
  ) => {
    if (!file) return

    // Validate file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError(`${type === 'statistics' ? 'Statistics' : 'Role Scores'} file must be a CSV`)
      return
    }

    if (isFileTooLarge(file)) {
      setError(`File is too large. Maximum 100MB allowed. File size: ${getFileSizeMB(file).toFixed(2)}MB`)
      return
    }

    setError('')

    if (type === 'statistics') {
      setStatisticsFile(file)
    } else {
      setRoleScoresFile(file)
    }
  }

  const handleImport = async () => {
    // Validate files
    const validation = validateImportFiles(statisticsFile, roleScoresFile)
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }

    setIsImporting(true)
    setError('')
    setSuccess(false)
    setImportStatus('Starting import...')

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

      // Store results
      setPlayers(result.players)
      setDetectedRoles(result.detectedRoles)
      setImportStats(result.statistics)

      setSuccess(true)
      setImportStatus('Import successful!')
      setImportProgress(100)

      // Redirect after short delay
      setTimeout(() => {
        navigate('/configuration')
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Import failed: ${message}`)
      setImportProgress(0)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.16),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%),#020617] py-10 px-4 text-slate-100">
      <div className="max-w-3xl mx-auto space-y-8">
        <section className="panel overflow-hidden p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/10 px-4 py-2 text-sm uppercase tracking-[0.24em] text-violet-300">
            FMDataLab import
          </div>
          <div className="mt-6 space-y-5">
            <div>
              <h1 className="text-4xl font-bold text-white">Import your FMDataLab exports</h1>
              <p className="mt-3 text-slate-400 leading-relaxed">
                Upload your CSV data from Football Manager Data Lab to power scouting, role analysis,
                and transfer insights in the app.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/95 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Statistics file</p>
                <p className="mt-3 text-sm text-slate-300">Player statistics, advanced metrics and match data.</p>
              </div>
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/95 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Role scores file</p>
                <p className="mt-3 text-sm text-slate-300">FMDataLab role scores for every detected role.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="panel p-6 space-y-6">
          <div className="grid gap-6">
            <div className="space-y-3">
              <label className="block text-sm uppercase tracking-[0.2em] text-slate-400">Statistics CSV</label>
              <FileUploadArea
                file={statisticsFile}
                inputRef={statsInputRef}
                onSelect={(file) => handleFileSelect(file, 'statistics')}
                placeholder="Player statistics and advanced metrics"
                disabled={isImporting}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm uppercase tracking-[0.2em] text-slate-400">Role Scores CSV</label>
              <FileUploadArea
                file={roleScoresFile}
                inputRef={rolesInputRef}
                onSelect={(file) => handleFileSelect(file, 'roleScores')}
                placeholder="FMDataLab role scores for all available roles"
                disabled={isImporting}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-3xl border border-red-700/60 bg-red-950/70 p-4 text-sm text-red-200">
              <div className="flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200 mb-1">Import Error</p>
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
                  <p className="font-semibold text-green-200 mb-2">Import Successful!</p>
                  <div className="space-y-1 text-slate-300">
                    <p>✓ Total Players: {importStats?.totalPlayers}</p>
                    <p>✓ Matched: {importStats?.matchedPlayers}</p>
                    <p>✓ Detected Roles: {importStats?.detectedRoles}</p>
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
                Importing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Import Files
              </div>
            )}
          </button>

          <div className="rounded-3xl border border-slate-800/70 bg-slate-900/90 p-5 text-sm text-slate-400">
            <p className="mb-2 font-semibold text-slate-200">Import guidance</p>
            <p>💡 Make sure both CSV files contain consistent player name, club, age, and position data.</p>
            <p>📋 Required fields: player name, club, age, position, and role metrics.</p>
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
}

function FileUploadArea({
  file,
  inputRef,
  onSelect,
  placeholder,
  disabled,
}: FileUploadAreaProps) {
  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        file
          ? 'border-green-600 bg-green-950/20'
          : disabled
            ? 'border-slate-700 bg-slate-800/20 cursor-not-allowed'
            : 'border-slate-700 bg-slate-800/20 hover:border-blue-500 hover:bg-blue-950/10'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
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
          <p className="font-medium text-slate-200">Click to select or drag and drop</p>
          <p className="text-sm text-slate-400">{placeholder}</p>
        </div>
      )}
    </div>
  )
}

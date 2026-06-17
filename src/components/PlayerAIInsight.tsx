import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Sparkles, Loader2 } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { Player } from '../types/index'

interface Props {
  player: Player
  topRoles: [string, string | number][]
  topStats: [string, string | number | null | undefined][]
}

export default function PlayerAIInsight({ player, topRoles, topStats }: Props) {
  const [report, setReport] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'scout' | 'strengths' | 'tactical'>('scout')

  const prompts = {
    scout: `Write a full scouting report for ${player.playerName} (${player.club}, age ${player.age}, ${player.position}). Cover playing style, role fit, strengths, weaknesses, and a recruitment verdict.`,
    strengths: `Identify the 3 biggest strengths and 3 biggest weaknesses of ${player.playerName} based on the provided stats and role scores. Be specific and reference numbers.`,
    tactical: `Which tactical systems and formations would ${player.playerName} thrive in, and which ones would expose his weaknesses? Suggest 2 ideal team styles and 1 to avoid.`,
  }

  const runAnalysis = async (kind: 'scout' | 'strengths' | 'tactical') => {
    setMode(kind)
    setError(null)
    setReport(null)
    setLoading(true)
    try {
      const playerData = [
        {
          name: player.playerName,
          club: player.club,
          age: player.age,
          position: player.position,
          minutes: player.minutes,
          topRoleScores: topRoles.slice(0, 8).map(([r, s]) => ({ role: r, score: s })),
          topStats: topStats.slice(0, 25).map(([k, v]) => ({ metric: k, value: v })),
        },
      ]
      const { data, error: fnError } = await supabase.functions.invoke('scout-assistant', {
        body: {
          messages: [{ role: 'user', content: prompts[kind] }],
          playerData,
          contextLabel: `Single player: ${player.playerName}`,
        },
      })
      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)
      setReport(data?.reply ?? 'No response.')
    } catch (err: any) {
      setError(err?.message ?? 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-slate-900 to-violet-950/30 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Scout Analysis</h2>
            <p className="text-xs text-slate-400">Powered by Lovable AI · Uses only this player's loaded data</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => runAnalysis('scout')}
            disabled={loading}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              mode === 'scout' && report
                ? 'border-violet-500 bg-violet-600/30 text-white'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-violet-500/60'
            } disabled:opacity-50`}
          >
            Full Report
          </button>
          <button
            onClick={() => runAnalysis('strengths')}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-violet-500/60 disabled:opacity-50"
          >
            Strengths & Weaknesses
          </button>
          <button
            onClick={() => runAnalysis('tactical')}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-violet-500/60 disabled:opacity-50"
          >
            Tactical Fit
          </button>
        </div>
      </div>

      {!report && !loading && !error && (
        <p className="text-sm text-slate-400">
          Click one of the buttons above to generate an AI-powered analysis for {player.playerName}.
        </p>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
          Generating analysis…
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      {report && (
        <div className="prose prose-sm prose-invert max-w-none prose-headings:text-violet-300 prose-strong:text-cyan-300 prose-p:my-2 prose-ul:my-2">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      )}
    </section>
  )
}
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Sparkles, Send, Loader2, MessageSquare, X } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'
import { Player, PlayerAnalysis, Role } from '../types/index'

interface AIScoutAssistantProps {
  analyses: PlayerAnalysis[]
  players?: Player[]
  role: Role | null
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Recommend the best young player under 24 for this role',
  'Compare the top 3 ranked players',
  'Find a cheaper alternative to the #1 player',
  'Who fits a high-pressing system best?',
]

export default function AIScoutAssistant({ analyses, players = [], role }: AIScoutAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const compactData = useMemo(() => {
    if (analyses.length > 0) {
      return analyses.slice(0, 200).map((a) => ({
        name: a.playerName,
        club: a.club,
        age: a.age,
        position: a.position,
        minutes: a.minutes,
        finalScore: Number(a.finalScore?.toFixed?.(2) ?? a.finalScore),
        roleScore: Number(a.fmdatalabRoleScore?.toFixed?.(2) ?? a.fmdatalabRoleScore),
        metricScore: Number(a.customMetricScore?.toFixed?.(3) ?? a.customMetricScore),
        rank: a.rank,
      }))
    }

    return players.slice(0, 200).map((player) => {
      const roleScores = Object.entries(player.roleScores || {})
        .filter(([key]) => !['playerName', 'club', 'age'].includes(key))
        .slice(0, 20)
        .map(([roleName, score]) => ({ role: roleName, score }))

      return {
        name: player.playerName,
        club: player.club,
        age: player.age,
        position: player.position,
        minutes: player.minutes,
        roleScores,
      }
    })
  }, [analyses, players])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = async (text: string) => {
    const content = text.trim()
    if (!content || loading) return
    setError(null)
    const newMessages = [...messages, { role: 'user' as const, content }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scout-assistant', {
        body: {
          messages: newMessages,
          playerData: compactData,
          contextLabel: role?.name ?? null,
        },
      })

      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)

      const reply = data?.reply ?? 'No response received.'
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch (err: any) {
      setError(err?.message ?? 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-full border border-violet-500/50 bg-gradient-to-br from-violet-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] transition hover:scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]"
      >
        <Sparkles className="h-4 w-4" />
        AI Scout
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex h-[640px] max-h-[85vh] w-[440px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-violet-500/30 bg-slate-950/95 shadow-[0_0_60px_rgba(139,92,246,0.25)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-gradient-to-r from-violet-950/80 to-slate-950/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">AI Scout</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              {role ? `Role: ${role.name}` : 'No role selected'} · {compactData.length} players
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-xs text-slate-300">
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
              <p>
                Ask me about your scouted players — recruitment, comparisons, tactical fit, or value picks. I only use the data currently loaded.
              </p>
            </div>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-violet-500/50 hover:bg-slate-900 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-violet-600/90 px-3.5 py-2 text-sm text-white'
                  : 'max-w-full rounded-2xl rounded-bl-sm border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-slate-200'
              }
            >
              {m.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none prose-headings:text-violet-300 prose-headings:text-sm prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0 prose-strong:text-cyan-300">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Analyzing players…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-800/80 bg-slate-950/80 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              compactData.length === 0
                ? 'Load player data first…'
                : 'e.g. Find a young cheap winger for counter attack'
            }
            rows={2}
            disabled={loading || compactData.length === 0}
            className="flex-1 resize-none rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim() || compactData.length === 0}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
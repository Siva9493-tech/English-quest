import { useEffect, useRef } from 'react'
import AriaAvatar from './AriaAvatar'
import { getPanduUser, getTodayCorrections } from './PanduMemory'
import { getStats, getStreak } from '../../utils/progress'

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function PanduPanel({
  open,
  onClose,
  sessionActive,
  convState,
  messages,
  onToggleSession,
  sessionFillerCount,
  currentAnalysis,
  pronScore,
  audioQuality,
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <PanelInner
      onClose={onClose}
      sessionActive={sessionActive}
      convState={convState}
      messages={messages}
      onToggleSession={onToggleSession}
      sessionFillerCount={sessionFillerCount}
      currentAnalysis={currentAnalysis}
      pronScore={pronScore}
      audioQuality={audioQuality}
    />
  )
}

function PanelInner({
  onClose,
  sessionActive,
  convState,
  messages,
  onToggleSession,
  sessionFillerCount,
  currentAnalysis,
  pronScore,
  audioQuality,
}) {
  const user = getPanduUser()
  const stats = getStats()
  const streak = getStreak()
  const name = user?.name || 'friend'
  const totalSessions = user?.totalSessions ?? 0

  const scrollRef = useRef(null)
  // Recomputed each render; the transcript prop changing re-renders us.
  const tipsToday = getTodayCorrections().length

  // Auto-scroll to newest message / state change.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, convState])

  const hasHistory = messages.length > 0
  const listening = sessionActive && convState === 'listening'
  const thinking = sessionActive && convState === 'processing'
  const speaking = sessionActive && convState === 'speaking'

  return (
    <div
      className="fixed inset-0 z-[90] bg-slate-900/40"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-[360px] flex-col shadow-2xl"
        style={{ background: 'var(--bg-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header
          className="flex items-center gap-3 p-4"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-glow)',
          }}
        >
          <AriaAvatar size={40} />
          <div className="flex-1">
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
              🎙️ Aria
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Your English Coach
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </header>

        {/* Chat History */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {totalSessions <= 1 && (
            <div
              style={{
                background: 'rgba(0,229,255,0.08)',
                border: '1px solid rgba(0,229,255,0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              💡 Tip: You can tell Aria what to call you anytime! Just say "call
              me [nickname]" during your conversation.
            </div>
          )}

          {!hasHistory && (
            <div
              className="rounded-2xl p-3 text-sm leading-relaxed"
              style={{
                background:
                  'linear-gradient(135deg, rgba(191,0,255,0.25), rgba(0,245,255,0.15))',
                border: '1px solid var(--border-glow)',
                color: 'var(--text-primary)',
              }}
            >
              Hey {name}! 👋 I'm Aria. Tap the mic below to start a live conversation.
            </div>
          )}

          {messages.map((m, i) => {
            const mine = m.role === 'user'
            return (
              <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-white rounded-bl-none border border-cyan-500/20'}`}>
                  <p>{m.content}</p>
                  <p
                    className="mt-1 text-[10px]"
                    style={{ color: mine ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}
                  >
                    {formatTime(m.timestamp)}
                  </p>
                </div>
              </div>
            )
          })}
          {thinking && <p className="text-center text-xs font-semibold" style={{ color: '#c4b5fd' }}>💭 Aria is thinking...</p>}
          {speaking && <p className="text-center text-xs font-semibold" style={{ color: 'var(--color-cyan)' }}>🔊 Aria is speaking...</p>}
        </div>

        {/* Bottom Section: Mic & Stats */}
        <div style={{ position: 'relative' }}>
          {/* Status Pill */}
          {sessionActive && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 rounded-full px-3 py-1 text-xs font-bold shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)', color: listening ? '#fda4af' : 'var(--text-primary)' }}>
              <span className="flex items-center gap-1.5">
                {listening && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
                {listening ? 'Listening... 🎙️' : thinking ? '💭 Thinking...' : '🔊 Aria speaking...'}
              </span>
            </div>
          )}

          {/* Floating Mic Button */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10">
            <button 
              onClick={onToggleSession}
              className={`flex items-center justify-center transition-all duration-300 shadow-lg ${listening ? 'animate-bounce' : ''}`}
              style={{
                width: sessionActive ? '80px' : '64px',
                height: '36px',
                borderRadius: '999px',
                background: sessionActive ? 'linear-gradient(135deg, #ec4899, #ef4444)' : 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                color: 'white',
                fontWeight: '600'
              }}
            >
              {sessionActive ? '🔴' : '🎙️'}
            </button>
          </div>

          {/* Live Stats Bar */}
          {sessionActive && currentAnalysis && (
            <div className="px-4 py-2 bg-cyan-500/5 border-b border-cyan-500/20 flex justify-between text-[11px] text-slate-400">
              <span>🎯 Fillers: {sessionFillerCount}</span>
              <span>📊 Quality: {currentAnalysis.quality}%</span>
              <span>⏱️ Pace: {currentAnalysis.pace === 'good' ? '✅' : currentAnalysis.pace === 'fast' ? '⚡' : '🐢'}</span>
              {pronScore && <span>🗣️ Pron: {pronScore}%</span>}
              {audioQuality && (
                <span title={audioQuality.feedback}>
                  🎚️ Clarity: {audioQuality.score}%
                </span>
              )}
            </div>
          )}

          {/* Global Stats */}
          <div className="bg-slate-800 p-3 flex justify-around text-xs text-slate-400 border-t border-slate-700">
            <span>🔥 {streak}d</span>
            <span>⭐ {stats.earnedXp}XP</span>
            <span>💡 {tipsToday} tips</span>
          </div>
        </div>
      </aside>
    </div>
  )
}

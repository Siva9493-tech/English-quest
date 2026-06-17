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

function formatDuration(secs) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function PanduPanel({
  open,
  onClose,
  sessionActive,
  convState,
  sessionSeconds,
  messages,
  onToggleSession,
  sessionFillerCount,
  currentAnalysis,
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
      sessionSeconds={sessionSeconds}
      messages={messages}
      onToggleSession={onToggleSession}
      sessionFillerCount={sessionFillerCount}
      currentAnalysis={currentAnalysis}
    />
  )
}

function PanelInner({
  onClose,
  sessionActive,
  convState,
  sessionSeconds,
  messages,
  onToggleSession,
  sessionFillerCount,
  currentAnalysis,
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

        {/* Chat history (scrolls) */}
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
              className="rounded-2xl rounded-bl-sm p-3 text-sm leading-relaxed"
              style={{
                background:
                  'linear-gradient(135deg, rgba(191,0,255,0.25), rgba(0,245,255,0.15))',
                border: '1px solid var(--border-glow)',
                color: 'var(--text-primary)',
              }}
            >
              Hey {name}! 👋 I'm Aria, your English coach. Tap the mic below to
              start a live conversation — I'll keep listening, no need to tap
              after every reply. Say "bye Aria" anytime to end.
            </div>
          )}

          {messages.map((m, i) => {
            const mine = m.role === 'user'
            return (
              <div
                key={i}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm"
                  style={
                    mine
                      ? {
                          background: '#2563eb',
                          color: '#fff',
                          borderBottomRightRadius: 4,
                        }
                      : {
                          background:
                            'linear-gradient(135deg, rgba(191,0,255,0.22), rgba(0,245,255,0.12))',
                          color: 'var(--text-primary)',
                          border: '1px solid rgba(0,245,255,0.2)',
                          borderBottomLeftRadius: 4,
                        }
                  }
                >
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

          {thinking && (
            <p className="text-center text-xs font-semibold" style={{ color: '#c4b5fd' }}>
              💭 Aria is thinking…
            </p>
          )}
          {speaking && (
            <p className="text-center text-xs font-semibold" style={{ color: 'var(--color-cyan)' }}>
              🔊 Aria is speaking…
            </p>
          )}
        </div>

        {/* Stats bar + floating mic */}
        <div style={{ position: 'relative' }}>
          {/* Floating status pill above the mic (only while a session is active) */}
          {sessionActive && (
            <div
              style={{
                position: 'absolute',
                top: '-58px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 11,
                whiteSpace: 'nowrap',
              }}
              className="rounded-full px-3 py-1 text-xs font-bold shadow-lg"
            >
              <span
                className="flex items-center gap-1.5 rounded-full px-3 py-1"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-glow)',
                  color: listening ? '#fda4af' : 'var(--text-primary)',
                }}
              >
                {listening && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                )}
                {listening
                  ? 'Listening… 🎙️'
                  : thinking
                    ? '💭 Thinking…'
                    : '🔊 Aria speaking…'}
              </span>
            </div>
          )}

          {/* Floating oval mic button — taps toggle the live session */}
          <div
            style={{
              position: 'absolute',
              top: '-28px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={onToggleSession}
              aria-label={sessionActive ? 'End conversation' : 'Start conversation'}
              style={{
                width: sessionActive ? '80px' : '64px',
                height: '36px',
                borderRadius: '999px',
                background: sessionActive
                  ? 'linear-gradient(135deg, var(--color-pink), #ff4444)'
                  : 'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '16px',
                color: 'white',
                fontWeight: '600',
                boxShadow: sessionActive
                  ? '0 0 20px rgba(224, 64, 251, 0.6)'
                  : '0 0 15px var(--border-glow)',
                transition: 'all 0.3s ease',
                animation: listening ? 'micPulse 1s infinite' : 'none',
              }}
            >
              {sessionActive ? '🔴' : '🎙️'}
            </button>
          </div>

          {/* Live session timer (only while talking) */}
          {sessionActive && (
            <div
              style={{
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--color-cyan)',
                paddingTop: '20px',
              }}
            >
              🔴 Session: {formatDuration(sessionSeconds)}
            </div>
          )}

          {/* Live speech stats during an active session */}
          {sessionActive && currentAnalysis && (
            <div
              style={{
                padding: '6px 16px',
                background: 'rgba(0,229,255,0.05)',
                borderBottom: '1px solid var(--border-glow)',
                display: 'flex',
                gap: '16px',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              <span>🎯 Fillers: {sessionFillerCount}</span>
              <span>📊 Quality: {currentAnalysis.quality}%</span>
              <span>
                ⏱️ Pace:{' '}
                {currentAnalysis.pace === 'good'
                  ? '✅'
                  : currentAnalysis.pace === 'fast'
                    ? '⚡ Fast'
                    : '🐢 Slow'}
              </span>
            </div>
          )}

          {/* Slim single-line stats bar */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-glow)',
              padding: sessionActive ? '8px 16px 10px' : '14px 16px 10px',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <span>🔥 {streak}d</span>
            <span>⭐ {stats.earnedXp}/{stats.totalXp}</span>
            <span>💡 {tipsToday} tips today</span>
            <span>📅 {user?.totalSessions ?? 0}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}

import { useEffect, useMemo } from 'react'
import panduIcon from '../../assets/pandu-icon.png'
import { getHistory, getPanduUser } from './PanduMemory'
import { getStats, getStreak } from '../../utils/progress'

function groupByDate(messages) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const groups = []
  const indexByLabel = {}

  for (const msg of messages) {
    let label = msg.date
    if (msg.date === today) label = 'Today'
    else if (msg.date === yesterday) label = 'Yesterday'

    if (indexByLabel[label] == null) {
      indexByLabel[label] = groups.length
      groups.push({ label, items: [] })
    }
    groups[indexByLabel[label]].items.push(msg)
  }
  return groups
}

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

export default function PanduPanel({ open, onClose }) {
  const groups = useMemo(() => (open ? groupByDate(getHistory()) : []), [open])
  const stats = useMemo(() => (open ? getStats() : null), [open])
  const streak = useMemo(() => (open ? getStreak() : 0), [open])
  const user = useMemo(() => (open ? getPanduUser() : null), [open])

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
    <div
      className="fixed inset-0 z-[90] bg-slate-900/40"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-[360px] flex-col bg-slate-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white p-4">
          <img src={panduIcon} alt="Leo" className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <p className="font-bold text-slate-800">🎙️ Leo</p>
            <p className="text-xs text-slate-500">Your English Coach</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {groups.length === 0 && (
            <p className="mt-8 text-center text-sm text-slate-400">
              No conversations yet. Tap the Leo button and say hello! 👋
            </p>
          )}

          {groups.map((g) => (
            <div key={g.label} className="space-y-2">
              <div className="flex justify-center">
                <span className="rounded-full bg-slate-200 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {g.label}
                </span>
              </div>
              {g.items.map((m, i) => {
                const mine = m.role === 'user'
                return (
                  <div
                    key={i}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        mine
                          ? 'rounded-br-sm bg-blue-500 text-white'
                          : 'rounded-bl-sm bg-white text-slate-700'
                      }`}
                    >
                      <p>{m.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          mine ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {formatTime(m.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <footer className="grid grid-cols-3 gap-2 border-t border-slate-200 bg-white p-4 text-center">
          <div>
            <p className="text-xs text-slate-400">🔥 Streak</p>
            <p className="font-bold text-slate-700">{streak}d</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">⭐ XP</p>
            <p className="font-bold text-slate-700">
              {stats ? `${stats.earnedXp}/${stats.totalXp}` : '0/0'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">🎓 Sessions</p>
            <p className="font-bold text-slate-700">
              {user?.totalSessions ?? 0}
            </p>
          </div>
        </footer>
      </aside>
    </div>
  )
}

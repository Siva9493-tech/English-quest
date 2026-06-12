import { useEffect, useRef, useState } from 'react'
import Confetti from './Confetti'
import { ADVENTURE_NAMES, STAGE_NAMES } from '../data/islands'
import {
  getWatchStartTime,
  hasWatched,
  isVideoCompleted,
  toggleVideo,
} from '../utils/progress'

// Prefer the per-subtopic stage name from the mapping; fall back to the
// generic stage list, then to a numbered stage.
function stageName(subTopicId, index) {
  const mapped = ADVENTURE_NAMES[subTopicId]?.stages?.[index]
  return mapped || STAGE_NAMES[index] || `🎬 Stage ${index + 1}`
}

const UNLOCK_SECONDS = 480 // 8 minutes

function formatRemaining(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function SubtopicAccordion({ subTopics }) {
  const rowKey = (sId, vId) => `${sId}_${vId}`

  const [completed, setCompleted] = useState(() => {
    const map = {}
    for (const s of subTopics) {
      for (const v of s.videos) {
        map[rowKey(s.id, v.id)] = isVideoCompleted(s.id, v.id)
      }
    }
    return map
  })

  const [watchStarts, setWatchStarts] = useState(() => {
    const map = {}
    for (const s of subTopics) {
      for (const v of s.videos) {
        map[rowKey(s.id, v.id)] = getWatchStartTime(s.id, v.id)
      }
    }
    return map
  })

  const [watchedSnapshot] = useState(() => {
    const map = {}
    for (const s of subTopics) {
      for (const v of s.videos) {
        map[rowKey(s.id, v.id)] = hasWatched(s.id, v.id)
      }
    }
    return map
  })

  const [nowTs, setNowTs] = useState(() => Date.now())
  const [openId, setOpenId] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const persistedRef = useRef(new Set())

  function elapsedOf(key) {
    const ws = watchStarts[key]
    return ws != null ? (nowTs - ws) / 1000 : null
  }

  function isUnlocked(key) {
    if (completed[key] || watchedSnapshot[key]) return true
    const el = elapsedOf(key)
    return el != null && el >= UNLOCK_SECONDS
  }

  function isCounting(key) {
    if (completed[key] || watchedSnapshot[key]) return false
    const el = elapsedOf(key)
    return el != null && el < UNLOCK_SECONDS
  }

  // Single 1s interval, only running while at least one video is counting down.
  const anyCounting = Object.keys(watchStarts).some((k) => isCounting(k))
  useEffect(() => {
    if (!anyCounting) return
    const id = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [anyCounting])

  // Persist watched_<key> to localStorage when a video crosses the 8-min gate.
  // Side-effect only (no setState) so it stays lint-clean.
  useEffect(() => {
    for (const s of subTopics) {
      for (const v of s.videos) {
        const key = rowKey(s.id, v.id)
        if (isUnlocked(key) && !persistedRef.current.has(key)) {
          try {
            localStorage.setItem(`watched_${s.id}_${v.id}`, 'true')
          } catch {
            // ignore write failures
          }
          persistedRef.current.add(key)
        }
      }
    }
  })

  // Opens in external browser - do not use
  // VS Code preview for YouTube links
  function handleWatch(sId, vId, url) {
    const now = Date.now()
    try {
      localStorage.setItem(`watchStart_${sId}_${vId}`, String(now))
    } catch {
      // ignore write failures
    }
    // target="_blank" + noopener,noreferrer opens a new tab in the host browser
    window.open(url, '_blank', 'noopener,noreferrer')
    setWatchStarts((prev) => ({ ...prev, [rowKey(sId, vId)]: now }))
    setNowTs(now)
  }

  function handleToggle(sId, vId) {
    const key = rowKey(sId, vId)
    if (!isUnlocked(key)) return
    const { completed: nowDone } = toggleVideo(sId, vId)
    setCompleted((prev) => ({ ...prev, [key]: nowDone }))
    if (nowDone) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
    }
  }

  function subtopicDone(subTopic) {
    return subTopic.videos.every((v) => completed[rowKey(subTopic.id, v.id)])
  }

  return (
    <div className="space-y-2">
      {showConfetti && <Confetti />}

      {subTopics.map((s) => {
        const isOpen = openId === s.id
        const fullyDone = subtopicDone(s)
        const doneCount = s.videos.filter(
          (v) => completed[rowKey(s.id, v.id)],
        ).length

        return (
          <div
            key={s.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : s.id)}
              className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                  fullyDone
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {fullyDone ? '✓' : '▶'}
              </span>
              <span className="flex-1 font-medium text-slate-700">
                {s.title}
              </span>
              <span className="shrink-0 text-xs font-semibold text-slate-400">
                {doneCount}/{s.videos.length}
              </span>
              <span
                className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              >
                ▾
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <ul className="space-y-2 border-t border-slate-100 bg-slate-50/50 p-3">
                  {s.videos.map((v, vIndex) => {
                    const key = rowKey(s.id, v.id)
                    const done = completed[key]
                    const unlocked = isUnlocked(key)
                    const counting = isCounting(key)
                    const remaining = counting
                      ? Math.max(0, UNLOCK_SECONDS - Math.floor(elapsedOf(key)))
                      : 0
                    const neverWatched = !done && !unlocked && !counting

                    return (
                      <li
                        key={v.id}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggle(s.id, v.id)}
                          disabled={!unlocked}
                          aria-label={
                            done ? 'Mark incomplete' : 'Mark complete'
                          }
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold transition ${
                            done
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : unlocked
                                ? 'border-slate-300 bg-white text-transparent hover:border-emerald-400'
                                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-transparent'
                          }`}
                        >
                          ✓
                        </button>

                        <span className="min-w-0 flex-1 text-sm font-medium text-slate-600">
                          {stageName(s.id, vIndex)}
                        </span>

                        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
                          {done && (
                            <span className="text-xs font-bold text-emerald-600">
                              +10 XP
                            </span>
                          )}
                          {counting && (
                            <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                              ⏳ Unlocks in {formatRemaining(remaining)}
                            </span>
                          )}
                          {unlocked && !done && (
                            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                              ✓ Watched
                            </span>
                          )}

                          {neverWatched ? (
                            <button
                              type="button"
                              onClick={() => handleWatch(s.id, v.id, v.url)}
                              className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5"
                            >
                              ▶ Watch Video
                            </button>
                          ) : (
                            <a
                              href={v.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-indigo-600 transition hover:text-indigo-700"
                            >
                              ↗ {counting ? 'Rewatch' : 'Watch again'}
                            </a>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

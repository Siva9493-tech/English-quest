import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getModuleStats } from '../utils/progress'
import { ISLAND_DATA, ISLAND_ORDER } from '../data/islands'

const ISLAND_EMOJIS = {
  m1: '🌋', m2: '🏖️', m3: '🔍', m4: '☕',
  m5: '⛰️', m6: '🗣️', m7: '✨', m8: '🎯',
  m9: '🧠', m10: '🏙️', m11: '📖', m12: '🎵',
  m13: '🌙', m14: '👑',
}

const LAST_INDEX_KEY = 'lastIslandIndex'
const COUNT = ISLAND_ORDER.length

function loadIndex() {
  try {
    const raw = parseInt(localStorage.getItem(LAST_INDEX_KEY), 10)
    if (Number.isInteger(raw) && raw >= 0 && raw < COUNT) return raw
  } catch {
    // ignore read failures
  }
  return 0
}

export default function ModuleMap() {
  const navigate = useNavigate()
  const stats = useMemo(() => getModuleStats(), [])
  const byId = useMemo(
    () => Object.fromEntries(stats.map((m) => [m.id, m])),
    [stats],
  )

  const [index, setIndex] = useState(loadIndex)

  const goPrev = () => setIndex((i) => Math.max(0, i - 1))
  const goNext = () => setIndex((i) => Math.min(COUNT - 1, i + 1))

  // Persist the last viewed island.
  useEffect(() => {
    try {
      localStorage.setItem(LAST_INDEX_KEY, String(index))
    } catch {
      // ignore write failures
    }
  }, [index])

  // Keyboard navigation: ← prev, → next.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      else if (e.key === 'ArrowRight')
        setIndex((i) => Math.min(COUNT - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Overall completion across all subtopics.
  const { totalDone, totalSubs } = useMemo(() => {
    let done = 0
    let subs = 0
    for (const m of stats) {
      done += m.done
      subs += m.total
    }
    return { totalDone: done, totalSubs: subs }
  }, [stats])
  const overallPercent =
    totalSubs > 0 ? Math.round((totalDone / totalSubs) * 100) : 0

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1
          className="text-glow-cyan text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          🗺️ Your English Quest World
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          {COUNT} Islands &nbsp;•&nbsp; {totalSubs} Adventures &nbsp;•&nbsp;{' '}
          <span style={{ color: 'var(--color-cyan)' }}>{overallPercent}% Complete</span>
        </p>
      </header>

      {/* Carousel row: PREV | cards | NEXT */}
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          aria-label="Previous island"
          className="btn-cyber hidden shrink-0 whitespace-nowrap text-sm sm:block"
          style={{ opacity: index === 0 ? 0.35 : 1, cursor: index === 0 ? 'not-allowed' : 'pointer' }}
        >
          ← Prev
        </button>

        <div className="island-stage">
          <div
            className="island-track"
            style={{ transform: `translateX(-${index * 320}px)` }}
          >
            {ISLAND_ORDER.map((id, i) => (
              <IslandCard
                key={id}
                module={byId[id]}
                level={i + 1}
                focused={i === index}
                onExplore={() => navigate(`/modules/${id}`)}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={index === COUNT - 1}
          aria-label="Next island"
          className="btn-cyber hidden shrink-0 whitespace-nowrap text-sm sm:block"
          style={{
            opacity: index === COUNT - 1 ? 0.35 : 1,
            cursor: index === COUNT - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Next →
        </button>
      </div>

      {/* Mobile prev/next (buttons hidden on small screens above) */}
      <div className="flex justify-center gap-3 sm:hidden">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="btn-cyber text-sm"
          style={{ opacity: index === 0 ? 0.35 : 1 }}
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={index === COUNT - 1}
          className="btn-cyber text-sm"
          style={{ opacity: index === COUNT - 1 ? 0.35 : 1 }}
        >
          Next →
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {ISLAND_ORDER.map((id, i) => {
          const complete = byId[id].isComplete
          const isCurrent = i === index
          const bg = isCurrent
            ? 'var(--color-cyan)'
            : complete
              ? 'var(--color-gold)'
              : 'rgba(148,163,184,0.4)'
          return (
            <button
              key={id}
              type="button"
              aria-label={`Go to island ${i + 1}`}
              onClick={() => setIndex(i)}
              className="rounded-full transition-transform hover:scale-125"
              style={{
                width: isCurrent ? 14 : 10,
                height: isCurrent ? 14 : 10,
                background: bg,
                boxShadow: isCurrent ? '0 0 8px var(--color-cyan)' : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

function IslandCard({ module, level, focused, onExplore }) {
  const { id, done, total, percent, isComplete, locked } = module
  const island = ISLAND_DATA[id]
  const emoji = ISLAND_EMOJIS[id] || island.emoji

  const stateClass = isComplete
    ? 'island-complete'
    : !locked && done > 0
      ? 'island-active'
      : ''

  return (
    <div
      className="island-slot"
      style={{
        opacity: focused ? 1 : 0.6,
        filter: focused ? 'none' : 'blur(2px)',
        transform: focused ? 'scale(1)' : 'scale(0.82)',
      }}
    >
      <div
        className={`island-card relative ${focused ? stateClass : ''}`}
        style={{
          padding: 24,
          boxShadow:
            focused && !isComplete && !locked
              ? '0 0 30px var(--border-glow)'
              : undefined,
        }}
      >
        {isComplete && (
          <span className="absolute -right-2 -top-2 text-2xl" title="Completed">
            ✅
          </span>
        )}

        {/* Big emoji */}
        <div
          className="text-center leading-none"
          style={{ fontSize: 100, filter: locked ? 'grayscale(1)' : 'none' }}
        >
          {emoji}
        </div>

        {/* Name + description */}
        <h2
          className="mt-3 text-center text-2xl font-extrabold leading-tight"
          style={{
            color: 'var(--color-gold)',
            textShadow: '0 0 10px rgba(201, 168, 76, 0.5)',
          }}
        >
          {island.name}
        </h2>
        <p
          className="mt-1 text-center text-sm italic"
          style={{ color: 'var(--island-muted)' }}
        >
          “{island.description}”
        </p>

        {/* Level + lock status */}
        <div className="mt-4 flex items-center justify-between text-xs font-bold">
          <span style={{ color: 'var(--island-text)' }}>LEVEL {level}</span>
          <span style={{ color: locked ? 'var(--island-muted)' : 'var(--color-gold)' }}>
            {locked ? '🔒 LOCKED' : isComplete ? '👑 CLEARED' : '🔓 UNLOCKED'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="progress-cyber w-full" style={{ height: 8 }}>
            <div
              className="progress-cyber-fill"
              style={{
                width: `${percent}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, var(--color-gold), #ffae00)'
                  : undefined,
              }}
            />
          </div>
          <p
            className="mt-1.5 text-center text-xs font-semibold"
            style={{ color: 'var(--color-gold)' }}
          >
            {done}/{total} complete
          </p>
        </div>

        {/* CTA */}
        <div className="mt-5">
          {locked ? (
            <button
              type="button"
              disabled
              className="w-full rounded-lg py-3 text-sm font-bold"
              style={{
                background: 'var(--island-faint)',
                color: 'var(--island-muted)',
                cursor: 'not-allowed',
              }}
            >
              🔒 LOCKED
            </button>
          ) : (
            <button
              type="button"
              onClick={onExplore}
              disabled={!focused}
              className="btn-cyber w-full"
              style={{ padding: '12px 20px' }}
            >
              ⚔️ EXPLORE THE ISLAND →
            </button>
          )}
        </div>

        {/* Locked overlay */}
        {locked && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-[2px]"
            style={{ background: 'var(--island-veil)' }}
          >
            <span className="text-5xl" title="Locked">
              🔒
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

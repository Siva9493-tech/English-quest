import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getModuleStats } from '../utils/progress'
import { ISLAND_DATA, POSITIONS, ISLAND_ORDER } from '../data/islands'

export default function ModuleMap() {
  const stats = useMemo(() => getModuleStats(), [])
  const byId = useMemo(
    () => Object.fromEntries(stats.map((m) => [m.id, m])),
    [stats],
  )

  // SVG path points (viewBox is 0..100, so percentages map directly).
  const pathPoints = useMemo(
    () =>
      ISLAND_ORDER.map((id) => {
        const p = POSITIONS[id]
        return `${parseFloat(p.left)},${parseFloat(p.top)}`
      }).join(' '),
    [],
  )

  return (
    <div className="space-y-6">
      <header>
        <p
          className="text-sm font-medium uppercase tracking-wider"
          style={{ color: 'var(--color-cyan)' }}
        >
          Your Journey
        </p>
        <h1
          className="text-glow-cyan text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          🌍 World Map
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Sail island to island — finish half an island to unlock the next.
        </p>
      </header>

      {/* Desktop: scattered island map */}
      <div className="relative hidden md:block">
        <div className="world-ocean">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ zIndex: 1 }}
          >
            <polyline
              points={pathPoints}
              fill="none"
              stroke="var(--color-cyan)"
              strokeWidth="0.35"
              strokeDasharray="1.2 1.2"
              strokeLinecap="round"
              opacity="0.2"
            />
          </svg>

          {ISLAND_ORDER.map((id, i) => (
            <IslandNode key={id} module={byId[id]} level={i + 1} mapMode />
          ))}
        </div>
      </div>

      {/* Mobile: vertical scrollable list */}
      <div className="space-y-4 md:hidden">
        {ISLAND_ORDER.map((id, i) => (
          <IslandNode key={id} module={byId[id]} level={i + 1} />
        ))}
      </div>
    </div>
  )
}

function IslandNode({ module, level, mapMode }) {
  const { id, done, total, percent, isComplete, locked } = module
  const island = ISLAND_DATA[id]
  const active = !locked && !isComplete && done > 0

  const wrapperStyle = mapMode
    ? {
        position: 'absolute',
        top: POSITIONS[id].top,
        left: POSITIONS[id].left,
        transform: 'translate(-50%, -50%)',
        width: 160,
        zIndex: 10,
      }
    : undefined

  const stateClass = isComplete
    ? 'island-complete'
    : active
      ? 'island-active'
      : ''

  const inner = (
    <>
      {isComplete && (
        <span className="absolute -right-2 -top-2 text-xl" title="Completed">
          ✅
        </span>
      )}

      <div className="text-center text-4xl leading-none">{island.emoji}</div>

      <h2
        className="mt-2 text-center text-sm font-bold leading-tight"
        style={{ color: '#e2e8f0' }}
      >
        {island.name}
      </h2>
      <p
        className="mt-0.5 text-center text-[11px] italic leading-tight"
        style={{ color: '#94a3b8' }}
      >
        “{island.description}”
      </p>

      <div className="mt-3">
        <div className="progress-cyber w-full" style={{ height: 6 }}>
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
          className="mt-1 text-center text-[10px] font-semibold"
          style={{ color: 'var(--color-cyan)' }}
        >
          {done}/{total}
        </p>
      </div>

      <div className="mt-3 flex justify-center">
        {locked ? (
          <span
            className="rounded-lg px-3 py-1.5 text-[11px] font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}
          >
            🔒 LOCKED
          </span>
        ) : (
          <span className="btn-cyber text-[11px]" style={{ padding: '6px 14px' }}>
            EXPLORE →
          </span>
        )}
      </div>
    </>
  )

  const padding = 'p-3'

  if (locked) {
    return (
      <div
        style={wrapperStyle}
        className={`island-card relative ${padding} ${mapMode ? '' : 'w-full'}`}
        aria-disabled="true"
      >
        <div style={{ filter: 'blur(1.5px)', opacity: 0.55 }}>{inner}</div>
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/40 backdrop-blur-[2px]">
          <span className="text-3xl" title="Locked">
            🔒
          </span>
        </div>
        <span className="absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
          LVL {level}
        </span>
      </div>
    )
  }

  return (
    <Link
      to={`/modules/${id}`}
      style={wrapperStyle}
      className={`island-card island-card-link relative block ${padding} ${stateClass} ${
        mapMode ? '' : 'w-full'
      }`}
    >
      <span className="absolute left-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
        LVL {level}
      </span>
      {inner}
    </Link>
  )
}

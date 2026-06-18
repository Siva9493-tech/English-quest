import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBadges, getStats, getStreak } from '../utils/progress'

export default function Home() {
  const streak = useMemo(() => getStreak(), [])
  const badges = useMemo(() => getBadges(), [])
  const { totalXp, earnedXp, completedCount, totalCount, nextSubTopic } =
    useMemo(() => getStats(), [])

  const xpPercent = totalXp > 0 ? Math.round((earnedXp / totalXp) * 100) : 0

  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }
    const handleInstalled = () => {
      setShowInstallBanner(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShowInstallBanner(false)
    }
    setDeferredPrompt(null)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p
            className="text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--color-cyan)' }}
          >
            Your Dashboard
          </p>
          <h1
            className="text-glow-cyan text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Welcome back!
          </h1>
        </div>
        <StreakCounter streak={streak} />
      </header>

      <TodaysMission subTopic={nextSubTopic} />

      <XpBar
        earnedXp={earnedXp}
        totalXp={totalXp}
        percent={xpPercent}
        completedCount={completedCount}
        totalCount={totalCount}
      />

      <div>
        <Link
          to="/analytics"
          style={{
            display: 'inline-block',
            background: 'transparent',
            border: '1px solid var(--border-glow)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'var(--color-cyan)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          📊 View Full Analytics →
        </Link>
      </div>

      <BadgesSection badges={badges} />

      {showInstallBanner && (
        <InstallBanner
          onInstall={handleInstall}
          onDismiss={() => setShowInstallBanner(false)}
        />
      )}
    </div>
  )
}

function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 px-4 py-3"
      style={{
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--color-cyan)',
        boxShadow: '0 -4px 24px rgba(0, 229, 255, 0.25)',
      }}
    >
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Install EnglishQuest on your phone! 📱
      </p>
      <div className="flex items-center gap-2">
        <button onClick={onInstall} className="btn-cyber text-sm">
          Install
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded-lg px-3 py-2 text-sm font-semibold transition"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-glow)',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function BadgesSection({ badges }) {
  return (
    <section className="cyber-card p-6">
      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
        Badges
      </h2>
      <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        Earn badges as you complete more subtopics.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b) => (
          <div
            key={b.id}
            className="flex flex-col items-center rounded-xl border p-4 text-center transition"
            style={
              b.unlocked
                ? {
                    borderColor: 'var(--color-gold)',
                    background:
                      'color-mix(in srgb, var(--color-gold) 12%, var(--bg-surface))',
                    boxShadow: '0 0 18px rgba(255, 215, 0, 0.25)',
                  }
                : {
                    borderColor: 'var(--border-glow)',
                    background: 'var(--bg-surface)',
                    opacity: 0.5,
                  }
            }
          >
            <span className="relative text-3xl">
              {b.unlocked ? (
                b.emoji
              ) : (
                <>
                  <span className="grayscale">{b.emoji}</span>
                  <span className="absolute -bottom-1 -right-1 text-sm">🔒</span>
                </>
              )}
            </span>
            <span
              className="mt-2 text-xs font-bold"
              style={{
                color: b.unlocked ? 'var(--color-gold)' : 'var(--text-muted)',
              }}
            >
              {b.label}
            </span>
            <span
              className="mt-0.5 text-[10px] font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              {b.unlocked ? 'Unlocked' : `${b.threshold} subtopics`}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function StreakCounter({ streak }) {
  return (
    <div
      className="flex items-center gap-2 rounded-2xl px-4 py-2"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--color-gold)',
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.35)',
      }}
    >
      <span className="text-2xl">🔥</span>
      <div className="leading-tight">
        <div
          className="text-xl font-extrabold"
          style={{
            color: 'var(--color-gold)',
            textShadow: '0 0 10px rgba(255,215,0,0.8)',
          }}
        >
          {streak}
        </div>
        <div
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          day streak
        </div>
      </div>
    </div>
  )
}

function TodaysMission({ subTopic }) {
  if (!subTopic) {
    return (
      <section
        className="cyber-card p-6 text-center"
        style={{ borderColor: 'var(--color-gold)' }}
      >
        <div className="text-4xl">🏆</div>
        <h2
          className="text-glow-gold mt-2 text-xl font-bold"
          style={{ color: 'var(--color-gold)' }}
        >
          All missions complete!
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          You've finished every subtopic. Legend.
        </p>
      </section>
    )
  }

  return (
    <section
      className="cyber-card glow-purple overflow-hidden p-6"
      style={{ borderColor: 'var(--color-purple)' }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-cyan)' }}
        >
          Today's Mission
        </p>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            background: 'color-mix(in srgb, var(--color-cyan) 18%, transparent)',
            color: 'var(--color-cyan)',
          }}
        >
          +{subTopic.videos.length * 10} XP
        </span>
      </div>
      <h2
        className="mt-3 text-2xl font-bold leading-snug"
        style={{ color: 'var(--text-primary)' }}
      >
        {subTopic.title}
      </h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        {subTopic.moduleTitle}
      </p>
      <div className="mt-5 flex gap-3">
        <Link to={`/practice/${subTopic.id}`} className="btn-cyber text-sm">
          ▶ Start lesson
        </Link>
        <Link
          to="/modules"
          className="rounded-lg px-5 py-2.5 text-sm font-semibold transition"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-glow)',
          }}
        >
          View map
        </Link>
      </div>
    </section>
  )
}

function XpBar({ earnedXp, totalXp, percent, completedCount, totalCount }) {
  return (
    <section className="cyber-card glow-cyan p-6">
      <div className="flex items-end justify-between">
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Total XP
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {completedCount} of {totalCount} subtopics complete
          </p>
        </div>
        <div className="text-right">
          <span
            className="text-glow-cyan text-2xl font-extrabold"
            style={{ color: 'var(--color-cyan)' }}
          >
            {earnedXp}
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {' '}
            / {totalXp} XP
          </span>
        </div>
      </div>
      <div className="progress-cyber mt-4 h-4 w-full">
        <div className="progress-cyber-fill" style={{ width: `${percent}%` }} />
      </div>
      <p
        className="mt-2 text-right text-xs font-semibold"
        style={{ color: 'var(--color-cyan)' }}
      >
        {percent}%
      </p>
    </section>
  )
}

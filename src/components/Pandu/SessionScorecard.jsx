import { useState, useEffect } from 'react'

export default function SessionScorecard({ onClose }) {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    try {
      const data = localStorage.getItem('lastSessionSummary')
      if (data) setSummary(JSON.parse(data))
    } catch (e) {
      console.error(e)
    }
  }, [])

  if (!summary) return null

  const {
    duration,
    totalWords,
    totalFillers,
    avgQuality,
    paceScore,
    exchanges,
    fluencyGrade,
  } = summary

  // Generate Aria's personal feedback text
  const getWin1 = () => {
    if (avgQuality >= 80) return 'Your sentence quality was excellent!'
    if (totalFillers === 0) return "Zero filler words — that's impressive!"
    return `You spoke ${totalWords} words — great effort!`
  }

  const getWin2 = () => {
    if (paceScore >= 80) return 'Your speaking pace was just right!'
    if (exchanges >= 5) return `${exchanges} exchanges — solid conversation!`
    return `${duration} minute session — keep it up!`
  }

  const getImprovement = () => {
    if (totalFillers > 5)
      return `Watch out for filler words (${totalFillers} used) — try replacing them with short pauses.`
    if (paceScore < 60)
      return 'Work on speaking pace — aim for steady, clear delivery.'
    if (avgQuality < 70)
      return "Try using more complex sentences with 'because', 'however', 'although'."
    return 'Keep practicing daily — consistency is everything!'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glow)',
          borderRadius: '20px',
          padding: '32px 28px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 0 60px rgba(0,229,255,0.2)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>
            {fluencyGrade.grade === 'A'
              ? '🏆'
              : fluencyGrade.grade === 'B'
                ? '⭐'
                : fluencyGrade.grade === 'C'
                  ? '💪'
                  : '📚'}
          </div>
          <h2
            style={{
              color: 'var(--color-cyan)',
              fontSize: '22px',
              fontWeight: '800',
              margin: '0 0 4px 0',
            }}
          >
            Session Complete!
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
              margin: 0,
            }}
          >
            {duration} min • {exchanges} exchanges • {totalWords} words
          </p>
        </div>

        {/* Grade Circle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `conic-gradient(
                var(--color-cyan) ${avgQuality}%,
                var(--bg-surface) 0
              )`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0,229,255,0.3)',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: '900',
                  color: 'var(--color-cyan)',
                  lineHeight: 1,
                }}
              >
                {fluencyGrade.grade}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                }}
              >
                {avgQuality}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          {[
            {
              label: 'Fillers',
              value: totalFillers,
              icon: '🎯',
              color:
                totalFillers === 0
                  ? '#22c55e'
                  : totalFillers > 5
                    ? '#ff006e'
                    : '#ffd700',
            },
            {
              label: 'Pace',
              value: paceScore + '%',
              icon: '⏱️',
              color:
                paceScore >= 80
                  ? '#22c55e'
                  : paceScore >= 60
                    ? '#ffd700'
                    : '#ff006e',
            },
            {
              label: 'Quality',
              value: avgQuality + '%',
              icon: '📊',
              color:
                avgQuality >= 80
                  ? '#22c55e'
                  : avgQuality >= 60
                    ? '#ffd700'
                    : '#ff006e',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${stat.color}40`,
                borderRadius: '12px',
                padding: '12px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '18px' }}>{stat.icon}</div>
              <div
                style={{
                  color: stat.color,
                  fontSize: '18px',
                  fontWeight: '800',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Aria's Feedback */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glow)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              color: 'var(--color-cyan)',
              fontSize: '12px',
              fontWeight: '700',
              margin: '0 0 10px 0',
              letterSpacing: '0.1em',
            }}
          >
            🎙️ ARIA'S FEEDBACK
          </p>
          <p
            style={{
              color: 'var(--text-primary)',
              fontSize: '13px',
              margin: '0 0 8px 0',
            }}
          >
            ✅ {getWin1()}
          </p>
          <p
            style={{
              color: 'var(--text-primary)',
              fontSize: '13px',
              margin: '0 0 8px 0',
            }}
          >
            ✅ {getWin2()}
          </p>
          <p
            style={{
              color: '#ffd700',
              fontSize: '13px',
              margin: 0,
            }}
          >
            📝 {getImprovement()}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            background:
              'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
            color: '#0a0a0f',
            fontWeight: '800',
            fontSize: '15px',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          Keep Practicing! 🚀
        </button>
      </div>
    </div>
  )
}

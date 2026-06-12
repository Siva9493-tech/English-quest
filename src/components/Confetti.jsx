const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444']

export default function Confetti({ count = 80 }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const left = (i * 137.5) % 100
    const delay = (i % 10) * 0.12
    const duration = 2.4 + (i % 7) * 0.35
    const color = COLORS[i % COLORS.length]
    const size = 6 + (i % 4) * 2
    return (
      <span
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size * 1.6}px`,
          backgroundColor: color,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        }}
      />
    )
  })

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces}
    </div>
  )
}

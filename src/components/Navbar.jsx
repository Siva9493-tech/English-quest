import { NavLink } from 'react-router-dom'
import { getUserAccent, setUserAccent } from './Pandu/AccentTrainer'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/modules', label: 'Module Map' },
  { to: '/practice', label: 'Daily Practice' },
  { to: '/analytics', label: 'Analytics' },
]

export default function Navbar({ theme, onToggleTheme }) {
  const handleAccentToggle = () => {
    const current = getUserAccent()
    const newAccent = current === 'british' ? 'american' : 'british'
    setUserAccent(newAccent)
    // Force re-render
    window.location.reload()
  }

  return (
    <nav className="nav-glass sticky top-0 z-50 flex items-center gap-2 px-6 py-3">
      <span
        className="text-glow-cyan mr-4 text-lg font-extrabold tracking-wide"
        style={{ color: 'var(--color-cyan)' }}
      >
        🗺️ EnglishQuest
      </span>

      {links.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `nav-link rounded-md px-3 py-1.5 text-sm font-medium ${
              isActive ? 'nav-link-active' : ''
            }`
          }
        >
          {label}
        </NavLink>
      ))}

      <button
        type="button"
        onClick={handleAccentToggle}
        title="Switch accent"
        className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full transition-all hover:scale-105"
        style={{
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: 600,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glow)',
          color: 'var(--text-primary)',
        }}
      >
        {getUserAccent() === 'british' ? '🇬🇧 British' : '🇺🇸 American'}
      </button>

      <button
        type="button"
        onClick={onToggleTheme}
        aria-label="Toggle dark and light mode"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex shrink-0 items-center rounded-full transition-all hover:scale-105"
        style={{
          width: 64,
          height: 32,
          padding: 3,
          background: 'var(--bg-card)',
          border: `1px solid ${
            theme === 'dark' ? 'var(--color-cyan)' : 'var(--color-gold)'
          }`,
          boxShadow:
            theme === 'dark'
              ? '0 0 10px var(--border-glow)'
              : '0 0 10px var(--border-gold)',
          justifyContent: theme === 'dark' ? 'flex-start' : 'flex-end',
        }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-sm"
          style={{
            background:
              theme === 'dark'
                ? 'linear-gradient(135deg, var(--color-cyan), var(--color-purple))'
                : 'linear-gradient(135deg, var(--color-gold), #ffd700)',
            boxShadow:
              theme === 'dark'
                ? '0 0 8px var(--border-glow)'
                : '0 0 8px var(--border-gold)',
          }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>
      </button>
    </nav>
  )
}

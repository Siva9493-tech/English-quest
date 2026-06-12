import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/modules', label: 'Module Map' },
  { to: '/practice', label: 'Daily Practice' },
]

export default function Navbar({ theme, onToggleTheme }) {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center gap-2 px-6 py-3 backdrop-blur-md"
      style={{
        background: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)',
        borderBottom: '1px solid var(--border-glow)',
      }}
    >
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
        onClick={onToggleTheme}
        aria-label="Toggle dark and light mode"
        className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-transform hover:scale-110"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glow)',
        }}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>
    </nav>
  )
}

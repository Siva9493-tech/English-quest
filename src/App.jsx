import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import Navbar from './components/Navbar'
import Pandu from './components/Pandu'
import Home from './pages/Home'
import ModuleMap from './pages/ModuleMap'
import ModuleDetail from './pages/ModuleDetail'
import DailyPractice from './pages/DailyPractice'
import Analytics from './pages/Analytics'
import Capstone from './pages/Capstone'
import Login from './pages/Login'
import { preloadAriaVoice } from './components/Pandu/AriaVoice'
import { sendReminderEmail, shouldSendReminder } from './utils/emailReminder'
import { getPanduUser } from './components/Pandu/PanduMemory'
import { getSession, onAuthStateChange } from './utils/auth'
import { registerAutoSync, syncPending } from './utils/database'

// Verify the Supabase URL is a real project URL (not a placeholder) on app start.
console.log(
  'Supabase URL:',
  import.meta.env.VITE_SUPABASE_URL?.includes('supabase.co')
    ? 'correct ✅'
    : 'wrong URL ❌',
)

export default function App() {
  // Auth session: undefined = still loading, null = signed out, object = signed in.
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    let active = true
    getSession().then((s) => {
      if (active) setSession(s)
    })
    const sub = onAuthStateChange((_user, s) => setSession(s))
    return () => {
      active = false
      sub?.unsubscribe()
    }
  }, [])

  // When a session is present, flush anything queued offline and keep syncing
  // whenever connectivity returns.
  useEffect(() => {
    if (!session) return
    syncPending()
    return registerAutoSync()
  }, [session])

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('appTheme')
      return saved === 'light' || saved === 'dark' ? saved : 'dark'
    } catch {
      return 'dark'
    }
  })

  // Apply theme to <html> and persist whenever it changes.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('appTheme', theme)
    } catch {
      // ignore write failures
    }
  }, [theme])

  // Cursor effects: (1) move the grid light-pool by writing --mouse-x/--mouse-y,
  // and (2) spawn a short-lived ripple ring.
  useEffect(() => {
    const root = document.documentElement
    let rafId = 0
    let pendingX = 0
    let pendingY = 0

    const applyPosition = () => {
      rafId = 0
      root.style.setProperty('--mouse-x', pendingX + 'px')
      root.style.setProperty('--mouse-y', pendingY + 'px')
    }

    const spawnRipple = (x, y) => {
      const ripple = document.createElement('div')
      ripple.className = 'cursor-ripple'
      ripple.style.left = x + 'px'
      ripple.style.top = y + 'px'
      document.body.appendChild(ripple)
      setTimeout(() => ripple.remove(), 600)
    }

    let lastRipple = 0
    const onMove = (e) => {
      // Grid pool follows every move (rAF-batched, cheap).
      pendingX = e.clientX
      pendingY = e.clientY
      if (!rafId) rafId = requestAnimationFrame(applyPosition)
      // Ripple is throttled to 80ms so it doesn't flood the DOM.
      const now = Date.now()
      if (now - lastRipple > 80) {
        lastRipple = now
        spawnRipple(e.clientX, e.clientY)
      }
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  useEffect(() => {
    preloadAriaVoice()
  }, [])

  // Send a daily reminder email if the user opens the app after 6pm
  // and one hasn't already been sent today (respects the toggle).
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 18 && shouldSendReminder()) {
      const userData = getPanduUser()
      const streak = localStorage.getItem('streak') || 0
      if (userData?.email) {
        sendReminderEmail(userData, streak)
      }
    }
  }, [])

  // Hidden reset: append ?reset=true to clear localStorage and redirect home
  useEffect(() => {
    if (window.location.search.includes('reset=true')) {
      localStorage.clear()
      window.location.href = '/'
    }
  }, [])

  // Still restoring the session — avoid flashing the login page.
  if (session === undefined) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ color: 'var(--color-cyan)', fontWeight: 700 }}
      >
        Loading…
      </div>
    )
  }

  return (
    <BrowserRouter>
      {/* bright grid layer revealed in the cursor light-pool (depth effect) */}
      <div id="grid-spotlight" aria-hidden="true" />
      <div className="min-h-screen text-left">
        {session && <Navbar theme={theme} onToggleTheme={toggleTheme} />}
        <main className="mx-auto max-w-4xl p-6">
          <Routes>
            {/* Auth route: bounce to home if already signed in. */}
            <Route
              path="/login"
              element={session ? <Navigate to="/" replace /> : <Login />}
            />

            {/* App routes: require a session, otherwise redirect to /login. */}
            <Route
              path="/"
              element={<RequireAuth session={session}><Home /></RequireAuth>}
            />
            <Route
              path="/modules"
              element={<RequireAuth session={session}><ModuleMap /></RequireAuth>}
            />
            <Route
              path="/modules/:moduleId"
              element={<RequireAuth session={session}><ModuleDetail /></RequireAuth>}
            />
            <Route
              path="/practice"
              element={<RequireAuth session={session}><DailyPractice /></RequireAuth>}
            />
            <Route
              path="/practice/:subtopicId"
              element={<RequireAuth session={session}><DailyPractice /></RequireAuth>}
            />
            <Route
              path="/analytics"
              element={<RequireAuth session={session}><Analytics /></RequireAuth>}
            />
            <Route
              path="/capstone"
              element={<RequireAuth session={session}><Capstone /></RequireAuth>}
            />
          </Routes>
        </main>
        {session && <Pandu />}
      </div>
    </BrowserRouter>
  )
}

// Route guard: render children when authenticated, else redirect to /login,
// preserving where the user was trying to go.
function RequireAuth({ session, children }) {
  const location = useLocation()
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

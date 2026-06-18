import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Pandu from './components/Pandu'
import Home from './pages/Home'
import ModuleMap from './pages/ModuleMap'
import ModuleDetail from './pages/ModuleDetail'
import DailyPractice from './pages/DailyPractice'
import Analytics from './pages/Analytics'
import { preloadAriaVoice } from './components/Pandu/AriaVoice'

export default function App() {
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

  // Hidden reset: append ?reset=true to clear localStorage and redirect home
  useEffect(() => {
    if (window.location.search.includes('reset=true')) {
      localStorage.clear()
      window.location.href = '/'
    }
  }, [])

  return (
    <BrowserRouter>
      {/* bright grid layer revealed in the cursor light-pool (depth effect) */}
      <div id="grid-spotlight" aria-hidden="true" />
      <div className="min-h-screen text-left">
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        <main className="mx-auto max-w-4xl p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/modules" element={<ModuleMap />} />
            <Route path="/modules/:moduleId" element={<ModuleDetail />} />
            <Route path="/practice" element={<DailyPractice />} />
            <Route path="/practice/:subtopicId" element={<DailyPractice />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
        <Pandu />
      </div>
    </BrowserRouter>
  )
}

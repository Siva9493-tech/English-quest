import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Pandu from './components/Pandu'
import Home from './pages/Home'
import ModuleMap from './pages/ModuleMap'
import ModuleDetail from './pages/ModuleDetail'
import DailyPractice from './pages/DailyPractice'

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

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <BrowserRouter>
      <div className="min-h-screen text-left">
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        <main className="mx-auto max-w-4xl p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/modules" element={<ModuleMap />} />
            <Route path="/modules/:moduleId" element={<ModuleDetail />} />
            <Route path="/practice" element={<DailyPractice />} />
            <Route path="/practice/:subtopicId" element={<DailyPractice />} />
          </Routes>
        </main>
        <Pandu />
      </div>
    </BrowserRouter>
  )
}

import { useEffect, useState } from 'react'
import { Link, NavLink, Routes, Route } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'

import Home from './pages/Home.jsx'
import Dictionary from './pages/Dictionary.jsx'
import Detect from './pages/Detect.jsx'
import Quiz from './pages/Quiz.jsx'

function App() {
  const [introDone, setIntroDone] = useState(false)


  // Wait for intro from Hero to finish before showing header/nav
  useEffect(() => {
    const handler = () => setIntroDone(true)
    window.addEventListener('intro:done', handler)
    return () => window.removeEventListener('intro:done', handler)
  }, [])

  const navLinkClass = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:bg-indigo-400 after:rounded-full after:transition-all after:duration-300 ${isActive ? 'text-white after:w-full' : 'after:w-0 hover:after:w-full'}`

  return (
    <Motion.div
      key="app-shell"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen text-slate-200 bg-app animate-gradient-slow selection:bg-indigo-500/30 selection:text-white"
    >
      {/* Top Bar */}
      {introDone && (
        <Motion.header
          className="sticky top-0 z-40 backdrop-blur bg-transparent"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto max-w-screen-xl px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-xl font-extrabold tracking-tight">
                InSignia
              </Link>
              <span className="text-slate-600 mx-2">|</span>
              <nav className="flex items-center gap-1">
                <NavLink to="/" className={navLinkClass}>
                  Home
                </NavLink>
                <NavLink to="/dictionary" className={navLinkClass}>
                  Dictionary
                </NavLink>
                <NavLink to="/detect" className={navLinkClass}>
                  Sign Detection
                </NavLink>
                <NavLink to="/quiz" className={navLinkClass}>
                  Quiz Game
                </NavLink>
              </nav>
            </div>
 
            <div className="shrink-0">
              <span className="inline-flex items-center rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs text-slate-300">
                Running: locally
              </span>
            </div>
          </div>
        </Motion.header>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-screen-xl px-4 pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dictionary" element={<Dictionary />} />
          <Route path="/detect" element={<Detect />} />
          <Route path="/quiz" element={<Quiz />} />
        </Routes>
      </main>


    </Motion.div>
  )
}

export default App

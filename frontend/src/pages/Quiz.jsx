import { useEffect, useMemo, useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'

// Stream API endpoints
const STREAM_URL = import.meta.env.VITE_DETECT_API_URL?.replace('/detect', '/video_feed') || 'http://localhost:8002/video_feed'
const STATUS_URL = import.meta.env.VITE_DETECT_API_URL?.replace('/detect', '/status') || 'http://localhost:8002/status'

// Huruf yang dapat dideteksi oleh model SIBI (24 kelas: A-Y tanpa J dan Z)
const LETTERS = 'ABCDEFGHIKLMNOPQRSTUVWXY'.split('')
const MAX_QUESTIONS = 10
const POINT_PER = 10
const LB_KEY = 'insignia.leaderboard.v1'

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LB_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLeaderboard(rows) {
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(rows))
  } catch { /* noop */ }
}

export default function Quiz() {
  // Game state
  const [mode, setMode] = useState('normal') // 'normal' | 'practice'
  const [questionIdx, setQuestionIdx] = useState(0)
  const [target, setTarget] = useState(randomLetter())
  const [score, setScore] = useState(0)
  const [seconds, setSeconds] = useState(10)
  const [finished, setFinished] = useState(false)

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState(loadLeaderboard())
  const [nameInput, setNameInput] = useState('')

  // Stream state
  const [streamError, setStreamError] = useState(false)
  const [stats, setStats] = useState({
    camera_active: false,
    last_detection: '-',
    last_confidence: 0,
    fps: 0
  })

  // Visual feedback
  const [flash, setFlash] = useState(null) // 'success' | 'fail' | null
  const [prediction, setPrediction] = useState({ label: '-', conf: 0 })
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionError, setDetectionError] = useState('')
  
  // Game control
  const [started, setStarted] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Poll stream status for current detection
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(STATUS_URL)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
          setDetectionError('')
        }
      } catch (err) {
        setDetectionError('Server tidak tersambung. Pastikan stream_server.py berjalan.')
      }
    }

    pollStatus() // Initial fetch
    const interval = setInterval(pollStatus, 500) // Poll every 500ms for responsiveness

    return () => clearInterval(interval)
  }, [])

  // Timer for normal mode
  useEffect(() => {
    if (mode !== 'normal' || finished || !started) return
    setSeconds(10)
  }, [questionIdx, mode, finished, started])

  useEffect(() => {
    if (mode !== 'normal' || finished || !started) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id)
          handleSkip(true)
          return 10
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIdx, mode, finished, started])

  // Keyboard: Space to capture
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleCapture()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const progressText = useMemo(() => {
    return mode === 'normal' ? `${questionIdx + 1}/${MAX_QUESTIONS}` : 'Practice'
  }, [mode, questionIdx])

  function nextQuestion() {
    if (mode === 'normal') {
      const next = questionIdx + 1
      if (next >= MAX_QUESTIONS) {
        setStarted(false)
        setFinished(true)
        return
      }
      setQuestionIdx(next)
    }
    setTarget(randomLetter())
    setPrediction({ label: '-', conf: 0 })
  }

  async function handleCapture() {
    if (!started || finished || isDetecting) return
    
    setIsDetecting(true)
    
    // Get current detection from stream status (instead of capturing and sending)
    const res = {
      label: stats.last_detection,
      conf: stats.last_confidence
    }
    
    setPrediction(res)
    
    const correct = res.label === target
    if (correct) {
      setFlash('success')
      if (mode === 'normal') setScore((s) => Math.min(100, s + POINT_PER))
      setTimeout(() => setFlash(null), 500)
      setTimeout(() => nextQuestion(), 600)
    } else {
      setFlash('fail')
      setTimeout(() => setFlash(null), 500)
      if (mode === 'normal') {
        setTimeout(() => nextQuestion(), 600)
      }
    }
    
    setTimeout(() => setIsDetecting(false), 700)
  }

  function handleSkip(penalize = true) {
    if (!started || finished) return
    nextQuestion()
  }

  function handleStartGame() {
    setMode('normal')
    setStarted(true)
    setFinished(false)
    setQuestionIdx(0)
    setScore(0)
    setSeconds(10)
    setTarget(randomLetter())
    setPrediction({ label: '-', conf: 0 })
  }

  function handleStartPractice() {
    setMode('practice')
    setStarted(true)
    setFinished(false)
    setQuestionIdx(0)
    setScore(0)
    setTarget(randomLetter())
    setPrediction({ label: '-', conf: 0 })
  }

  function handleRestart() {
    setStarted(false)
    setFinished(false)
    setQuestionIdx(0)
    setScore(0)
    setSeconds(10)
    setPrediction({ label: '-', conf: 0 })
  }

  function handleSubmitScore() {
    if (!nameInput.trim()) return

    const newEntry = {
      name: nameInput.trim(),
      score,
      date: new Date().toISOString()
    }

    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    setLeaderboard(updated)
    saveLeaderboard(updated)
    setNameInput('')
  }

  const sortedLeaderboard = useMemo(
    () => [...leaderboard].sort((a, b) => b.score - a.score),
    [leaderboard]
  )

  const handleStreamError = () => setStreamError(true)
  const handleStreamLoad = () => setStreamError(false)

  return (
    <section className="pt-16 pb-8">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-200">Quiz Game</h2>
            <p className="mt-2 text-slate-300">
              Tebak huruf SIBI menggunakan kamera. Tunjukkan isyarat tangan yang benar dan tekan Space/Capture untuk menjawab.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-400/50 text-indigo-200 hover:bg-indigo-500/20 transition"
          >
            {showHelp ? 'Hide' : 'Show'} Help
          </button>
        </div>

        {/* Help Panel */}
        <AnimatePresence>
          {showHelp && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
                <h3 className="text-lg font-semibold text-indigo-200 mb-2">📖 Cara Bermain</h3>
                <ul className="space-y-1 text-sm text-indigo-100/80">
                  <li>• <strong>Normal Mode:</strong> 10 pertanyaan, timer 10 detik per soal</li>
                  <li>• <strong>Practice Mode:</strong> Tanpa batas waktu, pilih huruf sendiri</li>
                  <li>• Tunjukkan gestur SIBI ke kamera</li>
                  <li>• Tekan Space atau tombol Capture untuk menjawab</li>
                  <li>• Skip jika tidak tahu (Normal: lanjut soal berikutnya)</li>
                </ul>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Stream Error Warning */}
        {!stats.camera_active && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
            <p className="text-rose-200 text-sm">
              ⚠️ Server tidak aktif. Pastikan <code className="text-rose-300">stream_server.py</code> berjalan di port 8002.
            </p>
          </div>
        )}

        {/* Finished Screen */}
        {finished && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6"
          >
            <h3 className="text-2xl font-bold text-emerald-200 mb-4">🎉 Game Selesai!</h3>
            <p className="text-3xl font-extrabold text-white mb-4">Score: {score}/100</p>
            
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Masukkan nama Anda"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitScore()}
                  className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white placeholder:text-slate-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitScore}
                  disabled={!nameInput.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit ke Leaderboard
                </button>
                <button
                  onClick={handleRestart}
                  className="flex-1 px-4 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600"
                >
                  Main Lagi
                </button>
              </div>
            </div>
          </Motion.div>
        )}

        {/* Start Screen */}
        {!started && !finished && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <button
              onClick={handleStartGame}
              className="p-6 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
            >
              <h3 className="text-xl font-bold text-emerald-200 mb-2">🎮 Normal Mode</h3>
              <p className="text-sm text-emerald-100/80">10 soal • Timer • High score</p>
            </button>
            <button
              onClick={handleStartPractice}
              className="p-6 rounded-2xl border-2 border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 transition"
            >
              <h3 className="text-xl font-bold text-indigo-200 mb-2">📚 Practice Mode</h3>
              <p className="text-sm text-indigo-100/80">Tanpa batas • Pilih huruf</p>
            </button>
          </div>
        )}

        {/* Main Game Area */}
        {started && !finished && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Video Stream */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                {/* Target Letter Display */}
                <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 text-sm">Tunjukkan huruf:</span>
                      <Motion.div
                        key={target}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                      >
                        <span className="text-4xl font-black text-white">{target}</span>
                      </Motion.div>
                    </div>
                    
                    {mode === 'normal' && started && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">Waktu:</span>
                        <div className={`text-2xl font-bold tabular-nums ${seconds <= 3 ? 'text-rose-400' : 'text-white'}`}>
                          {seconds}s
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Stream Container */}
                <div className="relative aspect-video bg-black">
                  {!streamError ? (
                    <img
                      src={STREAM_URL}
                      alt="SIBI Detection Stream"
                      className="w-full h-full object-contain"
                      onError={handleStreamError}
                      onLoad={handleStreamLoad}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-rose-400 text-lg font-semibold mb-2">❌ Stream Error</p>
                        <p className="text-slate-400 text-sm">Pastikan stream_server.py berjalan</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Flash Overlay */}
                  <AnimatePresence>
                    {flash && (
                      <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 pointer-events-none ${
                          flash === 'success' 
                            ? 'bg-emerald-500/30 border-4 border-emerald-400' 
                            : 'bg-rose-500/30 border-4 border-rose-400'
                        }`}
                      />
                    )}
                  </AnimatePresence>

                  {/* Prediction Overlay */}
                  {prediction.label !== '-' && (
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                      <div className="text-xs text-slate-400">Detected:</div>
                      <div className="text-2xl font-bold text-white">{prediction.label}</div>
                      <div className="text-xs text-emerald-400">{(prediction.conf * 100).toFixed(1)}%</div>
                    </div>
                  )}

                  {/* Result Feedback */}
                  {flash && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`text-6xl font-bold ${
                        flash === 'success' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {flash === 'success' ? '✓' : '✗'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="p-4 border-t border-slate-700/50 space-y-3">
                  <button
                    onClick={handleCapture}
                    disabled={isDetecting}
                    className="w-full px-4 py-3 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDetecting ? '⏳ Processing...' : '📸 Capture (Space)'}
                  </button>
                  <button
                    onClick={() => handleSkip(false)}
                    className="w-full px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-400/50 text-amber-200 hover:bg-amber-500/20 transition font-medium"
                  >
                    ⏭️ Skip
                  </button>

                  {/* Camera Info */}
                  <div className="text-xs text-slate-500 text-center pt-2">
                    Stream: {stats.camera_active ? '🟢 Active' : '🔴 Offline'} • FPS: {stats.fps.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Practice Mode - Letter Selection */}
              {mode === 'practice' && (
                <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-3">Pilih Huruf</h3>
                  <div className="grid grid-cols-6 gap-1.5">
                    {LETTERS.map((ch) => (
                      <button
                        key={ch}
                        onClick={() => { setTarget(ch); setPrediction({ label: '-', conf: 0 }); }}
                        className={`aspect-square rounded-lg text-sm font-bold transition-all ${
                          ch === target
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Stats */}
            <div className="space-y-4">
              {/* Game Info */}
              <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Mode</span>
                    <span className="text-white font-medium">{mode === 'normal' ? 'Normal' : 'Practice'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Game</span>
                    <span className="text-white font-medium">{started && !finished ? 'Running' : 'Paused'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Prediksi Terakhir</span>
                    <span className="text-white font-medium">-</span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Progress</span>
                  <span className="text-white font-medium">{progressText}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Score</span>
                  <span className="text-emerald-400 font-bold text-2xl">{score}</span>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/30 p-4">
                <h3 className="text-sm font-semibold text-indigo-200 mb-2">💡 Tips</h3>
                <ul className="space-y-1 text-xs text-indigo-100/80">
                  <li>• Pastikan tangan terlihat jelas di kamera</li>
                  <li>• Gunakan pencahayaan yang cukup</li>
                  <li>• Tekan Space untuk capture cepat</li>
                  <li>• Background polos membantu deteksi</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {mode === 'normal' && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="text-xl font-bold text-white mb-4">🏆 Leaderboard</h3>
            {sortedLeaderboard.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Belum ada score. Jadilah yang pertama!</p>
            ) : (
              <div className="space-y-2">
                {sortedLeaderboard.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}</span>
                      <span className="font-medium text-white">{entry.name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

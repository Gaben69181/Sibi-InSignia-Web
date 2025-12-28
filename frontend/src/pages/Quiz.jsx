import { useEffect, useMemo, useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'

// Stream API endpoints
const STREAM_URL = import.meta.env.VITE_DETECT_API_URL?.replace('/detect', '/video_feed') || 'http://localhost:8003/video_feed'
const STATUS_URL = import.meta.env.VITE_DETECT_API_URL?.replace('/detect', '/status') || 'http://localhost:8003/status'
const CAMERAS_URL = import.meta.env.VITE_DETECT_API_URL?.replace('/detect', '/cameras') || 'http://localhost:8003/cameras'
const SWITCH_CAMERA_URL = import.meta.env.VITE_DETECT_API_URL?.replace('/detect', '/switch_camera') || 'http://localhost:8003/switch_camera'
const START_CAMERA_URL = import.meta.env.VITE_DETECT_API_URL?.replace('/detect', '/start_camera') || 'http://localhost:8003/start_camera'
const STOP_CAMERA_URL = import.meta.env.VITE_DETECT_API_URL?.replace('/detect', '/stop_camera') || 'http://localhost:8003/stop_camera'

// Huruf yang dapat dideteksi oleh model SIBI (24 kelas: A-Y tanpa J dan Z)
const LETTERS = 'ABCDEFGHIKLMNOPQRSTUVWXY'.split('')
const MAX_QUESTIONS = 10
const POINT_PER = 10
const LB_KEY = 'insignia.leaderboard.v2'

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
  const [gameReady, setGameReady] = useState(false) // State untuk menandai game sudah siap (timer boleh jalan)

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState(loadLeaderboard())
  const [nameInput, setNameInput] = useState('')
  const [playerName, setPlayerName] = useState('') // Nama player yang disimpan sebelum main
  const [showNameInput, setShowNameInput] = useState(false) // State untuk tampilkan input nama
  const [leaderboardMessage, setLeaderboardMessage] = useState('') // Message untuk leaderboard update

  // Stream state
  const [streamError, setStreamError] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    camera_active: false,
    last_detection: '-',
    last_confidence: 0,
    fps: 0,
    current_camera_id: 0
  })
  const [cameras, setCameras] = useState([])
  const [switchingCamera, setSwitchingCamera] = useState(false)
  const [togglingCamera, setTogglingCamera] = useState(false)

  // Visual feedback
  const [flash, setFlash] = useState(null) // 'success' | 'fail' | null
  const [prediction, setPrediction] = useState({ label: '-', conf: 0 })
  const [isDetecting, setIsDetecting] = useState(false)
  
  // Game control
  const [started, setStarted] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Fetch available cameras on mount
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const res = await fetch(CAMERAS_URL)
        if (res.ok) {
          const data = await res.json()
          setCameras(data.cameras || [])
        }
      } catch {
        console.error('Failed to fetch cameras')
      }
    }

    fetchCameras()
  }, [])

  // Poll stream status for current detection
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(STATUS_URL)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
          setError('')
        }
      } catch {
        setError('Server tidak tersambung. Pastikan Python server berjalan.')
      }
    }

    pollStatus() // Initial fetch
    const interval = setInterval(pollStatus, 1000) // Poll every 1000ms for better performance

    return () => clearInterval(interval)
  }, [])

  // Set gameReady ketika kamera aktif (untuk pertama kali)
  useEffect(() => {
    if (started && !finished && stats.camera_active && !gameReady) {
      setGameReady(true)
    }
  }, [started, finished, stats.camera_active, gameReady])

  // Timer for normal mode - only run when camera is active AND game is ready
  useEffect(() => {
    if (mode !== 'normal' || finished || !started || !stats.camera_active || !gameReady) return
    setSeconds(10)
  }, [questionIdx, mode, finished, started, stats.camera_active, gameReady])

  useEffect(() => {
    if (mode !== 'normal' || finished || !started || !stats.camera_active || !gameReady) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id)
          handleSkip()
          return 10
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIdx, mode, finished, started, stats.camera_active, gameReady])

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

  function handleSkip() {
    if (!started || finished) return
    nextQuestion()
  }

  function handleStartGame() {
    // Tampilkan input nama terlebih dahulu
    setShowNameInput(true)
    setMode('normal')
  }

  function handleStartGameWithName() {
    // Mulai game setelah nama diinput
    if (!nameInput.trim()) return
    setPlayerName(nameInput.trim())
    setStarted(true)
    setFinished(false)
    setQuestionIdx(0)
    setScore(0)
    setSeconds(10)
    setTarget(randomLetter())
    setPrediction({ label: '-', conf: 0 })
    setShowNameInput(false)
    setGameReady(false) // Reset gameReady, akan aktif otomatis saat kamera nyala
    setLeaderboardMessage('') // Reset message
  }

  function handleStartPractice() {
    setMode('practice')
    setStarted(true)
    setFinished(false)
    setQuestionIdx(0)
    setScore(0)
    setTarget(randomLetter())
    setPrediction({ label: '-', conf: 0 })
    setGameReady(false) // Practice mode tidak perlu timer, tapi tetap reset
  }

  function handleRestart() {
    setStarted(false)
    setFinished(false)
    setQuestionIdx(0)
    setScore(0)
    setSeconds(10)
    setPrediction({ label: '-', conf: 0 })
    setShowNameInput(false)
    setGameReady(false)
  }

  function handlePlayAgain() {
    // Main lagi dengan nama yang sama
    setStarted(true)
    setFinished(false)
    setQuestionIdx(0)
    setScore(0)
    setSeconds(10)
    setTarget(randomLetter())
    setPrediction({ label: '-', conf: 0 })
    setGameReady(false) // Reset, timer akan mulai setelah kamera aktif
    setLeaderboardMessage('') // Reset message
  }

  function handleChangeName() {
    // Ganti nama dan kembali ke awal
    setPlayerName('')
    setNameInput('')
    setStarted(false)
    setFinished(false)
    setQuestionIdx(0)
    setScore(0)
    setSeconds(10)
    setPrediction({ label: '-', conf: 0 })
    setGameReady(false)
    setLeaderboardMessage('') // Reset message
  }

  function handleSubmitScore() {
    if (!playerName.trim()) return

    const trimmedName = playerName.trim()
    
    // Check apakah nama sudah ada di leaderboard
    const existingEntryIndex = leaderboard.findIndex(
      entry => entry.name.toLowerCase() === trimmedName.toLowerCase()
    )
    
    let updated
    let message = ''
    
    if (existingEntryIndex !== -1) {
      // Nama sudah ada - hanya update jika score baru lebih tinggi
      const existingScore = leaderboard[existingEntryIndex].score
      
      if (score > existingScore) {
        // Score baru lebih tinggi - update entry
        updated = [...leaderboard]
        updated[existingEntryIndex] = {
          name: trimmedName,
          score,
          date: new Date().toISOString()
        }
        message = `🎉 New High Score! Meningkat dari ${existingScore} → ${score}`
      } else if (score === existingScore) {
        // Score sama
        message = `Score sama dengan rekor sebelumnya (${existingScore}). Coba tingkatkan lagi!`
        setLeaderboardMessage(message)
        return // Keluar tanpa update
      } else {
        // Score baru lebih rendah
        message = `Score kamu ${score}. Rekor terbaik: ${existingScore}. Main lagi untuk pecahkan rekor!`
        setLeaderboardMessage(message)
        return // Keluar tanpa update
      }
    } else {
      // Nama belum ada - tambahkan entry baru
      const newEntry = {
        name: trimmedName,
        score,
        date: new Date().toISOString()
      }
      updated = [...leaderboard, newEntry]
      message = `✅ Score pertama kamu masuk Leaderboard!`
    }
    
    // Sort by score (highest first) dan ambil top 10
    const sorted = updated
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    setLeaderboard(sorted)
    saveLeaderboard(sorted)
    setLeaderboardMessage(message)
  }

  // Auto submit ketika game selesai (Normal Mode)
  useEffect(() => {
    if (finished && mode === 'normal' && playerName && score >= 0) {
      handleSubmitScore()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, mode, playerName, score])

  const sortedLeaderboard = useMemo(
    () => [...leaderboard].sort((a, b) => b.score - a.score),
    [leaderboard]
  )

  const handleStreamError = () => setStreamError(true)
  const handleStreamLoad = () => setStreamError(false)

  const handleSwitchCamera = async (cameraId) => {
    setSwitchingCamera(true)
    try {
      const res = await fetch(`${SWITCH_CAMERA_URL}/${cameraId}`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        if (!data.success) {
          console.error(data.message || 'Gagal mengganti kamera')
        }
        // Force reload stream
        setStreamError(false)
      }
    } catch {
      console.error('Gagal mengganti kamera')
    } finally {
      setSwitchingCamera(false)
    }
  }

  const handleToggleCamera = async () => {
    setTogglingCamera(true)
    try {
      const url = stats.camera_active ? STOP_CAMERA_URL : START_CAMERA_URL
      const res = await fetch(url, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        if (!data.success) {
          console.error(data.message || 'Gagal toggle kamera')
        }
        // Force reload stream
        setStreamError(false)
      }
    } catch {
      console.error('Gagal toggle kamera')
    } finally {
      setTogglingCamera(false)
    }
  }

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
          <div className="flex gap-2">
            {started && (
              <button
                type="button"
                onClick={() => {
                  setStarted(false)
                  setFinished(false)
                  setQuestionIdx(0)
                  setScore(0)
                  setSeconds(10)
                  setPrediction({ label: '-', conf: 0 })
                }}
                className="px-4 py-2 rounded-lg bg-slate-500/10 border border-slate-400/50 text-slate-200 hover:bg-slate-500/20 transition"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-400/50 text-indigo-200 hover:bg-indigo-500/20 transition"
            >
              {showHelp ? 'Hide' : 'Show'} Help
            </button>
          </div>
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
              ⚠️ Server tidak aktif. Pastikan <code className="text-rose-300">stream_server.py</code> berjalan di port 8003.
            </p>
          </div>
        )}

        {/* Status Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
            <p className="text-rose-200 text-sm">
              {error}
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
            <p className="text-slate-300 mb-2">Player: <span className="font-semibold text-white">{playerName}</span></p>
            <p className="text-3xl font-extrabold text-white mb-4">Score: {score}/100</p>
            
            {mode === 'normal' && leaderboardMessage && (
              <div className={`mb-4 p-3 rounded-lg border ${
                leaderboardMessage.includes('New High Score') || leaderboardMessage.includes('pertama')
                  ? 'bg-emerald-500/10 border-emerald-400/30'
                  : 'bg-amber-500/10 border-amber-400/30'
              }`}>
                <p className={`text-sm text-center font-medium ${
                  leaderboardMessage.includes('New High Score') || leaderboardMessage.includes('pertama')
                    ? 'text-emerald-200'
                    : 'text-amber-200'
                }`}>
                  {leaderboardMessage}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handlePlayAgain}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600"
              >
                🎮 Main Lagi
              </button>
              <button
                onClick={handleChangeName}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600"
              >
                🔄 Ganti Nama
              </button>
            </div>
          </Motion.div>
        )}

        {/* Name Input Screen (Normal Mode) */}
        {showNameInput && !started && !finished && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 p-6 max-w-md mx-auto"
          >
            <h3 className="text-2xl font-bold text-emerald-200 mb-2">🎮 Normal Mode</h3>
            <p className="text-slate-300 text-sm mb-4">
              Masukkan nama kamu untuk mulai bermain. Score kamu akan otomatis masuk ke Leaderboard!
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Nama Player</label>
                <input
                  type="text"
                  placeholder="Masukkan nama kamu..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartGameWithName()}
                  className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowNameInput(false); setNameInput(''); }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-500/10 border border-slate-400/50 text-slate-200 hover:bg-slate-500/20 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleStartGameWithName}
                  disabled={!nameInput.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Mulai Game
                </button>
              </div>
            </div>
          </Motion.div>
        )}

        {/* Start Screen */}
        {!started && !finished && !showNameInput && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <button
              onClick={handleStartGame}
              className="p-6 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
            >
              <h3 className="text-xl font-bold text-emerald-200 mb-2">🎮 Normal Mode</h3>
              <p className="text-sm text-emerald-100/80">10 soal • Timer • Masuk Leaderboard</p>
            </button>
            <button
              onClick={handleStartPractice}
              className="p-6 rounded-2xl border-2 border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 transition"
            >
              <h3 className="text-xl font-bold text-indigo-200 mb-2">📚 Practice Mode</h3>
              <p className="text-sm text-indigo-100/80">Tanpa batas • Tanpa skor</p>
            </button>
          </div>
        )}

        {/* Ready Notification - Kamera belum aktif */}
        {started && !finished && !gameReady && mode === 'normal' && (
          <Motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏸️</span>
              <div>
                <p className="text-amber-200 font-medium">Timer Belum Dimulai</p>
                <p className="text-amber-100/70 text-sm">
                  Tekan tombol <strong>Start</strong> untuk menyalakan kamera, timer akan otomatis dimulai!
                </p>
              </div>
            </div>
          </Motion.div>
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
                    
                    <div className="flex items-center gap-2">
                      {/* Camera Toggle */}
                      <button
                        onClick={handleToggleCamera}
                        disabled={togglingCamera}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          stats.camera_active
                            ? 'bg-rose-500/20 border border-rose-400/50 text-rose-200 hover:bg-rose-500/30'
                            : 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {togglingCamera ? '...' : (stats.camera_active ? 'Stop' : 'Start')}
                      </button>
                      {/* Camera Selector */}
                      {cameras.length > 1 && (
                        <select
                          value={stats.current_camera_id}
                          onChange={(e) => handleSwitchCamera(parseInt(e.target.value))}
                          disabled={switchingCamera || !stats.camera_active}
                          className="text-xs rounded-lg bg-slate-700/80 border border-slate-600/50 text-slate-200 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cameras.map((cam) => (
                            <option key={cam.id} value={cam.id}>
                              {cam.name}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {mode === 'normal' && started && (
                        <>
                          <span className="text-slate-400 text-sm">Waktu:</span>
                          <div className={`text-2xl font-bold tabular-nums ${seconds <= 3 ? 'text-rose-400' : 'text-white'}`}>
                            {seconds}s
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video Stream Container */}
                <div className="relative aspect-video bg-black">
                  {!streamError && stats.camera_active ? (
                    <img
                      src={STREAM_URL}
                      alt="SIBI Detection Stream"
                      className="w-full h-full object-cover"
                      onError={handleStreamError}
                      onLoad={handleStreamLoad}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        {stats.camera_active ? (
                          <>
                            <p className="text-rose-400 text-lg font-semibold mb-2">❌ Stream Error</p>
                            <p className="text-slate-400 text-sm">Pastikan stream_server.py berjalan</p>
                          </>
                        ) : (
                          <>
                            <p className="text-slate-400 text-lg font-semibold mb-2">📷 Camera Off</p>
                            <p className="text-slate-500 text-sm">Klik "Start" untuk menyalakan</p>
                          </>
                        )}
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
                    onClick={() => handleSkip()}
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
                    <span className="text-white font-medium">{stats.last_detection || '-'}</span>
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
      </div>
    </section>
  )
}

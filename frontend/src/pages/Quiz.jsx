import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'

// API endpoint for SIBI detection model
const DETECT_API_URL = import.meta.env.VITE_DETECT_API_URL || 'http://localhost:8002/detect'

// Huruf yang dapat dideteksi oleh model SIBI
// Tidak termasuk: J (tidak ada di training), U (hilang karena label shift)
const LETTERS = 'ABCDEFGHIKLMNOPQRSTVWXYZ'.split('')
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

  // Webcam
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const streamRef = useRef(null)

  // Visual feedback
  const [flash, setFlash] = useState(null) // 'success' | 'fail' | null
  const [prediction, setPrediction] = useState({ label: '-', conf: 0 })
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionError, setDetectionError] = useState('')
  
  // Game control
  const [started, setStarted] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Enumerate cameras on mount
  useEffect(() => {
    async function initDevices() {
      try {
        const d = await navigator.mediaDevices.enumerateDevices()
        const cams = d.filter((x) => x.kind === 'videoinput')
        setDevices(cams)
        if (!deviceId && cams[0]) {
          setDeviceId(cams[0].deviceId)
        }
      } catch (e) {
        console.warn('enumerateDevices failed', e)
      }
    }
    initDevices()
  }, [deviceId])

  // Start/Restart stream when device changes
  useEffect(() => {
    let active = true
    async function start() {
      if (!deviceId) return
      try {
        // Stop previous
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId }, width: 640, height: 480 },
          audio: false,
        })
        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (e) {
        console.warn('getUserMedia failed', e)
      }
    }
    start()
    return () => {
      active = false
    }
  }, [deviceId])

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
          handleSkip(true) // time up acts like skip with penalty
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
    // For both modes, rotate target
    setTarget(randomLetter())
    setPrediction({ label: '-', conf: 0 })
  }

  // Real detection using Python model API
  const runDetection = useCallback(async () => {
    const video = videoRef.current
    if (!video) return { label: '-', conf: 0 }
    
    const canvas = canvasRef.current
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    
    if (w === 0 || h === 0) return { label: '-', conf: 0 }
    
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    
    try {
      setIsDetecting(true)
      setDetectionError('')
      
      const res = await fetch(DETECT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      
      const payload = await res.json()
      return { 
        label: payload.letter || '-', 
        conf: payload.confidence || 0 
      }
    } catch (err) {
      console.error('Detection failed:', err)
      setDetectionError('Model tidak tersambung. Pastikan server Python berjalan di port 8002.')
      return { label: '-', conf: 0 }
    } finally {
      setIsDetecting(false)
    }
  }, [])

  async function handleCapture() {
    if (!started || finished || isDetecting) return
    
    const res = await runDetection()
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
  }

  function handleSkip(penalize = true) {
    if (finished) return
    if (mode === 'normal' && penalize) {
      setScore((s) => Math.max(0, s - 5))
    }
    nextQuestion()
  }

  function resetGame() {
    setScore(0)
    setQuestionIdx(0)
    setTarget(randomLetter())
    setFinished(false)
    setSeconds(10)
    setStarted(false)
    setPrediction({ label: '-', conf: 0 })
    setDetectionError('')
  }

  function submitLeaderboard() {
    const nm = nameInput.trim() || 'Player'
    const rows = [...leaderboard, { name: nm, score, date: new Date().toISOString() }]
    rows.sort((a, b) => b.score - a.score)
    const top = rows.slice(0, 10)
    setLeaderboard(top)
    saveLeaderboard(top)
    setNameInput('')
    resetGame()
  }

  return (
    <section className="pt-8 pb-12">
      <div className="mx-auto max-w-screen-xl px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Quiz Game</h1>
          <p className="text-slate-400 max-w-2xl">
            Tebak huruf SIBI menggunakan kamera. Tunjukkan isyarat tangan yang benar dan tekan Space/Capture untuk menjawab.
          </p>
        </div>

        {/* Mode Selection & Game Info */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => {
                if (mode !== 'normal') {
                  setMode('normal')
                  resetGame()
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'normal'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎯 Normal Mode
            </button>
            <button
              onClick={() => {
                if (mode !== 'practice') {
                  setMode('practice')
                  resetGame()
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'practice'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📚 Practice
            </button>
          </div>
          
          <button
            onClick={() => setShowHelp(true)}
            className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all text-sm"
          >
            ❓ How to Play
          </button>
        </div>

        {/* Progress Bar (Normal Mode) */}
        {mode === 'normal' && !finished && (
          <div className="mb-6 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Progress: {progressText}</span>
              <span className="text-lg font-bold text-amber-400">Score: {score}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <Motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${((questionIdx) / MAX_QUESTIONS) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Camera */}
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

              {/* Video Container */}
              <div className="relative aspect-video bg-black">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-contain" 
                  playsInline 
                  muted 
                />
                <canvas ref={canvasRef} className="hidden" />
                
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
                <AnimatePresence>
                  {flash && (
                    <Motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className={`text-7xl ${flash === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {flash === 'success' ? '✓' : '✗'}
                      </div>
                    </Motion.div>
                  )}
                </AnimatePresence>

                {/* Detecting Indicator */}
                {isDetecting && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 border border-indigo-500/50">
                    <div className="flex items-center gap-2 text-indigo-300 text-sm">
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      Detecting...
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 bg-slate-900/50">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      if (started) {
                        setStarted(false)
                      } else {
                        setStarted(true)
                        if (mode === 'normal') setSeconds(10)
                      }
                    }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      started
                        ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/25'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                    }`}
                  >
                    {started ? '⏸ Pause' : '▶ Start'}
                  </button>
                  
                  <button
                    onClick={handleCapture}
                    disabled={!started || isDetecting}
                    className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    📷 Capture (Space)
                  </button>
                  
                  <button
                    onClick={() => handleSkip(true)}
                    disabled={!started}
                    className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ⏭ Skip
                  </button>
                </div>

                {/* Error Message */}
                {detectionError && (
                  <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
                    ⚠️ {detectionError}
                  </div>
                )}

                {/* Camera Selector */}
                {devices.length > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="text-slate-400 text-sm">Camera:</span>
                    <select
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {devices.map((d, idx) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Current Status */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-3">Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mode</span>
                  <span className={`font-medium ${mode === 'normal' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {mode === 'normal' ? 'Normal' : 'Practice'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Game</span>
                  <span className={`font-medium ${started ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {started ? 'Running' : 'Paused'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Prediksi Terakhir</span>
                  <span className="font-bold text-white text-xl">{prediction.label}</span>
                </div>
              </div>
            </div>

            {/* Practice Mode - Letter Selection */}
            {mode === 'practice' && (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-3">Pilih Huruf</h3>
                <div className="grid grid-cols-6 gap-1.5">
                  {LETTERS.map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setTarget(ch)}
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

            {/* Leaderboard (Normal Mode) */}
            {mode === 'normal' && (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-3">🏆 Leaderboard</h3>
                {leaderboard.length === 0 ? (
                  <p className="text-slate-400 text-sm">Belum ada skor tersimpan.</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((row, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                          i === 0 
                            ? 'bg-amber-500/10 border border-amber-500/30' 
                            : 'bg-slate-700/30 border border-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-amber-500 text-white' :
                            i === 1 ? 'bg-slate-400 text-white' :
                            i === 2 ? 'bg-amber-700 text-white' :
                            'bg-slate-600 text-slate-300'
                          }`}>
                            {i + 1}
                          </span>
                          <span className="text-white text-sm">{row.name}</span>
                        </div>
                        <span className="font-bold text-amber-400">{row.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tips */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">💡 Tips</h3>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Pastikan tangan terlihat jelas di kamera</li>
                <li>• Gunakan pencahayaan yang cukup</li>
                <li>• Tekan Space untuk capture cepat</li>
                <li>• Background polos membantu deteksi</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help Modal */}
        <AnimatePresence>
          {showHelp && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setShowHelp(false)}
            >
              <Motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-bold text-white mb-4">🎮 How to Play</h3>
                <div className="space-y-4 text-slate-300">
                  <div>
                    <h4 className="font-semibold text-emerald-400 mb-1">🎯 Normal Mode</h4>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• 10 soal dengan timer 10 detik per soal</li>
                      <li>• Jawab benar: +10 poin</li>
                      <li>• Skip/timeout: -5 poin</li>
                      <li>• Skor akan masuk leaderboard</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-400 mb-1">📚 Practice Mode</h4>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• Tidak ada timer atau skor</li>
                      <li>• Pilih huruf yang ingin dilatih</li>
                      <li>• Latihan tanpa tekanan</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-400 mb-1">⌨️ Controls</h4>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">Space</kbd> - Capture & detect</li>
                      <li>• Klik tombol Start untuk memulai</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="mt-6 w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                >
                  Got it!
                </button>
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Finish Modal */}
        <AnimatePresence>
          {finished && mode === 'normal' && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <Motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl text-center"
              >
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-2">Game Selesai!</h3>
                <p className="text-slate-400 mb-4">
                  Skor kamu: <span className="text-3xl font-bold text-amber-400">{score}</span>
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2 text-left">Nama untuk Leaderboard</label>
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Masukkan nama..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={resetGame}
                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                  >
                    Main Lagi
                  </button>
                  <button
                    onClick={submitLeaderboard}
                    className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold transition-colors"
                  >
                    Simpan Skor
                  </button>
                </div>
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

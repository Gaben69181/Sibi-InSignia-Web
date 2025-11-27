import { useEffect, useMemo, useRef, useState } from 'react'
import { motion as Motion } from 'framer-motion'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
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
          video: { deviceId: { exact: deviceId }, width: 960, height: 720 },
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
    return mode === 'normal' ? `${questionIdx}/${MAX_QUESTIONS}` : 'Practice'
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

  // Stub detection: capture a frame and "pretend" prediction equals target
  async function runDetectionStub() {
    // Draw a frame to canvas (to be wired with backend later)
    try {
      const video = videoRef.current
      if (!video) return { label: '-', conf: 0 }
      const canvas = canvasRef.current
      const w = video.videoWidth || 640
      const h = video.videoHeight || 480
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, w, h)
    } catch { /* noop */ }
    // Simulate result
    const ok = true
    const conf = (0.85 + Math.random() * 0.12).toFixed(2)
    return { label: ok ? target : randomLetter(), conf: Number(conf) }
  }

  async function handleCapture() {
    if (!started || finished) return
    // Replace with real detection integration
    const res = await runDetectionStub()
    setPrediction(res)
    const correct = res.label === target
    if (correct) {
      setFlash('success')
      if (mode === 'normal') setScore((s) => Math.min(100, s + POINT_PER))
      setTimeout(() => setFlash(null), 350)
      nextQuestion()
    } else {
      setFlash('fail')
      setTimeout(() => setFlash(null), 350)
      if (mode === 'normal') nextQuestion()
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
  }

  function submitLeaderboard() {
    const nm = nameInput.trim() || 'Player'
    const rows = [...leaderboard, { name: nm, score, date: new Date().toISOString() }]
    rows.sort((a, b) => b.score - a.score)
    const top = rows.slice(0, 10)
    setLeaderboard(top)
    saveLeaderboard(top)
    setNameInput('')
    // After saving, reset for a new run
    resetGame()
  }

  const SettingsCard = () => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-slate-200 font-semibold text-sm">Webcam Settings</div>
      <div className="mt-2">
        <select
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || 'Camera'}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="text-slate-200 font-semibold text-sm mb-2">Game Mode</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (mode !== 'normal') {
                setMode('normal')
                resetGame()
              }
            }}
            className={`px-4 py-2 rounded-lg border transition ${
              mode === 'normal'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-white/10 border-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => {
              if (mode !== 'practice') {
                setMode('practice')
                resetGame()
              }
            }}
            className={`px-4 py-2 rounded-lg border transition ${
              mode === 'practice'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-white/10 border-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            Practice
          </button>
        </div>
        {mode === 'normal' ? (
          <p className="mt-2 text-xs text-slate-400">
            10 soal, 10 detik tiap soal, skor maksimum 100 dan tercatat pada leaderboard.
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            Tidak ada timer dan leaderboard. Tersedia Hint dan kamus mini untuk latihan.
          </p>
        )}
      </div>
    </div>
  )

  const RightPanel = () => {
    if (mode === 'practice') {
      return (
        <div className="space-y-4">
          {/* Hint */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-200">Hint</h4>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="w-28 h-20 rounded-lg bg-black/30 grid place-items-center border border-white/10">
                <span className="text-4xl text-emerald-400 font-black">{target}</span>
              </div>
              <p className="text-sm text-slate-300">
                Petunjuk pembuatan huruf akan ditambahkan. Untuk sekarang, gunakan
                kamus mini di bawah untuk melihat contoh huruf lain.
              </p>
            </div>
          </div>

          {/* Sign Dictionary (mini) */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-200">Sign Dictionary</h4>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 max-h-64 overflow-auto pr-1">
              {LETTERS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setTarget(ch)}
                  className={`h-16 rounded-lg border text-lg font-bold grid place-items-center transition
                    ${ch === target ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-black/20 text-slate-200 hover:bg-white/10'}`}
                  aria-label={`Pilih huruf ${ch}`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
          <SettingsCard />
        </div>
      )
    }

    // Normal mode: Leaderboard
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h4 className="font-semibold text-slate-200">Leaderboards</h4>
          <div className="mt-3 space-y-2">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada skor tersimpan.</p>
            ) : (
              leaderboard.map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 border border-white/10"
                >
                  <div className="text-slate-200 text-sm">
                    {i + 1}. {row.name}
                  </div>
                  <div className="text-amber-300 font-semibold">{row.score}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <SettingsCard />
      </div>
    )
  }

  return (
    <section className="pt-4 lg:h-[calc(100vh-96px)] lg:overflow-hidden">
      <div className="mx-auto max-w-screen-xl px-2 sm:px-4 lg:h-full">
        {/* Progress (top, above counter) */}
        {mode === 'normal' && !finished && (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-black/30 border border-white/10 px-3 py-2">
            <div className="text-slate-300 text-sm">Progress</div>
            <div className="flex-1 mx-3 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-indigo-400 transition-all"
                style={{ width: `${(questionIdx / MAX_QUESTIONS) * 100}%` }}
              />
            </div>
            <div className="text-amber-300 font-bold">{score}</div>
          </div>
        )}

        {/* Top info row */}
        <div className="flex items-center justify-between">
          <div className="text-slate-300 font-semibold text-lg">{progressText}</div>
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" className="text-slate-300">
              <path
                fill="currentColor"
                d="M12 20q-3.35 0-5.675-2.325T4 12t2.325-5.675T12 4t5.675 2.325T20 12t-2.325 5.675T12 20m0-2q2.5 0 4.25-1.75T18 12t-1.75-4.25T12 6T7.75 7.75T6 12t1.75 4.25T12 18M13 7v5.05l4.25 2.55l-.75 1.25L11 13V7z"
              />
            </svg>
            {mode === 'normal' ? (
              <div className="text-xl font-bold tabular-nums">{started ? `${seconds}s` : 'Paused'}</div>
            ) : (
              <div className="text-slate-400 text-sm">No timer in Practice</div>
            )}
            <button
              onClick={() => setShowHelp(true)}
              className="ml-3 w-7 h-7 inline-flex items-center justify-center rounded-full bg-white/10 border border-white/10 text-slate-200 hover:bg-white/15"
              aria-label="How to play"
              title="How to play"
            >
              ?
            </button>
          </div>
        </div>
 

        {/* Main area */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(640px,1fr)_360px] gap-6 lg:h-[calc(100%-120px)] lg:overflow-hidden">
          {/* Video card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:h-full lg:flex lg:flex-col">
            <div className="mb-3 text-center">
              <h2
                className="text-base sm:text-lg font-extrabold text-slate-100"
                style={{ fontFamily: 'Press Start 2P, Inter, system-ui' }}
              >
                Make this character sign{' '}
                <span className="text-emerald-400 text-xl sm:text-2xl align-middle">{target}</span>
              </h2>
            </div>
            <div className="relative mx-auto w-full max-w-3xl lg:flex-1 lg:min-h-0">
              <div className="relative overflow-hidden rounded-2xl bg-black/40 shadow-lg border border-white/10 h-[360px] md:h-[420px] lg:h-full">
                <video ref={videoRef} className="w-full h-full object-contain block bg-black" playsInline muted />
                {/* Overlay prediction box (placeholder) */}
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`pointer-events-none absolute inset-6 rounded-xl border-4 ${
                    flash === 'success'
                      ? 'border-emerald-400'
                      : flash === 'fail'
                      ? 'border-rose-500'
                      : 'border-emerald-400/70'
                  }`}
                />
                <div className="pointer-events-none absolute left-6 top-4 text-emerald-400 font-bold">
                  {prediction.label}
                </div>
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-4 text-emerald-400 font-bold">
                  {prediction.conf ? prediction.conf.toFixed(2) : '0.00'}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>

            {/* Bottom controls */}
            <div className="mt-6 flex flex-col gap-3">
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
                  className={`h-12 px-5 rounded-xl border font-semibold transition ${
                    started
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 hover:bg-amber-500/25'
                      : 'bg-emerald-500/20 border-emerald-400 text-emerald-300 hover:bg-emerald-500/25'
                  }`}
                >
                  {started ? 'Stop' : 'Start'}
                </button>
                <button
                  onClick={handleCapture}
                  disabled={!started}
                  className="h-12 px-6 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold tracking-wide shadow-lg shadow-emerald-900/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  PRESS SPACE TO CAPTURE
                </button>
                <button
                  onClick={() => handleSkip(true)}
                  className="h-12 px-6 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold tracking-wide shadow-lg shadow-rose-900/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  SKIP
                </button>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:h-full lg:overflow-auto pr-1">
            <RightPanel />
          </div>
        </div>


        {/* Help modal */}
        {showHelp && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60" onClick={() => setShowHelp(false)}>
            <div className="w-[min(92vw,560px)] rounded-2xl border border-white/10 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-100">How to Play</h3>
              <ul className="mt-3 space-y-2 text-slate-300 text-sm">
                <li>- Pilih mode Normal (dengan timer & leaderboard) atau Practice (tanpa timer).</li>
                <li>- Tekan Start untuk memulai. Tekan Space atau tombol Capture untuk mengambil jawaban.</li>
                <li>- Normal mode: 10 soal, 10 detik/soal. Benar +10, salah +0, skip/kehabisan waktu -5.</li>
                <li>- Practice mode: gunakan kamus mini dan Hint di panel kanan untuk berlatih.</li>
                <li>- Anda bisa mengganti kamera pada Webcam Settings.</li>
              </ul>
              <div className="mt-5 flex justify-end">
                <button onClick={() => setShowHelp(false)} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-slate-200 hover:bg-white/15">Tutup</button>
              </div>
            </div>
          </div>
        )}

        {/* Finish modal */}
        {finished && mode === 'normal' && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
            <div className="w-[min(92vw,520px)] rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h3 className="text-xl font-bold text-slate-100">Selesai!</h3>
              <p className="mt-2 text-slate-300">
                Skor kamu: <span className="text-amber-300 font-bold">{score}</span>
              </p>
              <div className="mt-4">
                <label className="text-sm text-slate-300">Nama untuk leaderboard</label>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nama kamu"
                  className="mt-1 w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={resetGame}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-slate-200 hover:bg-white/15"
                >
                  Main lagi (tanpa simpan)
                </button>
                <button
                  onClick={submitLeaderboard}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Simpan ke Leaderboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
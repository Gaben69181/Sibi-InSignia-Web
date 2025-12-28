import { useCallback, useEffect, useRef, useState } from 'react'

// Endpoint Python backend yang melakukan inference dengan model `model/best.pt`.
// Silakan sesuaikan URL sesuai server Python-mu (pastikan CORS sudah diizinkan di server Python).
// Default diarahkan ke port 8002 (sesuai dengan detect_server.py)
const DETECT_API_URL = import.meta.env.VITE_DETECT_API_URL || 'http://localhost:8002/detect'

export default function Detect() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const captureCanvasRef = useRef(null)

  const streamRef = useRef(null)
  const detectTimerRef = useRef(null)

  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState('')

  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')

  const [prediction, setPrediction] = useState(null)
  // Bentuk prediction yang diharapkan dari Python backend (bisa kamu sesuaikan):
  // {
  //   letter: "A",
  //   confidence: 0.94,
  //   boxes: [{ x: 0.3, y: 0.2, w: 0.2, h: 0.4 }], // bounding box ter-normalisasi (0..1)
  // }

  useEffect(() => {
    async function initDevices() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return
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

  const startCamera = useCallback(async () => {
    setError('')
  
    try {
      // Hentikan stream lama jika masih ada
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
  
      const videoConstraints = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
        : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
  
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      })
  
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
  
      streamRef.current = stream
      setIsCameraOn(true)
    } catch (err) {
      console.error('Failed to start camera:', err)
      setError('Gagal mengakses kamera. Pastikan izin kamera diberikan dan tidak dipakai aplikasi lain.')
      setIsCameraOn(false)
    }
  }, [deviceId])

  const stopCamera = useCallback(() => {
    if (detectTimerRef.current) {
      clearInterval(detectTimerRef.current)
      detectTimerRef.current = null
    }
    setIsDetecting(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsCameraOn(false)
  }, [])

  const drawOverlay = useCallback((predictionPayload) => {
    const videoEl = videoRef.current
    const canvasEl = canvasRef.current
 
    if (!videoEl || !canvasEl) return
 
    const width = videoEl.videoWidth || 640
    const height = videoEl.videoHeight || 480
 
    if (canvasEl.width !== width) canvasEl.width = width
    if (canvasEl.height !== height) canvasEl.height = height
 
    const ctx = canvasEl.getContext('2d')
    ctx.clearRect(0, 0, width, height)
 
    if (!predictionPayload) return
 
    const { boxes = [], letter = '-', confidence = 0 } = predictionPayload
 
    // Gambar bounding boxes (jika ada) — warna hijau
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(34,197,94,1)' // green-500
    ctx.fillStyle = 'rgba(34,197,94,1)' // green-500 untuk background label
    
    boxes.forEach((box) => {
      // Koordinat asli dari backend (normalized 0-1)
      const boxX = box.x || 0
      const boxY = box.y || 0
      const boxW = box.w || 0
      const boxH = box.h || 0
      
      // FLIP koordinat X karena video di-mirror
      // x_mirrored = 1 - (x_original + width_original)
      const mirroredX = (1 - boxX - boxW) * width
      const by = boxY * height
      const bw = boxW * width
      const bh = boxH * height
      
      // Draw bounding box
      ctx.strokeRect(mirroredX, by, bw, bh)
      
      // Draw label dengan huruf dan confidence
      if (letter && letter !== '-') {
        const confPercent = (confidence * 100).toFixed(0)
        const label = `${letter} ${confPercent}%`
        
        // Set font untuk text
        ctx.font = 'bold 24px Arial'
        const textMetrics = ctx.measureText(label)
        const textWidth = textMetrics.width
        const textHeight = 30
        
        // Background label (kotak hijau)
        const labelX = mirroredX
        const labelY = by - textHeight - 8
        ctx.fillStyle = 'rgba(34,197,94,1)'
        ctx.fillRect(labelX, labelY, textWidth + 16, textHeight + 4)
        
        // Text label (putih) - flip horizontally untuk mengatasi mirror canvas
        ctx.save()
        // Posisi text original adalah (labelX + 8, labelY + 24)
        // Translate ke center of text, flip, lalu gambar centered
        const textStartX = labelX + 8
        const textBaselineY = labelY + 24
        ctx.translate(textStartX + textWidth / 2, textBaselineY)
        ctx.scale(-1, 1)
        ctx.fillStyle = 'white'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(label, -textWidth / 2, 0)
        ctx.restore()
      }
    })
  }, [])

  const captureAndDetectOnce = useCallback(async () => {
    const videoEl = videoRef.current
    if (!videoEl || !isCameraOn) {
      console.log('⚠️ Cannot capture: videoEl=', !!videoEl, 'isCameraOn=', isCameraOn)
      return
    }

    const captureCanvas = captureCanvasRef.current
    if (!captureCanvas) {
      console.log('⚠️ Cannot capture: captureCanvas not found')
      return
    }

    const width = videoEl.videoWidth || 640
    const height = videoEl.videoHeight || 480

    if (width === 0 || height === 0) {
      console.log('⚠️ Video dimensions not ready:', width, 'x', height)
      return
    }

    if (captureCanvas.width !== width) captureCanvas.width = width
    if (captureCanvas.height !== height) captureCanvas.height = height

    const ctx = captureCanvas.getContext('2d')
    // Flip horizontally to match mirrored webcam preview
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(videoEl, -width, 0, width, height)
    ctx.restore()

    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.8)

    try {
      console.log('🔍 Sending detection request to:', DETECT_API_URL)
      const res = await fetch(DETECT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })

      console.log('📡 Response status:', res.status)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const payload = await res.json()
      console.log('✅ Detection result:', payload)
      setPrediction(payload)
      drawOverlay(payload)
    } catch (err) {
      console.error('❌ Detection request failed:', err)
      setError('Gagal memproses deteksi di server Python. Pastikan server berjalan dan CORS diizinkan.')
      setIsDetecting(false)
      if (detectTimerRef.current) {
        clearInterval(detectTimerRef.current)
        detectTimerRef.current = null
      }
    }
  }, [drawOverlay, isCameraOn])

  const startDetection = useCallback(async () => {
    console.log('🚀 Starting detection...')
    console.log('Camera on:', isCameraOn)
    
    if (!isCameraOn) {
      console.log('Camera is off, starting camera first...')
      await startCamera()
    }
    setError('')

    setIsDetecting(true)
    console.log('✅ Detection mode activated, will capture every 300ms')

    if (detectTimerRef.current) {
      clearInterval(detectTimerRef.current)
    }

    detectTimerRef.current = setInterval(() => {
      console.log('⏰ Timer tick - calling captureAndDetectOnce()')
      captureAndDetectOnce()
    }, 300)
  }, [captureAndDetectOnce, isCameraOn, startCamera])

  const stopDetection = useCallback(() => {
    if (detectTimerRef.current) {
      clearInterval(detectTimerRef.current)
      detectTimerRef.current = null
    }
    setIsDetecting(false)
  }, [])

  // Ganti kamera ketika pilihan device berubah saat kamera sedang aktif
  useEffect(() => {
    if (!deviceId) return
    if (!isCameraOn) return
    if (!navigator.mediaDevices?.getUserMedia) return
  
    let cancelled = false
  
    const switchStream = async () => {
      try {
        // Hentikan stream lama, tapi jangan ubah state isCameraOn
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
  
        const videoConstraints = {
          deviceId: { exact: deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 },
        }
  
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        })
  
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
  
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
  
        streamRef.current = stream
      } catch (err) {
        console.error('Failed to switch camera:', err)
        setError('Gagal mengganti kamera. Coba matikan lalu nyalakan kamera lagi atau cek izin browser.')
      }
    }
  
    switchStream()
  
    return () => {
      cancelled = true
    }
  }, [deviceId, isCameraOn])
  
  // Cleanup ketika komponen di-unmount
  useEffect(() => {
    return () => {
      if (detectTimerRef.current) {
        clearInterval(detectTimerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const renderPredictionInfo = () => {
    if (!prediction) {
      return (
        <p className="text-slate-400 text-sm">
          Belum ada prediksi. Nyalakan kamera dan tekan "Mulai Deteksi".
        </p>
      )
    }

    const { letter, confidence } = prediction
    const confPct = confidence != null ? Math.round(confidence * 100) : null

    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Prediksi Huruf SIBI</p>
          <div className="inline-flex items-center gap-3 rounded-xl bg-slate-900/40 border border-indigo-500/40 px-4 py-2">
            <span className="text-3xl font-extrabold text-indigo-300">
              {letter ?? '—'}
            </span>
            {confPct != null && (
              <span className="text-sm text-slate-300">
                {confPct}% yakin
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="pt-16">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-200">Sign Detection</h2>
        <p className="mt-3 text-slate-300 max-w-2xl">
          Deteksi SIBI secara real-time menggunakan kamera dan model YOLO yang telah dilatih.
          Bounding box hijau akan menandai area tangan yang terdeteksi, beserta prediksi huruf dan tingkat keyakinan model.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
          {/* Video + overlay */}
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-3 gap-2">
              <p className="text-sm font-medium text-slate-200">Kamera Live</p>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                    isCameraOn
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-500/50 bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${isCameraOn ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  {isCameraOn ? 'Kamera aktif' : 'Kamera mati'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                    isDetecting
                      ? 'border-indigo-500/70 bg-indigo-500/10 text-indigo-200'
                      : 'border-slate-500/50 bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${isDetecting ? 'bg-indigo-400' : 'bg-slate-500'}`} />
                  {isDetecting ? 'Deteksi aktif' : 'Deteksi mati'}
                </span>
  
                {devices.length > 0 && (
                  <select
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="ml-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    {devices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Kamera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-xl bg-black/60 border border-slate-700/60">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                autoPlay
                muted
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={isCameraOn ? stopCamera : startCamera}
                className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2.5 text-sm font-medium shadow-sm transition ${
                  isCameraOn
                    ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-500/60'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400/80'
                }`}
              >
                {isCameraOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
              </button>

              <button
                type="button"
                onClick={isDetecting ? stopDetection : startDetection}
                disabled={!isCameraOn}
                className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium shadow-sm border transition ${
                  !isCameraOn
                    ? 'bg-slate-800/60 text-slate-500 border-slate-700 cursor-not-allowed'
                    : isDetecting
                      ? 'bg-rose-500/10 text-rose-200 border-rose-400/70 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-200 border-emerald-400/70 hover:bg-emerald-500/20'
                }`}
              >
                {isDetecting ? 'Hentikan Deteksi' : 'Mulai Deteksi'}
              </button>

              <p className="text-[11px] text-slate-500">
                Pengambilan frame dikirim berkala ke server Python ({DETECT_API_URL}).
              </p>
            </div>

            {/* Canvas tersembunyi hanya untuk capture frame yang dikirim ke backend */}
            <canvas
              ref={captureCanvasRef}
              className="hidden"
            />
          </div>

          {/* Panel hasil prediksi */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Hasil Deteksi</h3>
            <p className="text-xs text-slate-400 mb-4">
              Panel ini menampilkan huruf SIBI yang diprediksi dari tangan yang terdeteksi,
              beserta tingkat kepercayaan model. Bounding box hijau pada video menandai area tangan yang sedang dianalisis.
            </p>

            {renderPredictionInfo()}

            {error && (
              <div className="mt-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
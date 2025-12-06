import { useEffect, useState } from 'react'

// Stream API endpoint
const STREAM_URL = import.meta.env.VITE_DETECT_API_URL?.replace('/detect', '/video_feed') || 'http://localhost:8002/video_feed'
const STATUS_URL = import.meta.env.VITE_DETECT_API_URL?.replace('/detect', '/status') || 'http://localhost:8002/status'

export default function DetectStream() {
  const [stats, setStats] = useState({
    camera_active: false,
    frames_processed: 0,
    total_detections: 0,
    last_detection: '-',
    last_confidence: 0,
    fps: 0
  })
  const [error, setError] = useState('')
  const [streamError, setStreamError] = useState(false)

  // Poll status every second
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(STATUS_URL)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
          setError('')
        }
      } catch (err) {
        setError('Server tidak tersambung. Pastikan Python server berjalan.')
      }
    }

    fetchStatus() // Initial fetch
    const interval = setInterval(fetchStatus, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleStreamError = () => {
    setStreamError(true)
    setError('Video stream gagal. Restart Python server.')
  }

  const handleStreamLoad = () => {
    setStreamError(false)
    setError('')
  }

  return (
    <section className="pt-16">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-200">
          Sign Detection (Stream Mode)
        </h2>
        <p className="mt-3 text-slate-300 max-w-2xl">
          Deteksi SIBI secara real-time dengan video streaming dari Python server.
          Semua processing dilakukan di server, React hanya menampilkan hasil.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
          {/* Video Stream */}
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-200">Live Detection Stream</p>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                    stats.camera_active
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-500/50 bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${stats.camera_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  {stats.camera_active ? 'Stream Aktif' : 'Stream Mati'}
                </span>
              </div>
            </div>

            {/* Video Stream Display */}
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black/60 border border-slate-700/60">
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
                    <p className="text-slate-400 text-sm">Pastikan Python server berjalan</p>
                    <p className="text-slate-500 text-xs mt-2">python stream_server.py</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-500">
                Stream URL: <code className="text-indigo-400">{STREAM_URL}</code>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Python server melakukan semua processing (detection, overlay, encoding).
              </p>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Statistics</h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time detection statistics dari Python server.
            </p>

            {error && (
              <div className="mb-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {/* Last Detection */}
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Deteksi Terakhir
                </p>
                <div className="inline-flex items-center gap-3 rounded-xl bg-slate-900/40 border border-indigo-500/40 px-4 py-2">
                  <span className="text-3xl font-extrabold text-indigo-300">
                    {stats.last_detection || '—'}
                  </span>
                  {stats.last_confidence > 0 && (
                    <span className="text-sm text-slate-300">
                      {(stats.last_confidence * 100).toFixed(0)}% yakin
                    </span>
                  )}
                </div>
              </div>

              {/* FPS */}
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Frame Rate
                </p>
                <div className="rounded-lg bg-slate-800/60 px-3 py-2">
                  <p className="text-2xl font-bold text-emerald-400">{stats.fps} FPS</p>
                </div>
              </div>

              {/* Frames Processed */}
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Frame Diproses
                </p>
                <div className="rounded-lg bg-slate-800/60 px-3 py-2">
                  <p className="text-lg font-semibold text-slate-200">
                    {stats.frames_processed.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Total Detections */}
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Total Deteksi
                </p>
                <div className="rounded-lg bg-slate-800/60 px-3 py-2">
                  <p className="text-lg font-semibold text-slate-200">
                    {stats.total_detections.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Server Info */}
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Server Info</h4>
              <div className="space-y-1 text-xs text-slate-400">
                <p>
                  Status: <span className={stats.camera_active ? 'text-emerald-400' : 'text-rose-400'}>
                    {stats.camera_active ? 'Running' : 'Offline'}
                  </span>
                </p>
                <p>Endpoint: {STATUS_URL}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
          <h3 className="text-sm font-semibold text-indigo-200 mb-2">
            💡 Cara Menggunakan
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-100/80">
            <li>Pastikan Python server berjalan: <code className="text-indigo-300">python stream_server.py</code></li>
            <li>Stream akan otomatis muncul jika server aktif</li>
            <li>Tunjukkan gestur SIBI ke kamera</li>
            <li>Deteksi dan overlay muncul real-time di video</li>
            <li>Statistics update setiap detik</li>
          </ol>
        </div>
      </div>
    </section>
  )
}


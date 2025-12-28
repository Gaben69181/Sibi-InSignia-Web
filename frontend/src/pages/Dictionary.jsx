import { useState } from 'react'

// Dataset alfabet SIBI.
// id di sini disamakan dengan class index YOLO (0 -> A, 1 -> B, dst.)
// Backend akan mencari semua sample gambar di dataset yang punya classId sama.
// CATATAN: Dataset memiliki 24 kelas (A-Y tanpa J dan Z)
const ALPHABET_ITEMS = [
  { id: 0, letter: 'A' },
  { id: 1, letter: 'B' },
  { id: 2, letter: 'C' },
  { id: 3, letter: 'D' },
  { id: 4, letter: 'E' },
  { id: 5, letter: 'F' },
  { id: 6, letter: 'G' },
  { id: 7, letter: 'H' },
  { id: 8, letter: 'I' },
  { id: 9, letter: 'K' },   // (J tidak ada di dataset)
  { id: 10, letter: 'L' },
  { id: 11, letter: 'M' },
  { id: 12, letter: 'N' },
  { id: 13, letter: 'O' },
  { id: 14, letter: 'P' },
  { id: 15, letter: 'Q' },
  { id: 16, letter: 'R' },
  { id: 17, letter: 'S' },
  { id: 18, letter: 'T' },
  { id: 19, letter: 'U' },
  { id: 20, letter: 'V' },
  { id: 21, letter: 'W' },
  { id: 22, letter: 'X' },
  { id: 23, letter: 'Y' },  // (Z tidak ada di dataset)
]

export default function Dictionary() {
  const [searchTerm, setSearchTerm] = useState('')

  // State untuk popup dataset
  const [selectedLetter, setSelectedLetter] = useState(null) // { id, letter } atau null
  const [samples, setSamples] = useState([]) // sample dari backend
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingSamples, setIsLoadingSamples] = useState(false)
  const [samplesError, setSamplesError] = useState(null)

  const trimmedSearch = searchTerm.trim()
  const isWordSearch = trimmedSearch.length > 1

  let filteredItems

  if (!trimmedSearch) {
    // Tanpa input: tampilkan semua huruf
    filteredItems = ALPHABET_ITEMS
  } else if (trimmedSearch.length === 1 && /[a-zA-Z]/.test(trimmedSearch)) {
    // Mirip dengan prioritas exact letter match di Streamlit
    const upper = trimmedSearch.toUpperCase()
    filteredItems = ALPHABET_ITEMS.filter((item) => item.letter === upper)
  } else {
    // Untuk pencarian kata / multi-karakter, fallback ke filter sederhana per huruf
    const upper = trimmedSearch.toUpperCase()
    filteredItems = ALPHABET_ITEMS.filter((item) => item.letter.includes(upper))
  }

  const hasResults = filteredItems.length > 0

  const handleCardClick = async (item) => {
    setSelectedLetter(item)
    setIsModalOpen(true)
    setSamples([])
    setSamplesError(null)
    setIsLoadingSamples(true)

    try {
      const res = await fetch(`/api/dictionary?classId=${item.id}`)
      if (!res.ok) {
        throw new Error(`Gagal memuat dataset (status ${res.status})`)
      }
      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setSamples(Array.isArray(data.samples) ? data.samples : [])
    } catch (err) {
      setSamplesError(err.message || 'Terjadi kesalahan saat mengambil data dataset.')
    } finally {
      setIsLoadingSamples(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedLetter(null)
    setSamples([])
    setSamplesError(null)
    setIsLoadingSamples(false)
  }

  return (
    <section className="pt-16">
      <div className="max-w-screen-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
            <span className="mr-2">📚</span>
            Kamus Bahasa Isyarat SIBI
          </h1>
          <p className="mt-3 text-slate-300 text-sm md:text-base">
            Telusuri dan pelajari Bahasa Isyarat SIBI dengan panduan visual interaktif.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label
            htmlFor="dictionary-search"
            className="block text-sm font-medium text-slate-200 mb-1"
          >
            🔍 Cari huruf atau kata
          </label>
          <input
            id="dictionary-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Contoh: A, B, X, Y"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />

          {isWordSearch && (
            <p className="mt-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Fitur pencarian kata (selain alfabet tunggal) belum tersedia. Silakan cari per huruf
              (A–Y, tanpa J dan Z).
            </p>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Alfabet Bahasa Isyarat SIBI
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Berikut adalah daftar huruf dalam Sistem Isyarat Bahasa Indonesia (SIBI). Klik salah
            satu huruf untuk melihat beberapa contoh gambar dari dataset dengan label yang sama.
          </p>
        </div>

        {/* Results */}
        {!hasResults ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
            Tidak ada hasil ditemukan untuk pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredItems
              .slice()
              .sort((a, b) => a.letter.localeCompare(b.letter))
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCardClick(item)}
                  className="dictionary-card rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-indigo-400/70 hover:bg-indigo-500/5 transition-colors flex flex-col items-center text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <h3 className="text-xl font-semibold text-slate-100 mb-2">
                    {item.letter}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {/* Klik untuk melihat beberapa contoh gambar dataset huruf {item.letter}. */}
                  </p>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Modal untuk menampilkan sample dataset */}
      {isModalOpen && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl overflow-hidden">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Contoh Dataset Huruf {selectedLetter.letter}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Menampilkan beberapa gambar dari folder dataset yang memiliki label YOLO dengan
                  class ID {selectedLetter.id}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200 w-8 h-8 text-sm hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                ✕
              </button>
            </div>

            {/* Isi modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
              {isLoadingSamples && (
                <div className="flex items-center justify-center py-10 text-sm text-slate-300">
                  <span className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                  Memuat contoh gambar dari dataset...
                </div>
              )}

              {!isLoadingSamples && samplesError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {samplesError}
                </div>
              )}

              {!isLoadingSamples && !samplesError && samples.length === 0 && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
                  Belum ditemukan contoh gambar di dataset untuk huruf {selectedLetter.letter}. Coba
                  huruf lain atau periksa struktur dataset.
                </div>
              )}

              {!isLoadingSamples && !samplesError && samples.length > 0 && (
                <>
                  <p className="text-xs text-slate-400 mb-3">
                    Ditemukan <span className="font-semibold text-slate-200">{samples.length}</span>{' '}
                    contoh gambar pada subset <code className="text-[11px] bg-black/40 px-1.5 py-0.5 rounded border border-white/10">valid/images</code>.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {samples.map((sample) => (
                      <div
                        key={sample.id}
                        className="rounded-xl overflow-hidden border border-white/10 bg-black/40 flex flex-col"
                      >
                        <img
                          src={sample.imageUrl}
                          alt={`Contoh isyarat SIBI huruf ${selectedLetter.letter}`}
                          className="w-full h-40 object-cover bg-black/60"
                          loading="lazy"
                        />
                        <div className="px-3 py-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-300 font-mono truncate max-w-[80%]">
                            {sample.id}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/40">
                            ID {sample.classId}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
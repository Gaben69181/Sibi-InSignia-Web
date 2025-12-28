import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';

export default function Hero({ onGetStarted, actionsVisible }) {
  // Check if intro has been shown before in this session
  const hasSeenIntro = sessionStorage.getItem('intro-shown') === 'true';
  
  // Intro phase keeps only the logo visible, centered on the same background.
  const [intro, setIntro] = useState(!hasSeenIntro);

  useEffect(() => {
    // If intro was already shown, dispatch done event immediately
    if (hasSeenIntro) {
      window.dispatchEvent(new CustomEvent('intro:done'));
      return;
    }

    // Otherwise, run the intro animation
    const t = setTimeout(() => {
      setIntro(false);
      // Mark intro as shown in session storage
      sessionStorage.setItem('intro-shown', 'true');
      // Inform the rest of the app that intro has finished
      window.dispatchEvent(new CustomEvent('intro:done'));
    }, 2500);
    return () => clearTimeout(t);
  }, [hasSeenIntro]);

  const container = useMemo(
    () => ({
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
      },
    }),
    []
  );

  const item = useMemo(
    () => ({
      hidden: { opacity: 0, y: 16 },
      show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    }),
    []
  );

  return (
    <section className="pt-24">
      {/* Using layout on the container and the title to smoothly morph
         from intro (centered) to normal hero layout without scroll jump */}
      <Motion.div
        className={`mx-auto max-w-screen-lg px-4 text-center ${intro ? 'min-h-[70vh]' : ''}`}
      >
        <Motion.h1
          initial={{ opacity: 0, y: '35vh', scale: 1 }}
          animate={intro ? { opacity: 1, y: '35vh', scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-200 px-4 py-2"
          style={{
            backgroundImage: 'linear-gradient(90deg,#60a5fa,#818cf8,#60a5fa)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: 'gradient-move 10s ease-in-out infinite',
            fontFamily: 'Orbitron, Inter, system-ui',
            lineHeight: '1.2',
            display: 'inline-block',
          }}
        >
          InSignia
        </Motion.h1>

        {/* Reveal the rest only after intro ends, with staggered fade-up */}
        <AnimatePresence>
          {!intro && (
            <Motion.div
              key="hero-content"
              variants={container}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="mt-0 text-center"
            >
              <Motion.p variants={item} className="mt-3 text-xl md:text-2xl font-semibold text-indigo-300">
                Real-time SIBI Detection for Inclusive Education
              </Motion.p>

              <Motion.p variants={item} className="mt-4 text-slate-300 max-w-3xl mx-auto">
                Platform AI inovatif untuk deteksi Bahasa Isyarat SIBI real-time, menjembatani
                komunikasi inklusif bagi penyandang disabilitas Rungu Wicara dan masyarakat umum.
              </Motion.p>

              <Motion.div variants={item} className="mt-8">
                {!actionsVisible ? (
                  <button
                    onClick={onGetStarted}
                    className="inline-flex h-12 items-center rounded-xl px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-indigo-900/20 hover:scale-[1.03] active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-slate-900"
                  >
                    Let’s Get Started!
                  </button>
                ) : null}
              </Motion.div>

              <AnimatePresence>
                {actionsVisible && (
                  <Motion.div
                    key="hero-actions"
                    className="mt-8 flex flex-wrap items-center justify-center gap-3"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Link
                      to="/dictionary"
                      className="inline-flex h-12 items-center rounded-xl px-6 bg-white/10 hover:bg-white/15 text-slate-100 shadow transition transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 border border-white/10"
                      aria-label="Buka halaman Dictionary"
                    >
                      Dictionary
                    </Link>
                    <Link
                      to="/detect"
                      className="inline-flex h-12 items-center rounded-xl px-6 bg-white/10 hover:bg-white/15 text-slate-100 shadow transition transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 border border-white/10"
                      aria-label="Buka halaman Sign Detection"
                    >
                      Sign Detection
                    </Link>
                    <Link
                      to="/quiz"
                      className="inline-flex h-12 items-center rounded-xl px-6 bg-white/10 hover:bg-white/15 text-slate-100 shadow transition transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 border border-white/10"
                      aria-label="Buka halaman Quiz Game"
                    >
                      Quiz Game
                    </Link>
                  </Motion.div>
                )}
              </AnimatePresence>
            </Motion.div>
          )}
        </AnimatePresence>
      </Motion.div>
    </section>
  );
}
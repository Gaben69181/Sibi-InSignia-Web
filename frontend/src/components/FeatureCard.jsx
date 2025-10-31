import { useRef } from 'react';
import { motion as Motion } from 'framer-motion';

export default function FeatureCard({ icon, title, description, glow = false }) {
  const cardRef = useRef(null);

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; // x within card
    const y = e.clientY - rect.top;  // y within card

    const px = (x / rect.width) - 0.5;   // -0.5 .. 0.5
    const py = (y / rect.height) - 0.5;  // -0.5 .. 0.5

    const ROTATE = 10; // deg
    const rX = (-py) * ROTATE; // invert Y for natural tilt
    const rY = px * ROTATE;

    el.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg) translateZ(0)`;
    el.style.transition = 'transform 60ms ease-out';
  };

  const handleLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
    el.style.transition = 'transform 200ms ease-out';
  };

  return (
    <div
      className="relative"
      style={{ perspective: 1000 }}
      aria-hidden="false"
    >
      {/* Glowing animated border */}
      {glow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-60 blur-[6px] animate-glow"
          style={{ filter: 'drop-shadow(0 0 12px rgba(99,102,241,0.35))' }}
        />
      )}

      <Motion.div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        // whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className={`relative aspect-square rounded-2xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] 
          ${glow ? 'border-indigo-400/30 bg-slate-900/60' : 'border-white/10 bg-white/5'} 
          backdrop-blur p-6 will-change-transform`}
        role="article"
      >
        <div className="text-3xl">{icon}</div>
        <h3 className="mt-3 text-lg font-semibold text-slate-200">{title}</h3>
        <p className="mt-1 text-sm text-slate-300">{description}</p>
      </Motion.div>
    </div>
  );
}
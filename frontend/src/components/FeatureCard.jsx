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
      className="relative h-full"
      style={{ perspective: 1000 }}
      aria-hidden="false"
    >
      {/* Glowing animated border */}
      {glow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-60 blur-[6px] animate-glow"
          style={{ filter: 'drop-shadow(0 0 12px rgba(99,102,241,0.35))' }}
        />
      )}

      <Motion.div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className={`relative rounded-xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] 
          ${glow ? 'border-indigo-400/30 bg-slate-900/60' : 'border-white/10 bg-white/5'} 
          backdrop-blur p-5 will-change-transform h-full flex flex-col`}
        role="article"
      >
        <div className="text-2xl mb-3">{icon}</div>
        <h3 className="text-base font-semibold text-slate-200 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </Motion.div>
    </div>
  );
}
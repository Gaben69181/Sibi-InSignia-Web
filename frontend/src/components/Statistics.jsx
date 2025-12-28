import { useEffect, useRef, useState } from 'react';
import { motion as Motion, useInView } from 'framer-motion';

function AnimatedCounter({ end, duration = 2, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const isInView = useInView(nodeRef, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isInView, end, duration]);

  return (
    <span ref={nodeRef}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export default function Statistics() {
  const stats = [
    { label: 'SIBI Alphabet Letters', value: 26, suffix: '' },
    { label: 'Model Accuracy', value: 95, suffix: '%' },
    { label: 'Processing Speed', value: 100, suffix: 'ms', prefix: '<' },
    { label: 'Training Images', value: 1321, suffix: '+' },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none" />
      
      <div className="mx-auto max-w-screen-xl px-4 relative">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-200 mb-4">
            Technical Specifications
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Performance metrics and capabilities of our AI detection system
          </p>
        </Motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <Motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 text-center hover:border-indigo-500/50 transition-all duration-300 hover:scale-105">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-blue-500/0 group-hover:from-indigo-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
                
                <div className="relative">
                  <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} prefix={stat.prefix || ''} />
                  </div>
                  <div className="text-sm md:text-base text-slate-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


import { useMemo, useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Hero from '../components/Hero.jsx';
import FeatureCard from '../components/FeatureCard.jsx';

export default function Home() {
  const [showActions, setShowActions] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const handler = () => setIntroDone(true);
    window.addEventListener('intro:done', handler);
    return () => window.removeEventListener('intro:done', handler);
  }, []);

  const grid = useMemo(
    () => ({
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
    }),
    []
  );

  const item = useMemo(
    () => ({
      hidden: { opacity: 0, y: 12 },
      show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
    }),
    []
  );

  return (
    <>
      <Hero onGetStarted={() => setShowActions(true)} actionsVisible={showActions} />

      <AnimatePresence>
        {introDone && (
          <Motion.section
            className="mt-12 px-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.45 }}
          >
            <Motion.div
              className="mx-auto max-w-screen-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              variants={grid}
              initial="hidden"
              animate="show"
            >
              <Motion.div variants={item}>
                <FeatureCard
                  icon="⚡"
                  title="Real-time Detection"
                  description="Detects and translates SIBI sign language instantly."
                />
              </Motion.div>
 
              <Motion.div variants={item}>
                <FeatureCard
                  icon="🤖"
                  title="Advanced AI Intelligence"
                  description="Powered by state-of-the-art Azure AI technology."
                />
              </Motion.div>
 
              <Motion.div variants={item}>
                <FeatureCard
                  icon="🌐"
                  title="Multi-Modal Solution"
                  description="Supports visual, speech, and text inputs."
                />
              </Motion.div>
            </Motion.div>
          </Motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
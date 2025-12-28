import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-indigo-500/10 animate-gradient-slow" 
        style={{ backgroundSize: '200% 200%' }} />
      
      <div className="mx-auto max-w-screen-xl px-4 relative">
        <Motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/30 via-slate-900/50 to-blue-900/30 backdrop-blur p-12 md:p-16 text-center overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10">
            {/* Badge */}
            <Motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-medium text-slate-300 mb-6"
            >
              <span className="mr-2">✨</span>
              Start Your SIBI Learning Journey
            </Motion.div>

            {/* Heading */}
            <Motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-3xl md:text-5xl font-bold text-slate-200 mb-4"
            >
              Ready to Bridge the Communication Gap?
            </Motion.h2>

            {/* Description */}
            <Motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-slate-300 text-lg max-w-2xl mx-auto mb-8"
            >
              Join thousands of learners who are making a difference in inclusive communication. 
              Start learning SIBI today with our AI-powered platform.
            </Motion.p>

            {/* CTA Buttons */}
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/detect"
                className="group relative inline-flex h-14 items-center rounded-xl px-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Detecting Now
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                to="/dictionary"
                className="inline-flex h-14 items-center rounded-xl px-8 bg-white/10 hover:bg-white/15 text-slate-100 font-semibold border border-white/10 transition-all duration-300 hover:scale-105 hover:border-white/20"
              >
                Browse Dictionary
              </Link>
            </Motion.div>

            {/* Features list */}
            <Motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400"
            >
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>No registration required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>AI-powered accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Real-time feedback</span>
              </div>
            </Motion.div>
          </div>
        </Motion.div>
      </div>
    </section>
  );
}


import { motion as Motion } from 'framer-motion';

export default function AboutSection() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered',
      description: 'State-of-the-art YOLOv8 model for accurate sign detection',
    },
    {
      icon: '⚡',
      title: 'Real-Time',
      description: 'Instant feedback and detection with minimal latency',
    },
    {
      icon: '🎯',
      title: 'High Accuracy',
      description: '95%+ accuracy in detecting SIBI hand gestures',
    },
    {
      icon: '🌐',
      title: 'Accessible',
      description: 'Works on any device with a camera and browser',
    },
  ];

  return (
    <section className="py-20 relative" id="about">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent pointer-events-none" />
      
      <div className="mx-auto max-w-screen-xl px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <Motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4">
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 text-sm font-medium text-indigo-300">
                About InSignia
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-slate-200 mb-6">
              Bridging Communication Through Technology
            </h2>
            
            <p className="text-slate-300 leading-relaxed mb-6">
              InSignia adalah platform pembelajaran bahasa isyarat SIBI (Sistem Isyarat Bahasa Indonesia) 
              yang menggunakan teknologi AI untuk memberikan pengalaman belajar yang interaktif dan efektif.
            </p>
            
            <p className="text-slate-400 leading-relaxed mb-8">
              Kami percaya bahwa teknologi dapat membantu menciptakan masyarakat yang lebih inklusif. 
              Dengan InSignia, siapa saja dapat belajar bahasa isyarat dengan mudah dan menyenangkan.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  26
                </div>
                <div className="text-sm text-slate-400">SIBI Letters</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  95%+
                </div>
                <div className="text-sm text-slate-400">Accuracy Rate</div>
              </div>
            </div>
          </Motion.div>

          {/* Right side - Feature cards */}
          <Motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {features.map((feature, index) => (
              <Motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="group"
              >
                <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur p-5 h-full hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20">
                  {/* Icon */}
                  <div className="text-4xl mb-3">
                    {feature.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover gradient */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/0 to-blue-500/0 group-hover:from-indigo-500/10 group-hover:to-blue-500/10 transition-all duration-300 pointer-events-none" />
                </div>
              </Motion.div>
            ))}
          </Motion.div>
        </div>
      </div>
    </section>
  );
}


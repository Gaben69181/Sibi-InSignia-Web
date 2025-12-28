import { motion as Motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: '📖',
      title: 'Learn the Signs',
      description: 'Browse our comprehensive SIBI dictionary with visual references for all 26 letters.',
    },
    {
      number: '02',
      icon: '🎥',
      title: 'Practice with Detection',
      description: 'Use your webcam to practice signs and get real-time feedback from our AI model.',
    },
    {
      number: '03',
      icon: '🎮',
      title: 'Test Your Knowledge',
      description: 'Challenge yourself with interactive quizzes to reinforce your learning.',
    },
    {
      number: '04',
      icon: '🌟',
      title: 'Master SIBI',
      description: 'Track your progress and become proficient in Indonesian Sign Language.',
    },
  ];

  return (
    <section className="py-20 relative" id="how-it-works">
      <div className="mx-auto max-w-screen-xl px-4">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-200 mb-4">
            How It Works
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Get started with SIBI learning in just four simple steps
          </p>
        </Motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Connection line (hidden on mobile, last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-indigo-500/50 to-transparent z-0" />
              )}

              <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur p-6 h-full hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                {/* Step number badge */}
                <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="text-5xl mb-4 mt-6">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-slate-200 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {step.description}
                </p>

                {/* Decorative gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-blue-500/0 group-hover:from-indigo-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


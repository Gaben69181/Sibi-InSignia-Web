import { motion as Motion } from 'framer-motion';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Budi Santoso',
      role: 'Special Education Teacher',
      avatar: '👨‍🏫',
      content: 'InSignia telah mengubah cara saya mengajar bahasa isyarat. Teknologi AI-nya sangat membantu siswa untuk belajar dengan lebih interaktif dan menyenangkan.',
      rating: 5,
    },
    {
      name: 'Siti Rahayu',
      role: 'Parent of Deaf Student',
      avatar: '👩',
      content: 'Platform yang luar biasa! Anak saya bisa belajar SIBI dengan mudah di rumah. Fitur deteksi real-time sangat membantu untuk memperbaiki gestur tangan.',
      rating: 5,
    },
    {
      name: 'Ahmad Hidayat',
      role: 'University Student',
      avatar: '👨‍🎓',
      content: 'Sebagai mahasiswa yang sedang belajar bahasa isyarat, InSignia adalah tool yang sempurna. Dictionary-nya lengkap dan quiz game-nya sangat edukatif!',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
      
      <div className="mx-auto max-w-screen-xl px-4 relative">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-200 mb-4">
            What People Say
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Hear from our community about their experience with InSignia
          </p>
        </Motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur p-6 h-full hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20">
                {/* Quote icon */}
                <div className="absolute top-4 right-4 text-4xl text-indigo-500/20">
                  "
                </div>

                {/* Rating stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">⭐</span>
                  ))}
                </div>

                {/* Content */}
                <p className="text-slate-300 leading-relaxed mb-6 relative z-10">
                  "{testimonial.content}"
                </p>

                {/* Author info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-2xl shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-slate-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>

                {/* Hover gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-blue-500/0 group-hover:from-indigo-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


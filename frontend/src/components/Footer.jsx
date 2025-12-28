import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Dictionary', path: '/dictionary' },
      { name: 'Sign Detection', path: '/detect' },
      { name: 'Quiz Game', path: '/quiz' },
    ],
    resources: [
      { name: 'Documentation', path: '#' },
      { name: 'API Reference', path: '#' },
      { name: 'Tutorials', path: '#' },
    ],
    company: [
      { name: 'About Us', path: '#about' },
      { name: 'Contact', path: '#contact' },
      { name: 'Privacy Policy', path: '#' },
    ],
  };


  return (
    <footer className="mt-24 border-t border-white/10 bg-slate-900/50 backdrop-blur">
      <div className="mx-auto max-w-screen-xl px-4 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-extrabold tracking-tight mb-3"
                style={{
                  backgroundImage: 'linear-gradient(90deg,#60a5fa,#818cf8,#60a5fa)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                InSignia
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
                Platform AI inovatif untuk deteksi Bahasa Isyarat SIBI real-time, 
                menjembatani komunikasi inklusif untuk Indonesia yang lebih baik.
              </p>
            </Motion.div>
          </div>

          {/* Links Columns */}
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Product</h4>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.path}
                    className="text-sm text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.path}
                    className="text-sm text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Motion.div>
        </div>

        {/* Bottom Section */}
        <Motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-sm text-slate-400">
            © {currentYear} InSignia. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
              Cookies
            </a>
          </div>
        </Motion.div>

        {/* Project info */}
        <Motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-slate-500">
            A Final Project for Computer Vision Course - Committed to advancing inclusive education in Indonesia
          </p>
        </Motion.div>
      </div>
    </footer>
  );
}


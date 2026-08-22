import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, PlayCircle } from 'lucide-react'

const STEPS = [
  'x² − 5x + 6 = 0',
  '(x − 2)(x − 3) = 0',
  'x = 2  or  x = 3',
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-ink-950">
      {/* Compass-arc geometry backdrop */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 800">
        <circle cx="980" cy="160" r="280" fill="none" stroke="#D4A24C" strokeWidth="1" />
        <circle cx="980" cy="160" r="200" fill="none" stroke="#D4A24C" strokeWidth="1" />
        <line x1="980" y1="-120" x2="980" y2="440" stroke="#D4A24C" strokeWidth="1" />
        <line x1="700" y1="160" x2="1260" y2="160" stroke="#D4A24C" strokeWidth="1" />
        <path d="M 200 700 Q 400 500 650 650 T 1100 600" fill="none" stroke="#3D5A80" strokeWidth="1" />
      </svg>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[1.1fr,0.9fr] gap-12 lg:gap-8 items-center w-full">
        {/* Left: thesis */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold-400/30 bg-gold-400/5 text-gold-300 text-xs font-medium tracking-wide mb-7"
          >
            Bhatinda · Standards 8th – 12th · Since 2017
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-chalk-100 leading-[1.08] tracking-tight"
          >
            Math stops being
            <br />
            a mystery <span className="italic text-gold-300">here.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-chalk-200/70 text-base sm:text-lg leading-relaxed max-w-lg"
          >
            Vanita Math Classes has spent over a decade turning confused 8th-graders
            into confident 12th-grade board toppers — one worked problem at a time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link to="/register" className="group inline-flex items-center gap-2 px-6 py-3.5 bg-gold-400 text-ink-950 font-semibold rounded-full hover:bg-gold-300 transition-colors">
              Enroll your child
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#courses" className="inline-flex items-center gap-2 px-6 py-3.5 text-chalk-100 font-medium rounded-full border border-chalk-100/20 hover:border-gold-400/50 transition-colors">
              <PlayCircle className="w-4 h-4" />
              See our courses
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-12 grid grid-cols-3 gap-6 max-w-md"
          >
            {[['17', 'Years teaching'], ['800+', 'Students taught'], ['100%', 'Board pass rate']].map(([n, l]) => (
              <div key={l}>
                <p className="font-mono text-2xl sm:text-3xl text-gold-300 font-medium">{n}</p>
                <p className="text-chalk-200/50 text-xs sm:text-sm mt-1">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: the signature — a worked problem writing itself on a "board" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative"
        >
          <div className="relative bg-ink-900 border border-gold-400/20 rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-1.5 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-mark/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-gold-400/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-steel-300/50" />
              <span className="ml-3 text-chalk-200/40 text-xs font-mono">today's board</span>
            </div>

            <p className="text-chalk-200/50 text-sm mb-5">Solve for x — Quadratic Equations, Std 10</p>

            <div className="space-y-4">
              {STEPS.map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 + i * 0.5 }}
                  className={`font-mono text-lg sm:text-xl ${i === STEPS.length - 1 ? 'text-gold-300' : 'text-chalk-100/90'}`}
                >
                  {line}
                </motion.p>
              ))}
            </div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4, delay: 0.9 + STEPS.length * 0.5 }}
              style={{ originX: 0 }}
              className="h-px bg-gradient-to-r from-gold-400/60 to-transparent mt-7"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 + STEPS.length * 0.5 }}
              className="mt-4 text-chalk-200/40 text-xs"
            >
              This is how every concept gets taught here — broken down until it clicks.
            </motion.p>
          </div>

          <div className="absolute -bottom-5 -right-5 w-24 h-24 rounded-full bg-gold-400/10 blur-2xl pointer-events-none" />
        </motion.div>
      </div>
    </section>
  )
}

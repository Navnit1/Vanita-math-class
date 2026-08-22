import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'

const TOPPERS = [
  { name: 'Sneha Kulkarni', std: '10th Board', score: '98.4%', year: '2025' },
  { name: 'Arjun Patil', std: '10th Board', score: '97.2%', year: '2025' },
  { name: 'Mihir Joshi', std: '9th Standard', score: '96.8%', year: '2025' },
  { name: 'Aditi Rane', std: '10th Board', score: '96.1%', year: '2024' },
  { name: 'Karan Shah', std: '8th Standard', score: '95.9%', year: '2025' },
  { name: 'Riya Nair', std: '10th Board', score: '95.7%', year: '2024' },
]

export default function Achievers() {
  return (
    <section id="results" className="bg-chalk-100 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mb-14"
        >
          <p className="text-mark font-mono text-sm tracking-wide uppercase mb-3">Top achievers</p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-ink-950 leading-tight">
            Results we put our name on.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPPERS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-steel-300/15 hover:border-gold-500/40 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-gold-400/15 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-gold-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ink-950 font-medium text-sm truncate">{t.name}</p>
                <p className="text-steel-400 text-xs mt-0.5">{t.std} · {t.year}</p>
              </div>
              <p className="font-mono text-lg text-mark font-medium shrink-0">{t.score}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

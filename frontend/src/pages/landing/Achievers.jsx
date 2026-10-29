import { motion } from 'framer-motion'
import { Trophy, Star } from 'lucide-react'

const TOPPERS = [
  { name: 'Sneha Kulkarni', std: 'Class 10th Board', score: '98.4%', year: '2025' },
  { name: 'Arjun Patil', std: 'Class +2 Board', score: '97.2%', year: '2025' },
  { name: 'Mihir Joshi', std: 'Class 10th Board', score: '96.8%', year: '2025' },
  { name: 'Aditi Rane', std: 'Class +1 Annual', score: '96.1%', year: '2024' },
  { name: 'Karan Shah', std: 'Class 9th Annual', score: '95.9%', year: '2025' },
  { name: 'Riya Nair', std: 'Class +2 Board', score: '95.7%', year: '2024' },
]

export default function Achievers() {
  return (
    <section id="results" className="bg-white py-20 sm:py-28 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mb-14"
        >
          <span className="text-primary-600 font-bold text-xs tracking-wider uppercase mb-2 block">
            Consistent Results
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            High Scores & Board Toppers from Bathinda
          </h2>
          <p className="mt-3 text-gray-600 text-sm">
            Proven track record of transforming average students into mathematics distinction holders.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOPPERS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-bold text-base truncate">{t.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {t.std} · {t.year}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl font-black text-primary-600">{t.score}</span>
                <span className="block text-[10px] font-bold text-emerald-600">DISTINCTION</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

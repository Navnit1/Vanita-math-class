import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote:
      'Best maths teacher in Bathinda! Vanita ma’am is extremely friendly and understanding, with deep subject mastery. After attending her classes for half a term, my maths score shot up from 63% to 92%. She was patient with my doubts and provided handwritten practice sheets that made concepts effortless.',
    name: 'Mankanwar Jot',
    role: 'Class 10th Student, Bathinda',
  },
  {
    quote:
      'A great teacher inspires confidence and makes learning engaging through clear explanations. Vanita ma’am went far beyond basic textbook questions, giving us multi-publisher problems and weekly test drills. I never felt hesitant asking questions.',
    name: 'Vedant Bareja',
    role: 'Class +2 Student, Bathinda',
  },
  {
    quote:
      'VMC is undeniably the best coaching center for mathematics. I am grateful to have had such a dedicated teacher who made calculus and trigonometry feel straightforward. Her personal attention and weekly test reviews were truly game-changing.',
    name: 'Jyoti Bala',
    role: 'Parent of Class 10th Student, Bathinda',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-gray-50 py-20 sm:py-28 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mb-14"
        >
          <span className="text-primary-600 font-bold text-xs tracking-wider uppercase mb-2 block">
            Parent & Student Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Trusted by Hundreds of Bathinda Families
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="p-7 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-primary-200 mb-2" />
                <p className="text-gray-700 text-sm leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-gray-900 font-extrabold text-sm">{t.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

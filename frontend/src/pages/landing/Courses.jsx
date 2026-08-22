import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

const COURSES = [
  { std: '8th', focus: 'Number Systems & Basic Geometry', tag: 'Foundation' },
  { std: '9th', focus: 'Algebra Basics & Mensuration', tag: 'Foundation' },
  { std: '10th', focus: 'Linear Equations & Data Handling', tag: 'Foundation' },
  { std: '11th', focus: 'Polynomials & Coordinate Geometry', tag: 'Board Prep' },
  { std: '12th', focus: 'Trigonometry & Quadratic Equations', tag: 'Board Exam' },
]

export default function Courses() {
  return (
    <section id="courses" className="bg-chalk-100 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <p className="text-mark font-mono text-sm tracking-wide uppercase mb-3">Courses & subjects</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-ink-950 leading-tight">
              One subject, every standard,<br className="hidden sm:block" /> 8th through 12th.
            </h2>
          </div>
          <p className="text-steel-500 text-sm max-w-xs">
            Each standard runs as its own batch with a syllabus matched to that year's board curriculum.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {COURSES.map((c, i) => (
            <motion.div
              key={c.std}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative bg-ink-950 rounded-2xl p-5 lg:p-4 flex lg:flex-col lg:items-start items-center gap-4 lg:gap-3 hover:bg-ink-900 transition-colors"
            >
              <div>
                <p className="font-display text-3xl lg:text-4xl text-gold-300 font-medium leading-none">{c.std}</p>
                <p className="text-chalk-200/40 text-[11px] mt-2 uppercase tracking-wide font-mono">{c.tag}</p>
              </div>
              <p className="text-chalk-200/70 text-sm leading-snug lg:mt-2 flex-1">{c.focus}</p>
              <ArrowUpRight className="w-4 h-4 text-gold-400/0 group-hover:text-gold-400 transition-colors hidden lg:block lg:absolute lg:top-4 lg:right-4" />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/register" className="inline-flex items-center gap-2 text-ink-950 font-medium hover:text-mark transition-colors">
            Find the right batch for your child
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

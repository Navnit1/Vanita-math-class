import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Check } from 'lucide-react'

const COURSES = [
  {
    std: 'Class 8th',
    focus: 'Rational Numbers, Linear Equations, Algebraic Expressions & Mensuration',
    tag: 'Foundation',
    features: ['Strong algebra fundamentals', 'School exam prep', 'Weekly practice tests'],
  },
  {
    std: 'Class 9th',
    focus: 'Number Systems, Polynomials, Coordinate Geometry, Triangles & Circles',
    tag: 'Bridge Course',
    features: ['Step-by-step theorem proofs', 'NCERT + exemplar mastery', 'Regular doubt clearing'],
  },
  {
    std: 'Class 10th',
    focus: 'Real Numbers, Quadratic Equations, Trigonometry & Surface Areas',
    tag: 'Board Excellence',
    features: ['Board exam test series', '100% past year questions', 'Time management coaching'],
  },
  {
    std: 'Class +1',
    focus: 'Sets, Trigonometric Functions, Permutations, Conic Sections & Calculus Intro',
    tag: 'Senior Secondary',
    features: ['Deep conceptual grounding', 'Higher secondary rigor', 'Formula derivations'],
  },
  {
    std: 'Class +2',
    focus: 'Relations & Functions, Matrices, Continuity & Diff, Integrals, Vectors & 3D',
    tag: 'Board & Entrance',
    features: ['Board topper strategies', 'Integration speed techniques', 'Weekly full mock tests'],
  },
]

export default function Courses() {
  return (
    <section id="courses" className="bg-gray-50/70 py-20 sm:py-28 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14"
        >
          <div>
            <span className="text-primary-600 font-bold text-xs tracking-wider uppercase mb-2 block">
              Curriculum & Classes
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Comprehensive Mathematics Coaching for 8th to +2
            </h2>
          </div>
          <p className="text-gray-600 text-sm max-w-sm">
            Each standard is taught in small focused batches adhering strictly to CBSE and State Board curriculum.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSES.map((c, i) => (
            <motion.div
              key={c.std}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                    {c.tag}
                  </span>
                  <BookOpen className="w-4 h-4 text-gray-400" />
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-2">{c.std}</h3>
                <p className="text-xs text-gray-600 leading-relaxed min-h-[3rem] font-medium">
                  {c.focus}
                </p>

                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                  {c.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Only Mathematics</span>
                <a
                  href="#contact"
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                  Enquire Now <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 transition-colors text-sm"
          >
            Looking for batch timings or custom assistance? Send an enquiry
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

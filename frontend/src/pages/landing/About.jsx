import { motion } from 'framer-motion'
import { Target, Users2, BookOpenCheck, TrendingUp, Clock, ShieldCheck } from 'lucide-react'

const REASONS = [
  {
    icon: Target,
    title: 'Concept-First Approach',
    text: 'Every topic is developed from core mathematical axioms before problems scale in complexity.',
  },
  {
    icon: Users2,
    title: 'Small Personal Batches',
    text: 'Controlled student batches ensure every student receives direct attention and doubt resolution.',
  },
  {
    icon: TrendingUp,
    title: 'Transparent Progress Tracking',
    text: 'Weekly tests, marks spreadsheets, attendance logs, and fee ledgers visible in the online portal.',
  },
  {
    icon: BookOpenCheck,
    title: 'Board-Aligned Question Banks',
    text: 'Exhaustive coverage of CBSE & State Board questions, past-year papers, and multi-publisher problems.',
  },
  {
    icon: Clock,
    title: 'Structured Batch Timings',
    text: 'Convenient morning and evening batches designed to complement regular school schedules.',
  },
  {
    icon: ShieldCheck,
    title: 'Clear Receipts & Parent Updates',
    text: 'Instant digital PDF receipts, verified payment logs, and proactive WhatsApp reminders.',
  },
]

export default function About() {
  return (
    <>
      <section id="about" className="relative bg-white py-20 sm:py-28 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary-600 font-bold text-xs tracking-wider uppercase mb-2 block">
              About Vanita Math Classes
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Founded on 17+ Years of Pure Mathematics Teaching.
            </h2>
            <p className="mt-5 text-gray-600 text-sm sm:text-base leading-relaxed">
              Vanita Math Classes (VMC) delivers rigorous, personalized mathematics tutoring for students in grades 8th, 9th, 10th, +1, and +2. Led by veteran mentor <strong>Mrs. Vanita Rani Gupta</strong>, the center is solely dedicated to Mathematics.
            </p>
            <p className="mt-4 text-gray-600 text-sm sm:text-base leading-relaxed">
              At VMC, every student is given individual attention to master concepts and step-by-step problem solving. Easy-to-understand handwritten notes, curated formula sheets, and weekly evaluation tests ensure steady academic transformation.
            </p>

            <div className="mt-8 flex items-center gap-8 pt-4 border-t border-gray-100">
              <div>
                <p className="text-2xl font-extrabold text-primary-600">5</p>
                <p className="text-gray-500 text-xs mt-0.5">Classes (8th to +2)</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-2xl font-extrabold text-gray-900">1:1</p>
                <p className="text-gray-500 text-xs mt-0.5">Doubt Mentorship</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-2xl font-extrabold text-emerald-600">17+</p>
                <p className="text-gray-500 text-xs mt-0.5">Years Legacy</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-gray-200"
          >
            <img
              src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80"
              alt="Classroom learning at Vanita Math Classes"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-gray-100">
              <p className="text-gray-900 font-bold text-sm leading-snug">
                "Vanita Ma'am's step-by-step methods and weekly tests took my daughter from 65% to 94% in 10th boards."
              </p>
              <p className="text-primary-600 font-semibold text-xs mt-2">
                — Parent of a Class 10th Board Achiever, Bathinda
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose VMC Grid */}
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
              The VMC Advantage
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Six Pillars of Consistent High Performance
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {REASONS.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
                className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-4 text-primary-600">
                  <r.icon className="w-5 h-5" />
                </div>
                <h3 className="text-gray-900 font-bold text-base">{r.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm mt-2 leading-relaxed">
                  {r.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

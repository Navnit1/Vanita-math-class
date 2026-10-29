import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Phone, Award, Sparkles, BookOpen } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative pt-36 sm:pt-40 pb-20 overflow-hidden bg-gradient-to-b from-red-50/40 via-white to-gray-50/60 border-b border-gray-200">
      {/* Decorative math geometry background lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#E50914_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Headline & Pitch */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary-200 bg-primary-50 text-primary-700 text-xs font-bold tracking-wide mb-6 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            Admissions Open · 8th, 9th, 10th, +1 & +2 Mathematics · Bathinda
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.12] tracking-tight"
          >
            Master Mathematics with{' '}
            <span className="text-primary-600 underline decoration-primary-200 decoration-wavy decoration-2">
              Concept Clarity
            </span>{' '}
            & Top Scores.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl font-normal"
          >
            Dedicated mathematics coaching by <strong>Vanita Rani Gupta</strong> (M.Sc., M.Phil., B.Ed., 17+ years experience).
            Personal attention, weekly tests, formula sheets, and handwritten notes that turn fear into confidence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4"
          >
            <a
              href="#contact"
              className="btn btn-primary px-6 py-3 text-sm font-bold shadow-red-glow flex items-center gap-2 rounded-xl"
            >
              Submit Enquiry
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              to="/register"
              className="btn btn-secondary px-5 py-3 text-sm font-bold flex items-center gap-2 rounded-xl border-[#D9DDE3]"
            >
              Register
            </Link>

            <Link
              to="/login"
              className="btn btn-outline px-5 py-3 text-sm font-bold text-[#E50914] border-[#FFCCD0] hover:bg-[#FFF5F5] flex items-center gap-2 rounded-xl"
            >
              Student Login
            </Link>

            <a
              href="tel:+919815962612"
              className="px-4 py-3 text-xs font-bold text-[#64748B] hover:text-[#171717] flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#E50914]" />
              98159-62612
            </a>
          </motion.div>

          {/* Quick Pillars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 grid grid-cols-3 gap-6 pt-8 border-t border-gray-200/80 max-w-lg"
          >
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary-600">17+</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">Years Experience</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">800+</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">Students Mentored</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">100%</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">Board Pass Rate</p>
            </div>
          </motion.div>
        </div>

        {/* Right Feature Card */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xl relative"
          >
            <div className="flex items-center justify-between pb-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
                  π
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Vanita Math Classes</h3>
                  <p className="text-[11px] text-gray-400">Vishal Nagar, Bathinda</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
                Mathematics Only
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-700 mb-1">
                  Faculty Spotlight
                </p>
                <p className="text-base font-extrabold text-gray-900">Vanita Rani Gupta</p>
                <p className="text-xs text-gray-600 mt-1">
                  M.Sc. (Maths), M.Phil. (Maths), B.Ed. · CTET & PSTET Qualified
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-gray-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Small batches with 1-on-1 doubt resolution</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Weekly tests with spreadsheet grading & parent updates</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Curated PDF formula sheets & previous year questions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Private student portal for attendance & test marks</span>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-400">Class Standards</p>
                  <p className="text-sm font-bold text-gray-900">8th · 9th · 10th · +1 · +2</p>
                </div>
                <a
                  href="#courses"
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  View Batches <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

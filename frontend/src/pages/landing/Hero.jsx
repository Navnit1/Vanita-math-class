import { motion } from 'framer-motion'
import { Sparkles, Phone, Award, CheckCircle2 } from 'lucide-react'
import QuickAccessPanel from '@/components/landing/QuickAccessPanel'

export default function Hero() {
  return (
    <section className="relative pt-32 sm:pt-36 pb-16 sm:pb-20 overflow-hidden bg-gradient-to-b from-red-50/50 via-white to-neutral-50/80 border-b border-neutral-200">
      {/* Decorative math background lines */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left: Brand Identity & Pitch */}
        <div className="lg:col-span-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-700 text-xs font-bold tracking-wide shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Admissions Open · 8th, 9th, 10th, +1 & +2 Mathematics · Bathinda</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-22 bg-white rounded-xl p-1.5 flex items-center justify-center border border-red-200 shadow-sm">
                <img
                  src="/vmc-logo.svg"
                  alt="Vanita Math Classes"
                  className="h-full w-auto object-contain"
                />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-red-600 font-serif">
                Vanita Math Classes
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 leading-[1.15] tracking-tight font-serif uppercase">
              VANITA MATH <span className="text-red-600">CLASSES</span>
            </h1>

            <p className="mt-3 text-sm sm:text-base font-semibold text-neutral-700">
              Mathmatics tuition classes for 8th, 9th, 10th, +1 & +2
            </p>

            <p className="mt-3 text-neutral-600 text-xs sm:text-sm leading-relaxed">
              Dedicated mathematics coaching by <strong>Vanita Rani Gupta</strong> (M.Sc, M.Phil, B.Ed, more than 17 years teaching experience).
              Personalized concept clarity, weekly tests with computerized tracking, curated formula booklets, and official fee management.
            </p>
          </motion.div>

          {/* Key Institute Badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-2 text-xs text-neutral-700 pt-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Small batches with 1-on-1 doubt resolution & Board focus</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Weekly Sunday tests with WhatsApp parent reports</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Private student portal for test marks, notes & fee receipts</span>
            </div>
          </motion.div>

          {/* Quick Metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200"
          >
            <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
              <p className="text-xl sm:text-2xl font-black text-red-600 font-mono">17+</p>
              <p className="text-neutral-500 text-[11px] font-medium">Years Experience</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
              <p className="text-xl sm:text-2xl font-black text-neutral-900 font-mono">800+</p>
              <p className="text-neutral-500 text-[11px] font-medium">Students Mentored</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs">
              <p className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">100%</p>
              <p className="text-neutral-500 text-[11px] font-medium">Board Pass Rate</p>
            </div>
          </motion.div>
        </div>

        {/* Right: The Reference 4-Tab Interactive Card */}
        <div className="lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <QuickAccessPanel />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

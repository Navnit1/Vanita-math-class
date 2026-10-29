import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LandingNav from './LandingNav'
import Hero from './Hero'
import About from './About'
import StatsCounter from './StatsCounter'
import Courses from './Courses'
import Faculty from './Faculty'
import Achievers from './Achievers'
import Testimonials from './Testimonials'
import Gallery from './Gallery'
import FAQ from './FAQ'
import Contact from './Contact'
import Footer from './Footer'

export default function LandingPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-red-100 selection:text-primary-700">
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full border-3 border-primary-200 border-t-primary-600 animate-spin" />
              <p className="font-bold text-gray-900 text-sm tracking-tight">Vanita Math Classes</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LandingNav />
      <main>
        <Hero />
        <About />
        <StatsCounter />
        <Courses />
        <Faculty />
        <Achievers />
        <Testimonials />
        <Gallery />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
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
  const [theme, setTheme] = useState('dark') // landing page defaults to the "chalkboard" dark identity

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={theme === 'light' ? 'landing-light' : ''}>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] bg-ink-950 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl border-2 border-gold-400/40 border-t-gold-400 animate-spin" />
              <p className="font-display text-chalk-100 text-sm tracking-wide">Vanita Math Classes</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
        className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-ink-950 border border-gold-400/30 text-gold-300 flex items-center justify-center shadow-lg hover:border-gold-400/60 transition-colors"
      >
        {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
      </button>

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

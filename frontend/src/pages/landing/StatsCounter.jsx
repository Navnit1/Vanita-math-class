import { useEffect, useRef, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'

const STATS = [
  { value: 800, suffix: '+', label: 'Students taught' },
  { value: 17, suffix: '+', label: 'Years of teaching' },
  { value: 100, suffix: '%', label: 'Board pass rate' },
  { value: 5, suffix: '', label: 'Standards covered' },
]

function Counter({ value, suffix }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, value])

  return (
    <span ref={ref} className="font-mono">{display}{suffix}</span>
  )
}

export default function StatsCounter() {
  return (
    <section className="bg-gold-400 py-12 sm:py-14">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="text-center"
          >
            <p className="text-3xl sm:text-4xl font-medium text-ink-950">
              <Counter value={s.value} suffix={s.suffix} />
            </p>
            <p className="text-ink-900/70 text-xs sm:text-sm mt-1.5 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

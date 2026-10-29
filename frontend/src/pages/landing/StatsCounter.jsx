import { useEffect, useRef, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'

const STATS = [
  { value: 800, suffix: '+', label: 'Students Mentored' },
  { value: 17, suffix: '+', label: 'Years Teaching Experience' },
  { value: 100, suffix: '%', label: 'Board Pass Rate' },
  { value: 5, suffix: '', label: 'Classes (8th, 9th, 10th, +1, +2)' },
]

function Counter({ value, suffix }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
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
    <span ref={ref} className="font-extrabold tracking-tight">
      {display}
      {suffix}
    </span>
  )
}

export default function StatsCounter() {
  return (
    <section className="bg-primary-600 text-white py-14 sm:py-16 shadow-inner">
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
            <p className="text-3xl sm:text-5xl font-black text-white">
              <Counter value={s.value} suffix={s.suffix} />
            </p>
            <p className="text-red-100 text-xs sm:text-sm mt-2 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

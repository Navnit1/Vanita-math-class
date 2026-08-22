import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  { q: 'Which standards do you teach?', a: 'We run dedicated batches for every standard from 6th through 10th, each with a syllabus matched to that year\'s board curriculum.' },
  { q: 'How big are the batches?', a: 'We deliberately cap batch sizes to keep teaching personal — most batches run between 15 and 25 students.' },
  { q: 'Can I track my child\'s attendance and progress?', a: 'Yes. Every parent and student gets a login to the student dashboard showing attendance %, test scores, fee status, and notes — updated in real time.' },
  { q: 'What are the batch timings?', a: 'We offer Morning, Evening, and Weekend batches for most standards so coaching fits around school hours.' },
  { q: 'How do I pay fees?', a: 'Fees can be paid online through the student portal or in person at the institute. Every payment generates a receipt visible in your dashboard.' },
  { q: 'How do I enroll?', a: 'Click "Sign Up", fill in your details, and our admin team will reach out to confirm your batch and schedule a starting date.' },
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <section className="bg-ink-950 py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-gold-300 font-mono text-sm tracking-wide uppercase mb-3">FAQ</p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-chalk-100 leading-tight">
            Questions parents usually ask.
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="border border-chalk-100/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-chalk-100/[0.03] transition-colors"
              >
                <span className="text-chalk-100 font-medium text-sm sm:text-base">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-gold-300 shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-chalk-200/60 text-sm leading-relaxed">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

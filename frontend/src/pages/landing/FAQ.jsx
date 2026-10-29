import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

const FAQS = [
  {
    q: 'Which standards and subjects are taught at VMC?',
    a: 'We teach exclusively Mathematics for students in Class 8th, 9th, 10th, +1, and +2. Focusing on one subject allows deep conceptual mastery and comprehensive practice.',
  },
  {
    q: 'How are weekly tests conducted and evaluated?',
    a: 'Weekly tests are conducted regularly on every chapter. Mrs. Vanita Rani Gupta personally evaluates the answer sheets and records marks in a detailed spreadsheet. Test marks, percentage, and remarks are published privately to the student portal.',
  },
  {
    q: 'How do parents and students track attendance and fee receipts?',
    a: 'Every student receives login credentials to their dedicated Student Portal. Parents can see real-time attendance percentage, pending fee obligations, payment history, and download official PDF receipts anytime.',
  },
  {
    q: 'What are the batch timings?',
    a: 'We run structured Morning and Evening batches for 8th to +2 standards so coaching smoothly fits alongside school hours.',
  },
  {
    q: 'Are handwritten notes and formula sheets provided?',
    a: 'Yes! Students receive class-specific PDF notes, formula sheets, chapter summaries, and past-year question compilations directly through the in-website study material portal.',
  },
  {
    q: 'What is the admission procedure?',
    a: 'New students or parents can submit the Enquiry Form on this page or call +91 98159-62612. The admin will review your enquiry, contact you to discuss batch availability, confirm admission, and generate your portal credentials.',
  },
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0)

  return (
    <section id="faq" className="bg-gray-50 py-20 sm:py-28 border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-primary-600 font-bold text-xs tracking-wider uppercase mb-2 block">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-gray-600 text-sm">
            Everything you need to know about our mathematics classes, weekly tests, and portal access.
          </p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-2xs"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4.5 text-left hover:bg-gray-50/70 transition-colors"
              >
                <span className="text-gray-900 font-bold text-sm sm:text-base leading-snug">
                  {f.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-primary-600 shrink-0 transition-transform duration-200 ${
                    openIdx === i ? 'rotate-180 text-primary-600' : 'text-gray-400'
                  }`}
                />
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
                    <p className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                      {f.a}
                    </p>
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

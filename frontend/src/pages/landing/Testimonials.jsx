import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote: `Best teacher in the cityVanita mam is very friendly and understanding, impressive teaching history and knowledge of the subject.The house is always clean, easy access from front stairs and wide open space for class with air conditioning.
Personally after attending for half a term my grade has improved from 63 to 92 percent in maths, Mam was very helpful and patient in teaching.
The experience has been far better than my previous tutoring and exceeded the school teacher’s abilities also which, was very surprising.
Mam also greatly values safety of the students
And is a little selective about admission which keeps the atmosphere calm and focused on study.After searched around Bathinda, Sangrur, and online Vanita mam is the best maths teacher I found and I recommend her classes to anyone in 8-12 looking for a teacher.`,
    name: 'Mankanwar Jot ',
    role: 'Student',
  },
  {
    quote: 'A great teacher is knowledgeable, kind, and patient, with a passion for their subject that makes learning fun and engaging through clear explanations and encouragement. A supportive tuition teacher goes beyond just teaching content; they inspire confidence, offer personalized guidance, and make students feel comfortable asking questions to help them master difficult topics and build both academic skills and personal character.',
    name: 'Vedant Bareja',
    role: 'Student',
  },
  {
    quote: 'VMC is the best tuition centre for maths coaching. I am grateful to have such a wonderful teacher who makes learning maths enjoyable and effortless. Her patience, love, and care towards her students are truly commendable. She provides excellent guidance and support. I am so lucky to have her as my maths teacher!',
    name: 'Jyoti Bala',
    role: 'Student',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-ink-950 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mb-14"
        >
          <p className="text-gold-300 font-mono text-sm tracking-wide uppercase mb-3">Testimonials</p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-chalk-100 leading-tight">
            What parents and students say.
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="p-7 rounded-2xl border border-chalk-100/10 bg-chalk-100/[0.03]"
            >
              <Quote className="w-7 h-7 text-gold-400/40 mb-4" />
              <p className="text-chalk-100/85 text-[15px] leading-relaxed">{t.quote}</p>
              <div className="mt-6 pt-5 border-t border-chalk-100/10">
                <p className="text-chalk-100 font-medium text-sm">{t.name}</p>
                <p className="text-chalk-200/45 text-xs mt-0.5">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

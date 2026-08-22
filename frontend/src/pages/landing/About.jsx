import { motion } from 'framer-motion'
import { Target, Users2, BookOpenCheck, TrendingUp, Clock, ShieldCheck } from 'lucide-react'

const REASONS = [
  { icon: Target, title: 'Concept-first teaching', text: 'We don\'t race through syllabi. Every topic is built from first principles before problems get harder.' },
  { icon: Users2, title: 'Small batch sizes', text: 'Capped batches mean your child is never just a face in the back row.' },
  { icon: TrendingUp, title: 'Visible progress', text: 'Attendance, test scores, and notes are tracked in one dashboard — for you and your child.' },
  { icon: BookOpenCheck, title: 'Board ready', text: 'Curriculum maps to state board exams.' },
  { icon: Clock, title: 'Flexible batch timing', text: 'Morning, evening, and weekend batches so coaching fits around school, not against it.' },
  { icon: ShieldCheck, title: 'Parent-visible fees & dues', text: 'No surprises — every fee, payment, and pending due is logged and visible anytime.' },
]

export default function About() {
  return (
    <>
      <section id="about" className="relative bg-chalk-100 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-mark font-mono text-sm tracking-wide uppercase mb-3">About the institute</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-ink-950 leading-tight">
              Built by a math teacher, not a marketing team.
            </h2>
            <p className="mt-5 text-steel-500 text-base leading-relaxed">
Vanita Math Classes (VMC) provides personalized math tutoring for students in grades 8th to 10th, +1 and +2 (only Maths) The dedicated VMC tutor (Mrs. Vanita Rani Gupta) focuses on tailoring the learning experience to each student’s individual needs, ensuring that they not only grasp the core concepts but also develop a profound understanding of the subject. Through interactive sessions and comprehensive study materials, VMC aims to equip students with the tools to excel academically and build a strong foundation for future mathematical pursuits.
At VMC, every student has been given personal attention to make him perfect in Mathematics. Hand written easy to understandable notes are provided to each individual student. Weeks test series are conducted. To enhance the student knowledge, problems from multiple publisher books are covered.
            </p>
            <div className="mt-8 flex items-center gap-8">
              <div>
                <p className="font-mono text-2xl text-ink-950 font-medium">5</p>
                <p className="text-steel-400 text-sm mt-0.5">Standards covered</p>
              </div>
              <div className="w-px h-10 bg-steel-300/30" />
              <div>
                <p className="font-mono text-2xl text-ink-950 font-medium">1</p>
                <p className="text-steel-400 text-sm mt-0.5">Full-time faculty</p>
              </div>
              <div className="w-px h-10 bg-steel-300/30" />
              <div>
                <p className="font-mono text-2xl text-ink-950 font-medium">2017</p>
                <p className="text-steel-400 text-sm mt-0.5">Founded</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative aspect-[4/3] rounded-2xl bg-ink-950 overflow-hidden"
          >
            <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80" alt="Students studying mathematics in a classroom" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 bg-chalk-100/95 backdrop-blur rounded-xl p-4">
              <p className="text-ink-950 font-medium text-sm">"The way they explain trigonometry finally made it click for my son."</p>
              <p className="text-steel-400 text-xs mt-1.5">— Parent of a 10th standard student</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-ink-950 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mb-14"
          >
            <p className="text-gold-300 font-mono text-sm tracking-wide uppercase mb-3">Why choose us</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-chalk-100 leading-tight">
              Six reasons parents stay for years, not months.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {REASONS.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                className="p-6 rounded-2xl border border-chalk-100/10 bg-chalk-100/[0.03] backdrop-blur-sm hover:border-gold-400/30 hover:bg-chalk-100/[0.05] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gold-400/10 border border-gold-400/25 flex items-center justify-center mb-4">
                  <r.icon className="w-5 h-5 text-gold-300" />
                </div>
                <h3 className="text-chalk-100 font-medium text-base">{r.title}</h3>
                <p className="text-chalk-200/55 text-sm mt-2 leading-relaxed">{r.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

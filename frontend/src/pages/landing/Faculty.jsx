import { motion } from 'framer-motion'
import { Award, CheckCircle2, GraduationCap, MapPin, Phone } from 'lucide-react'
import vanitaImg from '../../images/v.webp'

export default function Faculty() {
  return (
    <section id="faculty" className="bg-white py-20 sm:py-28 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mb-14"
        >
          <span className="text-primary-600 font-bold text-xs tracking-wider uppercase mb-2 block">
            Experienced Mentorship
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Meet Your Faculty: Vanita Rani Gupta
          </h2>
          <p className="mt-3 text-gray-600 text-sm leading-relaxed">
            Personalized guidance from a seasoned educator dedicated exclusively to high-school and senior-secondary mathematics.
          </p>
        </motion.div>

        <div className="bg-gray-50 rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Faculty Portrait */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-md">
                <img
                  src={vanitaImg}
                  alt="Vanita Rani Gupta"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="font-extrabold text-lg">Mrs. Vanita Rani Gupta</p>
                  <p className="text-xs text-red-200 font-semibold">Founder & Chief Mathematics Mentor</p>
                </div>
              </div>
            </div>

            {/* Details & Credentials */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100/60 text-primary-800 text-xs font-bold mb-3">
                  <GraduationCap className="w-4 h-4 text-primary-600" />
                  M.Sc. (Maths) · M.Phil. (Maths) · B.Ed.
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
                  Vanita Rani Gupta
                </h3>
                <p className="text-sm font-semibold text-primary-600 mt-1">
                  17+ Years of Dedicated Mathematics Teaching in Bathinda
                </p>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">
                With over 17 years of teaching experience, Mrs. Vanita Rani Gupta has helped hundreds of students across Bathinda build unshakeable mathematical confidence. Qualified in both the Central Teacher Eligibility Test (CTET) and Punjab State Teacher Eligibility Test (PSTET), she combines pedagogical rigor with immense patience.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  'Post-Graduate & Research Degrees: M.Sc. (Mathematics) & M.Phil. (Mathematics), B.Ed.',
                  'Qualified Central Teacher Eligibility Test (CTET) & Punjab State Teacher Eligibility Test (PSTET)',
                  'Consistently delivers 100% board examination pass rates with top scorers scoring 95%+',
                  'Provides handcrafted, easy-to-understand notes & chapterwise question banks',
                  'Conducts disciplined weekly tests with strict individual evaluation and feedback',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium leading-snug">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-200 flex flex-wrap items-center gap-6 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary-600" /> #302, Phase-II, Vishal Nagar, Bathinda
                </span>
                <a
                  href="tel:+919815962612"
                  className="flex items-center gap-1.5 font-bold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary-600" /> +91 98159-62612
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

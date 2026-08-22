import { motion } from 'framer-motion'
import vanitaImg from '../../images/v.webp'

const FACULTY = [
  {
    name: 'Mrs. Vanita Rani Gupta',
    role: 'Tutor',
    qualification: 'M. Sc. (Maths), M. Phil (Maths), B.Ed, 15+ yrs',
    img: vanitaImg,
    details: [
      'Qualifications: M. Sc. (Maths), M. Phil (Maths), B.Ed.',
      'Also qualified the Central Teacher Eligibility Test and Punjab State Teacher Eligibility Test.',
      ' 17+ years of teaching experience in Mathematics.',
      'Dealing with the students in a very polite manner.',
      'Given the 100% results of previous batch students.',
    ],
  },
  // { name: 'Priya Sharma', role: 'Faculty, 9th–10th', qualification: 'M.Sc Mathematics', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80' },
  // { name: 'Anil Kulkarni', role: 'Faculty, 6th–8th Foundation', qualification: 'B.Ed, M.Sc Mathematics', img: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80' },
  // { name: 'Rohan Mehta', role: 'Faculty, JEE Mathematics', qualification: 'B.Tech IIT, 8+ yrs', img: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=400&q=80' },
]

export default function Faculty() {
  return (
    <section id="faculty" className="bg-ink-950 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mb-14"
        >
          <p className="text-gold-300 font-mono text-sm tracking-wide uppercase mb-3">Faculty</p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-chalk-100 leading-tight">
            The people at the board.
          </h2>
        </motion.div>

        <div className="space-y-14">
          {FACULTY.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="grid sm:grid-cols-[minmax(0,280px)_1fr] gap-8 items-start"
            >
              {/* Photo */}
              <div className="group">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-ink-900">
                  <img src={f.img} alt={f.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-chalk-100 font-medium text-sm">{f.name}</p>
                    <p className="text-gold-300 text-xs mt-0.5">{f.role}</p>
                  </div>
                </div>
                {f.qualification && (
                  <p className="text-chalk-200/45 text-xs mt-3">{f.qualification}</p>
                )}
              </div>

              {/* Details */}
              {f.details && (
                <ul className="space-y-3 mt-1">
                  {f.details.map((d, idx) => {
                    const isLinked = typeof d === 'object'
                    return (
                      <li key={idx} className="flex gap-3 text-chalk-200/70 text-sm sm:text-base leading-relaxed">
                        <span className="text-gold-300 mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-300 flex-shrink-0" />
                        {isLinked ? (
                          <a
                            href={d.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-gold-300 underline decoration-gold-300/40 underline-offset-4 transition-colors"
                          >
                            {d.text}
                          </a>
                        ) : (
                          <span>{d}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import classroomImg from '../../images/v-img1.jpg'

const IMAGES = [
  { src: classroomImg, label: 'Dedicated VMC Math Classroom, Vishal Nagar' },
  { src: 'https://images.unsplash.com/photo-1596496181848-3091d4878b24?w=600&q=80', label: '1-on-1 Doubt Solving & Practice' },
  { src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&q=80', label: 'Annual Achievers & Board Topper Felicitation' },
  { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80', label: 'Small Batch Focused Problem Solving' },
  { src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=80', label: 'Weekly Test Evaluations & Discussion' },
  { src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=80', label: 'Geometry & Calculus Step Mastery' },
]

export default function Gallery() {
  return (
    <section id="gallery" className="bg-white py-20 sm:py-28 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mb-14"
        >
          <span className="text-primary-600 font-bold text-xs tracking-wider uppercase mb-2 block">
            Inside the Learning Environment
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Classroom & Academic Life
          </h2>
          <p className="mt-3 text-gray-600 text-sm">
            Air-conditioned, distraction-free learning environment equipped for focused mathematical study.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {IMAGES.map((img, i) => (
            <motion.div
              key={img.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              className={`group relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm ${
                i === 0 ? 'sm:col-span-2 aspect-[16/9]' : 'aspect-square sm:aspect-auto sm:h-64'
              }`}
            >
              <img
                src={img.src}
                alt={img.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <p className="absolute bottom-4 left-4 right-4 text-white text-xs sm:text-sm font-bold">
                {img.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

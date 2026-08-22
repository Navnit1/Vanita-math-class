import { motion } from 'framer-motion'
import classroomImg from '../../images/v-img1.jpg'
const IMAGES = [
  { src: classroomImg, label: '' },
  { src: 'https://images.unsplash.com/photo-1596496181848-3091d4878b24?w=600&q=80', label: 'Doubt-solving hours' },
  { src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&q=80', label: 'Annual prize day' },
  { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80', label: 'Group study sessions' },
  { src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=80', label: 'Test result reviews' },
  { src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&q=80', label: 'Practical geometry labs' },
]

export default function Gallery() {
  return (
    <section id="gallery" className="bg-chalk-100 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mb-14"
        >
          <p className="text-mark font-mono text-sm tracking-wide uppercase mb-3">Gallery</p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-ink-950 leading-tight">
            A look inside the classroom.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {IMAGES.map((img, i) => (
            <motion.div
              key={img.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              className={`group relative rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'}`}
            >
              <img src={img.src} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="absolute bottom-3 left-3 text-chalk-100 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">{img.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

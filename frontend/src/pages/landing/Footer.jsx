import { Link } from 'react-router-dom'
import { Phone, MapPin } from 'lucide-react'

const COLUMNS = [
  {
    title: 'Institute',
    links: [
      { label: 'About VMC', href: '#about' },
      { label: 'Faculty Profile', href: '#faculty' },
      { label: 'Achievers & Results', href: '#results' },
      { label: 'Classroom Gallery', href: '#gallery' },
      { label: 'FAQs', href: '#faq' },
    ],
  },
  {
    title: 'Standards & Batches',
    links: [
      { label: 'Class 8th Mathematics', href: '#courses' },
      { label: 'Class 9th Mathematics', href: '#courses' },
      { label: 'Class 10th Board Exam', href: '#courses' },
      { label: 'Class +1 Mathematics', href: '#courses' },
      { label: 'Class +2 Board Prep', href: '#courses' },
    ],
  },
  {
    title: 'Portals & Enquiries',
    links: [
      { label: 'Student Portal Login', to: '/login' },
      { label: 'New Student Registration', to: '/register' },
      { label: 'Admin Portal Login', to: '/admin-login' },
      { label: 'Submit Admission Enquiry', href: '#contact' },
    ],
  },
]

export default function Footer() {
  const scrollTo = (href) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-[#171717] text-gray-300 pt-16 pb-10 border-t border-[#262626]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-20 bg-white rounded-xl p-1 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src="/vmc-logo-official.png"
                  alt="Vanita Math Classes"
                  className="h-full w-auto object-contain"
                />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">
                VANITA <span className="text-[#E50914]">MATH CLASSES</span>
              </span>
            </div>

            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Premier mathematics coaching institute for 8th, 9th, 10th, +1, and +2 students in Bathinda, Punjab. Guided by Mrs. Vanita Rani Gupta (M.Sc., M.Phil., B.Ed., 17+ years experience).
            </p>

            <div className="space-y-2 text-xs text-gray-400 pt-1">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E50914] shrink-0" />
                #302, Phase-II, Vishal Nagar, Bathinda, Punjab
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#E50914] shrink-0" />
                <a href="tel:+919815962612" className="hover:text-white transition-colors font-bold text-white">
                  +91 98159-62612
                </a>
              </p>
            </div>
          </div>

          {/* Nav Columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-white font-bold text-sm mb-4 tracking-wide">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link
                        to={l.to}
                        className="text-gray-400 text-xs hover:text-white transition-colors"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => scrollTo(l.href)}
                        className="text-gray-400 text-xs hover:text-white transition-colors text-left"
                      >
                        {l.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Vanita Math Classes (VMC). All rights reserved.</p>
          <p className="flex items-center gap-4">
            <span>Faculty: Vanita Rani Gupta (M.Sc., M.Phil., B.Ed.)</span>
            <span>Bathinda, Punjab</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

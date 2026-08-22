import { Link } from 'react-router-dom'
import { Instagram, Facebook, Youtube } from 'lucide-react'

const COLUMNS = [
  {
    title: 'Institute',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Faculty', href: '#faculty' },
      { label: 'Gallery', href: '#gallery' },
      { label: 'Results', href: '#results' },
    ],
  },
  {
    title: 'Courses',
    links: [
      { label: '6th – 8th Foundation', href: '#courses' },
      { label: '9th – 10th Board Prep', href: '#courses' },
      { label: '9th – 10th', href: '#courses' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Student Login', to: '/login' },
      { label: 'Student Sign Up', to: '/register' },
      { label: 'Admin Login', to: '/admin-login' },
    ],
  },
]

export default function Footer() {
  const scrollTo = (href) => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer className="bg-ink-950 border-t border-chalk-100/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-400/15 border border-gold-400/40 flex items-center justify-center overflow-hidden">
                <img src="/fab2.jpeg" alt="Vanita Maths Classes logo" className="w-6 h-6 object-contain" />
              </div>
              <span className="font-display font-semibold text-chalk-100 text-lg">Vanita Math Classes</span>
            </div>
            <p className="text-chalk-200/50 text-sm leading-relaxed max-w-xs">
              Coaching for standards 8th to 12th, focused on understanding maths — not memorizing it.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                { icon: Instagram, href: 'https://www.instagram.com/vanitamathclasses?igsh=MTFhOHB0aW1rZHkwZQ==' },
                { icon: Facebook, href: 'https://www.facebook.com/VMCTuitions/' },
                { icon: Youtube, href: '#' },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target={href !== '#' ? '_blank' : undefined}
                  rel={href !== '#' ? 'noopener noreferrer' : undefined}
                  className="w-9 h-9 rounded-full border border-chalk-100/15 flex items-center justify-center text-chalk-200/60 hover:text-gold-300 hover:border-gold-400/40 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map(col => (
            <div key={col.title}>
              <p className="text-chalk-100 font-medium text-sm mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className="text-chalk-200/50 text-sm hover:text-gold-300 transition-colors">{l.label}</Link>
                    ) : (
                      <button onClick={() => scrollTo(l.href)} className="text-chalk-200/50 text-sm hover:text-gold-300 transition-colors text-left">{l.label}</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-7 border-t border-chalk-100/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-chalk-200/35 text-xs">© {new Date().getFullYear()} Vanita Math Classes. All rights reserved.</p>
          <p className="text-chalk-200/35 text-xs">Vishal Nagar, Bathinda, Punjab</p>
        </div>
      </div>
    </footer>
  )
}

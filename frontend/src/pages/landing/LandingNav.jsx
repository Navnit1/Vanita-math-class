import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, GraduationCap } from 'lucide-react'
import logo from '../../images/fab.jpeg'

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#courses', label: 'Courses' },
  { href: '#faculty', label: 'Faculty' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#results', label: 'Results' },
  { href: '#contact', label: 'Contact' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (href) => {
    setOpen(false)
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-ink-950/90 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-transparent'}`}>
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gold-400/15 border border-gold-400/40 flex items-center justify-center group-hover:bg-gold-400/25 transition-colors">
         <img src={logo} alt="Vanita Math Classes" className=" h-9 sm:h-10 w-auto object-contain rounded-lg border border-gold-400/40 group-hover:border-gold-400/60 transition-colors" />
         </div>
          <span className="font-display font-semibold text-chalk-100 text-lg sm:text-xl tracking-tight">Vanita Math Classes</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {LINKS.map(l => (
            <button key={l.href} onClick={() => goTo(l.href)} className="px-4 py-2 text-sm text-chalk-200/80 hover:text-gold-300 transition-colors">
              {l.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/admin-login" className="px-4 py-2 text-sm text-chalk-200/70 hover:text-chalk-100 transition-colors">
            Admin Login
          </Link>
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-chalk-100 border border-chalk-100/25 rounded-full hover:border-gold-400/60 hover:text-gold-300 transition-colors">
            Student Login
          </Link>
          <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-gold-400 text-ink-950 rounded-full hover:bg-gold-300 transition-colors">
            Sign Up
          </Link>
        </div>

        <button onClick={() => setOpen(o => !o)} className="lg:hidden text-chalk-100 p-2">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden bg-ink-950/98 backdrop-blur-md border-t border-chalk-100/10 px-5 py-4 space-y-1">
          {LINKS.map(l => (
            <button key={l.href} onClick={() => goTo(l.href)} className="block w-full text-left px-3 py-2.5 text-chalk-200/80 hover:text-gold-300 text-sm">
              {l.label}
            </button>
          ))}
          <div className="pt-3 mt-3 border-t border-chalk-100/10 flex flex-col gap-2">
            <Link to="/admin-login" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm text-chalk-200/70">Admin Login</Link>
            <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm font-medium text-center text-chalk-100 border border-chalk-100/25 rounded-full">Student Login</Link>
            <Link to="/register" onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm font-semibold text-center bg-gold-400 text-ink-950 rounded-full">Sign Up</Link>
          </div>
        </div>
      )}
    </header>
  )
}

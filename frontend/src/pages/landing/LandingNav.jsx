import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Phone, UserCheck, Shield } from 'lucide-react'
import logo from '../../images/fab.jpeg'

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#courses', label: 'Courses (8th to +2)' },
  { href: '#faculty', label: 'Faculty' },
  { href: '#results', label: 'Results' },
  { href: '#gallery', label: 'Classroom' },
  { href: '#faq', label: 'FAQs' },
  { href: '#contact', label: 'Enquiry / Contact' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (href) => {
    setOpen(false)
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200'
          : 'bg-white border-b border-gray-100'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            <img
              src={logo}
              alt="Vanita Math Classes"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div>
            <span className="font-extrabold text-gray-900 text-lg sm:text-xl tracking-tight block leading-tight">
              VANITA <span className="text-primary-600">MATH CLASSES</span>
            </span>
            <span className="text-[11px] font-semibold text-gray-500 hidden sm:block tracking-wide">
              Bathinda · 8th, 9th, 10th, +1 & +2 Mathematics
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => goTo(l.href)}
              className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-50 transition-all"
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Right CTA / Portal Links */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="tel:+919815962612"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-primary-600 px-2 py-1 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-primary-600" />
            98159-62612
          </a>

          <Link
            to="/admin-login"
            className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-gray-500" /> Admin
          </Link>

          <Link
            to="/login"
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5" /> Student Login
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="lg:hidden text-gray-800 p-2 hover:bg-gray-100 rounded-lg"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden bg-white border-t border-gray-200 px-5 py-4 space-y-2 shadow-xl animate-in slide-in-from-top-2">
          {LINKS.map((l) => (
            <button
              key={l.href}
              onClick={() => goTo(l.href)}
              className="block w-full text-left px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 font-semibold text-sm rounded-lg"
            >
              {l.label}
            </button>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <a
              href="tel:+919815962612"
              className="px-3 py-2 text-xs font-bold text-gray-800 flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-primary-600" /> 98159-62612
            </a>
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="btn btn-primary w-full justify-center text-sm"
            >
              Student Portal Login
            </Link>
            <div className="flex gap-2">
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="btn btn-outline flex-1 justify-center text-xs"
              >
                Register
              </Link>
              <Link
                to="/admin-login"
                onClick={() => setOpen(false)}
                className="btn btn-secondary flex-1 justify-center text-xs"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

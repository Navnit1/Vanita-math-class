import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Phone, UserCheck, Shield, Sparkles, MapPin, BookOpen, Clock } from 'lucide-react'

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#courses', label: 'Courses (8th–+2)' },
  { href: '#faculty', label: 'Faculty' },
  { href: '#results', label: 'Results' },
  { href: '#gallery', label: 'Classroom' },
  { href: '#faq', label: 'FAQs' },
  { href: '#contact', label: 'Enquiry' },
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
    <div className="fixed top-0 inset-x-0 z-50">
      {/* Top Announcement & Quick Contact Strip */}
      <div className="bg-[#8F000F] text-white/95 text-[11px] sm:text-xs py-1.5 px-4 sm:px-8 border-b border-black/20 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FF3347] text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
              <Sparkles className="w-2.5 h-2.5" /> Admissions Open
            </span>
            <span className="font-medium text-white/90 truncate">
              Mathematics 8th, 9th, 10th, +1 & +2 · Conceptual Clarity & Board Preparation
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 shrink-0 text-xs font-medium text-white/90">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-200" />
              #302, Phase-II, Vishal Nagar, Bathinda
            </span>
            <span className="text-white/40">|</span>
            <a
              href="tel:+919815962612"
              className="flex items-center gap-1 text-white font-bold hover:text-white hover:underline transition-colors"
            >
              <Phone className="w-3 h-3 text-red-200" />
              98159-62612
            </a>
          </div>
        </div>
      </div>

      {/* Main Full-Width Red Gradient Header */}
      <header
        className={`bg-gradient-to-r from-[#E50914] via-[#C90019] to-[#990012] text-white transition-all duration-300 border-b border-[#8A000F] ${
          scrolled ? 'shadow-lg py-2 sm:py-2.5' : 'shadow-md py-3 sm:py-3.5'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 sm:gap-4 group shrink-0">
            <div className="h-11 w-16 sm:h-12 sm:w-20 bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/30 rounded-xl p-1 flex items-center justify-center transition-all shadow-inner">
              <img
                src="/vmc-logo-white.svg"
                alt="Vanita Math Classes logo"
                className="h-9 sm:h-10 w-auto object-contain drop-shadow"
              />
            </div>
            <div>
              <span className="font-black text-white text-lg sm:text-2xl tracking-tight block leading-tight font-serif drop-shadow-xs">
                VANITA <span className="text-red-100">MATH CLASSES</span>
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-red-100/90 hidden sm:block tracking-wide">
                Bathinda · Classes 8th, 9th, 10th, +1 & +2 Mathematics
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden xl:flex items-center gap-1">
            {LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => goTo(l.href)}
                className="px-3 py-1.5 text-xs font-bold text-white/90 hover:text-white hover:bg-white/15 rounded-lg transition-all"
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Right Action / Portal Links */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <a
              href="tel:+919815962612"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/25 px-3 py-2 rounded-lg transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-red-200" />
              98159-62612
            </a>

            <Link
              to="/admin-login"
              className="px-3 py-2 text-xs font-bold text-white/95 hover:text-white border border-white/35 rounded-lg hover:bg-white/15 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-red-200" /> Admin
            </Link>

            <Link
              to="/login"
              className="bg-white text-[#C90019] hover:bg-red-50 px-4 py-2 text-xs font-black rounded-lg transition-all shadow-sm flex items-center gap-1.5 hover:shadow"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#E50914]" /> Student Login
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden text-white p-2 hover:bg-white/15 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation Drawer */}
        {open && (
          <div className="lg:hidden bg-white text-[#171717] border-t border-[#D9DDE3] px-5 py-4 space-y-2 shadow-2xl animate-in slide-in-from-top-2">
            <div className="pb-3 mb-2 border-b border-gray-100 flex items-center gap-3">
              <img src="/vmc-logo.svg" alt="VMC Logo" className="h-8 w-auto" />
              <div>
                <p className="font-extrabold text-[#171717] text-sm">VANITA MATH CLASSES</p>
                <p className="text-[11px] text-[#64748B]">8th, 9th, 10th, +1 & +2 · Bathinda</p>
              </div>
            </div>

            {LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => goTo(l.href)}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-[#C90019] hover:bg-[#FFF5F5] font-semibold text-sm rounded-lg transition-colors"
              >
                {l.label}
              </button>
            ))}

            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
              <a
                href="tel:+919815962612"
                className="px-3 py-2 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-[#E50914]" />
                Call: 98159-62612
              </a>

              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="btn btn-primary w-full justify-center text-sm font-bold shadow-xs"
              >
                <UserCheck className="w-4 h-4 mr-1.5" /> Student Portal Login
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="btn btn-outline justify-center text-xs"
                >
                  Register
                </Link>
                <Link
                  to="/admin-login"
                  onClick={() => setOpen(false)}
                  className="btn btn-secondary justify-center text-xs"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  )
}

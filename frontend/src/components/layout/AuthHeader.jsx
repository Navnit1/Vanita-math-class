import { Link } from 'react-router-dom'
import { Phone, ArrowLeft, Shield, UserCheck, Home } from 'lucide-react'

export default function AuthHeader({ subtitle = 'Classes 8th, 9th, 10th, +1 & +2 Mathematics', currentPortal = 'student' }) {
  return (
    <header className="w-full bg-gradient-to-r from-[#E50914] via-[#C90019] to-[#990012] text-white shadow-md border-b border-[#8A000F] px-4 sm:px-8 py-3.5 mb-6 sm:mb-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="h-10 w-16 bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/30 rounded-lg p-1 flex items-center justify-center transition-all shadow-inner">
            <img
              src="/vmc-logo-white.svg"
              alt="Vanita Math Classes logo"
              className="h-8 w-auto object-contain drop-shadow"
            />
          </div>
          <div>
            <span className="font-black text-white text-base sm:text-xl tracking-tight block leading-tight font-serif drop-shadow-xs uppercase">
              Vanita Math Classes
            </span>
            <span className="text-[11px] font-semibold text-red-100 hidden sm:block tracking-wide">
              {subtitle}
            </span>
          </div>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <a
            href="tel:+919815962612"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/25 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-red-200" />
            98159-62612
          </a>

          {currentPortal === 'student' ? (
            <Link
              to="/admin-login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white border border-white/35 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-red-200" />
              <span className="hidden sm:inline">Admin</span> Portal
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white border border-white/35 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-red-200" />
              <span className="hidden sm:inline">Student</span> Portal
            </Link>
          )}

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-black text-[#C90019] bg-white hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <Home className="w-3.5 h-3.5 text-[#E50914]" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

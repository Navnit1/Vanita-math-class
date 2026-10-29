import { forwardRef } from 'react'
import { cn, getInitials, getAvatarColor } from '@/lib/utils'
import { Loader2, Search, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react'

// ─── Avatar ─────────────────────────────────────────────
export function Avatar({ name, src, size = 'md', className }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  const colorClass = getAvatarColor(name)
  if (src) return <img src={src} alt={name} className={cn('rounded-full object-cover border border-[#D9DDE3]', sizes[size], className)} />
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold flex-shrink-0', sizes[size], colorClass, className)}>
      {getInitials(name)}
    </div>
  )
}

// ─── Badge ──────────────────────────────────────────────
export function Badge({ children, variant = 'slate', className }) {
  const v = {
    green: 'badge-green',
    red: 'badge-red',
    yellow: 'badge-yellow',
    slate: 'badge-slate',
    primary: 'badge-primary',
  }
  return <span className={cn('badge', v[variant] || 'badge-slate', className)}>{children}</span>
}

// ─── Spinner ────────────────────────────────────────────
export function Spinner({ size = 'md', className }) {
  const s = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' }
  return <Loader2 className={cn('animate-spin text-[#E50914]', s[size], className)} />
}

// ─── Page Loader ────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-[#64748B] font-medium">Loading Vanita Math Classes…</p>
      </div>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────
export function StatCard({ title, value, icon: Icon, color = 'red', subtitle, trend, trendLabel, onClick }) {
  const colors = {
    red: 'bg-[#FFF5F5] text-[#C90019] border border-[#FFCCD0]',
    green: 'bg-emerald-50 text-[#059669] border border-emerald-200',
    orange: 'bg-amber-50 text-[#F59E0B] border border-amber-200',
    slate: 'bg-[#F3F4F6] text-[#64748B] border border-[#D9DDE3]',
  }
  return (
    <div
      onClick={onClick}
      className={cn(
        'stat-card transition-all duration-150',
        onClick && 'cursor-pointer hover:border-[#E50914] hover:shadow-card-md'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">{title}</p>
          <p className="text-2xl font-bold text-[#171717] mt-1.5">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>}
          {trend != null && (
            <p className={cn('text-xs mt-1.5 font-semibold', trend >= 0 ? 'text-[#059669]' : 'text-[#C90019]')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-2.5 rounded-lg shrink-0', colors[color] || colors.red)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Search Input ────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...', className }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
      />
    </div>
  )
}

// ─── Empty State ────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[#FFF5F5] border border-[#FFCCD0] flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-[#C90019]" />
        </div>
      )}
      <p className="text-[#171717] font-semibold text-base">{title}</p>
      {description && <p className="text-sm text-[#64748B] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ─── Error State ────────────────────────────────────────
export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-[#C90019]" />
      </div>
      <p className="text-[#171717] font-medium">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn btn-secondary btn-sm">Try again</button>}
    </div>
  )
}

// ─── Modal ──────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-xl shadow-2xl w-full border border-[#D9DDE3] animate-slide-up z-10', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#D9DDE3]">
            <h3 className="font-bold text-[#171717] text-base">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-lg text-[#64748B] hover:bg-[#F3F4F6] hover:text-[#171717]">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ─── Confirm Dialog ─────────────────────────────────────
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="p-6">
        <p className="text-sm text-[#64748B]">{message}</p>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={cn('btn btn-sm', danger ? 'btn-danger' : 'btn-primary')}>
            {loading ? <Spinner size="sm" /> : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Form Field ─────────────────────────────────────────
export function FormField({ label, error, required, children, hint, className }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}{required && <span className="text-[#E50914] ml-0.5">*</span>}</label>}
      {children}
      {hint && !error && <p className="text-xs text-[#64748B] mt-1">{hint}</p>}
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
}

// ─── Select ─────────────────────────────────────────────
export const Select = forwardRef(function Select({ className, ...props }, ref) {
  return (
    <select ref={ref} className={cn('input', className)} {...props} />
  )
})

// ─── Pagination ─────────────────────────────────────────
export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center gap-2 justify-end px-4 py-3 border-t border-[#D9DDE3]">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="btn btn-secondary btn-sm p-1.5"><ChevronLeft className="w-4 h-4" /></button>
      <span className="text-sm font-medium text-[#64748B]">Page {page} of {pages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page >= pages} className="btn btn-secondary btn-sm p-1.5"><ChevronRight className="w-4 h-4" /></button>
    </div>
  )
}

// ─── Section Card ────────────────────────────────────────
export function SectionCard({ title, subtitle, action, children, className }) {
  return (
    <div className={cn('card', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D9DDE3]">
          <div>
            <h3 className="font-bold text-[#171717] text-sm tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Tab Bar ────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-[#F3F4F6] border border-[#D9DDE3] rounded-lg p-1 w-fit">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-semibold transition-all',
            active === tab.value
              ? 'bg-[#E50914] text-white shadow-sm'
              : 'text-[#64748B] hover:text-[#171717]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

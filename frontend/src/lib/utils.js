import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...args) => twMerge(clsx(args))

export const formatCurrency = (amount) => {
  if (amount == null) return '₹0'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount)
}

export const formatDate = (date, opts = {}) => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...opts }).format(new Date(date))
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export const getAvatarColor = (name) => {
  const colors = [
    'bg-[#FFF5F5] text-[#C90019]',
    'bg-emerald-50 text-emerald-700',
    'bg-amber-50 text-amber-700',
    'bg-slate-100 text-slate-700',
    'bg-red-100 text-red-800'
  ]
  if (!name) return colors[0]
  return colors[name.charCodeAt(0) % colors.length]
}

export const feeStatusBadge = (status) => {
  const map = {
    paid: 'badge-green',
    partial: 'badge-yellow',
    pending: 'badge-slate',
    overdue: 'badge-red',
  }
  return map[status] || 'badge-slate'
}

export const paymentMethodLabel = (method) => {
  const map = {
    cash: 'Cash',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    demand_draft: 'Demand Draft',
    online: 'Online (Razorpay)'
  }
  return map[method] || method
}

export const truncate = (str, n = 50) => str?.length > n ? str.slice(0, n) + '…' : str

export const sleep = (ms) => new Promise(r => setTimeout(r, ms))

export const formatFileSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

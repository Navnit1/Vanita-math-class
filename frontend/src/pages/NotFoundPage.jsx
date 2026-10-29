import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { GraduationCap } from 'lucide-react'

export default function NotFoundPage() {
  const { user, isAuthenticated } = useAuth()
  const home = isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/dashboard') : '/'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-6xl font-bold text-slate-200 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Page not found</h2>
        <p className="text-slate-500 text-sm mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link to={home} className="btn btn-primary">Go to Dashboard</Link>
      </div>
    </div>
  )
}

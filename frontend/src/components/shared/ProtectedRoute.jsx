import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoader } from '@/components/ui'

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading, mustChangePassword } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (mustChangePassword && location.pathname !== '/set-new-password') {
    return <Navigate to="/set-new-password" replace />
  }
  if (roles && !roles.includes(user?.role)) {
    const redirects = { admin: '/admin', teacher: '/teacher', student: '/dashboard' }
    return <Navigate to={redirects[user?.role] || '/login'} replace />
  }

  return children
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (isAuthenticated) {
    const redirects = { admin: '/admin', teacher: '/teacher', student: '/dashboard' }
    return <Navigate to={redirects[user?.role] || '/'} replace />
  }

  return children
}

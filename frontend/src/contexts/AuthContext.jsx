import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vmc_token')
    const stored = localStorage.getItem('vmc_user')
    if (token && stored) {
      try { setUser(JSON.parse(stored)) } catch { clearStorage() }
    }
    setLoading(false)
  }, [])

  const clearStorage = () => {
    localStorage.removeItem('vmc_token')
    localStorage.removeItem('vmc_refresh')
    localStorage.removeItem('vmc_user')
  }

  const login = useCallback(async (identifier, password) => {
    setLoading(true)
    try {
      const { user: u, accessToken, refreshToken } = await authService.login(identifier, password)
      localStorage.setItem('vmc_token', accessToken)
      localStorage.setItem('vmc_refresh', refreshToken)
      localStorage.setItem('vmc_user', JSON.stringify(u))
      setUser(u)
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`)
      return u
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try { await authService.logout() } catch {}
    clearStorage()
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('vmc_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{
      user, loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isStudent: user?.role === 'student',
      mustChangePassword: !!user?.mustChangePassword,
      login, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

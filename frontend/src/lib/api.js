import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('vmc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    const status = err.response?.status

    // Public auth endpoints (login, register, etc.) can legitimately return
    // 401 for "wrong password" — that is NOT an expired session, so it must
    // never trigger the redirect-to-login/reload logic below.
    const isAuthEndpoint = /\/auth\/(login|register|forgot-password|reset-password|refresh-token)/.test(original?.url || '')

    if (status === 401 && !original._retry && !isAuthEndpoint) {
      const refresh = localStorage.getItem('vmc_refresh')
      if (refresh) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then(token => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
        }

        original._retry = true
        isRefreshing = true

        try {
          const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh-token`, { refreshToken: refresh })
          const newToken = data.data.accessToken
          localStorage.setItem('vmc_token', newToken)
          localStorage.setItem('vmc_refresh', data.data.refreshToken)
          original.headers.Authorization = `Bearer ${newToken}`
          processQueue(null, newToken)
          return api(original)
        } catch {
          processQueue(err)
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(err)
        } finally {
          isRefreshing = false
        }
      }
      localStorage.clear()
      window.location.href = '/login'
    }

    if (status === 403) toast.error('You do not have permission for this action')
    if (status >= 500) toast.error('Server error. Please try again.')

    return Promise.reject(err)
  }
)

export default api

import axios from 'axios'
import toast from 'react-hot-toast'

const rawEnvUrl = import.meta.env.VITE_API_BASE_URL

export const API_BASE_URL = (rawEnvUrl && rawEnvUrl.trim() !== '')
  ? rawEnvUrl.replace(/\/+$/, '')
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? 'https://vanita-math-class.onrender.com/api'
      : '/api')

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
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
  res => {
    // Detect if Vercel SPA router served index.html instead of backend JSON
    if (typeof res.data === 'string' && res.data.trim().toLowerCase().startsWith('<!doctype html')) {
      const htmlError = new Error('Received HTML response instead of JSON. The backend API is waking up or routing is misconfigured.')
      htmlError.response = {
        status: 502,
        data: {
          success: false,
          message: 'Backend service is starting up (cold start). Please click Try Again in a few moments.',
        },
      }
      return Promise.reject(htmlError)
    }
    return res
  },
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
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken: refresh })
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
    if (status >= 500) {
      const msg = err.response?.data?.message || 'Server error. Please try again.'
      toast.error(msg)
    }

    return Promise.reject(err)
  }
)

export default api

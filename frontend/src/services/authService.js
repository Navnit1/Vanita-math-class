import api from '@/lib/api'

export const authService = {
  login: async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password })
    return data.data
  },
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    return data
  },
  logout: async () => {
    await api.post('/auth/logout')
    localStorage.removeItem('vmc_token')
    localStorage.removeItem('vmc_refresh')
    localStorage.removeItem('vmc_user')
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me')
    return data.data
  },
  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },
  resetPassword: async (token, password) => {
    const { data } = await api.post('/auth/reset-password', { token, password })
    return data
  },
  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.put('/auth/change-password', { currentPassword, newPassword })
    return data
  },
  updateProfile: async (formData) => {
    const { data } = await api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data.data
  },
}

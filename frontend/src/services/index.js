import api from '@/lib/api'
import toast from 'react-hot-toast'

const readBlobErrorMessage = async (blob, fallback) => {
  try {
    const text = await blob.text()
    return JSON.parse(text)?.message || text.slice(0, 200) || fallback
  } catch {
    return fallback
  }
}

const downloadFile = async (url, fileName, fallbackErrorMessage) => {
  let blob
  try {
    const response = await api.get(url, { responseType: 'blob' })
    blob = response.data
  } catch (err) {
    const errBlob = err.response?.data
    const message = errBlob instanceof Blob
      ? await readBlobErrorMessage(errBlob, fallbackErrorMessage)
      : fallbackErrorMessage
    toast.error(message)
    throw err
  }

  const type = blob.type || ''
  if (type.includes('application/json') || type.includes('text/html')) {
    const message = await readBlobErrorMessage(blob, fallbackErrorMessage)
    toast.error(message)
    throw new Error(message)
  }

  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.setAttribute('download', fileName || 'download')
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}

export const studentService = {
  getAll: async (params) => { const { data } = await api.get('/students', { params }); return data.data },
  getById: async (id) => { const { data } = await api.get(`/students/${id}`); return data.data },
  getMyProfile: async () => { const { data } = await api.get('/students/me'); return data.data },
  getMyFees: async () => { const { data } = await api.get('/students/me/fees'); return data.data },
  getMyPayments: async () => { const { data } = await api.get('/students/me/payments'); return data.data },
  getMyAttendance: async (params) => { const { data } = await api.get('/students/me/attendance', { params }); return data.data },
  create: async (payload) => { const { data } = await api.post('/students', payload); return data.data },
  update: async (id, payload) => { const { data } = await api.put(`/students/${id}`, payload); return data.data },
  approve: async (id) => { const { data } = await api.patch(`/students/${id}/approve`); return data.data },
  toggleStatus: async (id) => { const { data } = await api.patch(`/students/${id}/toggle-status`); return data.data },
  adminResetPassword: async (id) => { const { data } = await api.post(`/students/${id}/reset-password`); return data.data },
  delete: async (id) => { const { data } = await api.delete(`/students/${id}`); return data },
  exportCsv: async (params) => {
    await downloadFile('/students/export/csv', `vmc-students-${new Date().toISOString().slice(0, 10)}.csv`, 'Failed to export CSV')
  },
}

export const weeklyTestService = {
  getAll: async (params) => { const { data } = await api.get('/weekly-tests', { params }); return data.data },
  schedule: async (payload) => { const { data } = await api.post('/weekly-tests', payload); return data.data },
  getSheet: async (id) => { const { data } = await api.get(`/weekly-tests/${id}/sheet`); return data.data },
  saveMarks: async (id, marksList) => { const { data } = await api.post(`/weekly-tests/${id}/marks`, { marksList }); return data.data },
  getMyResults: async () => { const { data } = await api.get('/weekly-tests/my-results'); return data.data },
  delete: async (id) => { const { data } = await api.delete(`/weekly-tests/${id}`); return data },
}

export const testReportService = {
  getAll: async (params) => { const { data } = await api.get('/test-reports', { params }); return data.data },
  getMine: async () => { const { data } = await api.get('/test-reports/mine'); return data.data },
  upload: async (formData) => {
    const { data } = await api.post('/test-reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data.data
  },
  download: async (id, fileName) => {
    await downloadFile(`/test-reports/${id}/download`, fileName, 'Could not download this test report.')
  },
  delete: async (id) => { const { data } = await api.delete(`/test-reports/${id}`); return data },
}

export const paymentService = {
  getAll: async (params) => { const { data } = await api.get('/payments', { params }); return data.data },
  getById: async (id) => { const { data } = await api.get(`/payments/${id}`); return data.data },
  getStats: async () => { const { data } = await api.get('/payments/stats'); return data.data },
  getMyPayments: async () => { const { data } = await api.get('/payments/my'); return data.data },

  // Offline (admin)
  create: async (payload) => {
    const { data } = await api.post('/payments', payload)
    return data.data
  },
  delete: async (id) => { const { data } = await api.delete(`/payments/${id}`); return data },

  // Online (student — Razorpay)
  createOnlineOrder: async (payload) => { const { data } = await api.post('/payments/online/order', payload); return data.data },
  verifyOnlinePayment: async (payload) => { const { data } = await api.post('/payments/online/verify', payload); return data.data },

  // Receipt download URL & trigger
  receiptUrl: (id) => `${import.meta.env.VITE_API_BASE_URL || '/api'}/payments/${id}/receipt`,
  downloadReceipt: async (id, receiptNo) => {
    await downloadFile(`/payments/${id}/receipt`, `receipt-${receiptNo || id}.pdf`, 'Failed to download receipt PDF')
  },
}

export const feeService = {
  getAll: async (params) => { const { data } = await api.get('/fees', { params }); return data.data },
  getStats: async () => { const { data } = await api.get('/fees/stats'); return data.data },
  getStudentFees: async (studentId) => { const { data } = await api.get(`/fees/student/${studentId}`); return data.data },
  create: async (payload) => { const { data } = await api.post('/fees', payload); return data.data },
  createBulk: async (payload) => { const { data } = await api.post('/fees/bulk', payload); return data.data },
  update: async (id, payload) => { const { data } = await api.put(`/fees/${id}`, payload); return data.data },
  delete: async (id) => { const { data } = await api.delete(`/fees/${id}`); return data },
}

export const attendanceService = {
  markAttendance: async (payload) => { const { data } = await api.post('/attendance', payload); return data },
  getByBatchDate: async (params) => { const { data } = await api.get('/attendance/batch', { params }); return data.data },
  getStudentAttendance: async (studentId, params) => { const { data } = await api.get(`/attendance/student/${studentId}`, { params }); return data.data },
  getSummary: async (params) => { const { data } = await api.get('/attendance/summary', { params }); return data.data },
  edit: async (id, payload) => { const { data } = await api.put(`/attendance/${id}`, payload); return data.data },
}

export const announcementService = {
  getAll: async (params) => { const { data } = await api.get('/announcements', { params }); return data.data },
  create: async (payload) => { const { data } = await api.post('/announcements', payload); return data.data },
  update: async (id, payload) => { const { data } = await api.put(`/announcements/${id}`, payload); return data.data },
  delete: async (id) => { const { data } = await api.delete(`/announcements/${id}`); return data },
  markRead: async (id) => { const { data } = await api.put(`/announcements/${id}/read`); return data },
}

export const materialService = {
  getAll: async (params) => { const { data } = await api.get('/materials', { params }); return data.data },
  upload: async (formData) => {
    const { data } = await api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data.data
  },
  update: async (id, formData) => {
    const { data } = await api.put(`/materials/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data.data
  },
  viewUrl: (id) => `${import.meta.env.VITE_API_BASE_URL || '/api'}/materials/${id}/view`,
  delete: async (id) => { const { data } = await api.delete(`/materials/${id}`); return data },
}

export const contactService = {
  submit: async (payload) => { const { data } = await api.post('/contact', payload); return data },
  getAll: async (params) => { const { data } = await api.get('/contact', { params }); return data.data },
  updateStatus: async (id, status) => { const { data } = await api.put(`/contact/${id}`, { status }); return data.data },
  enroll: async (id, payload) => { const { data } = await api.post(`/contact/${id}/enroll`, payload); return data.data },
}

export const adminService = {
  getDashboard: async (month) => {
    const params = month ? { month } : {}
    const { data } = await api.get('/admin/dashboard', { params })
    return data.data
  },
  getReports: async (params) => { const { data } = await api.get('/admin/reports', { params }); return data.data },
  getAuditLogs: async (params) => { const { data } = await api.get('/admin/audit-logs', { params }); return data.data },
}

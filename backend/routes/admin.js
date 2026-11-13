import { Router } from 'express'
import {
  getDashboardStats,
  getReports,
  getAuditLogs,
  getSettings,
  updateSettings,
  exportAllData,
  importAllData,
} from '../controllers/adminController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()
router.use(protect, authorize('admin'))

router.get('/dashboard', getDashboardStats)
router.get('/reports', getReports)
router.get('/audit-logs', getAuditLogs)
router.get('/settings', getSettings)
router.put('/settings', updateSettings)
router.get('/export-data', exportAllData)
router.post('/import-data', importAllData)

export default router

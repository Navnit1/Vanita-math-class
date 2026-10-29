import { Router } from 'express'
import {
  getDashboardStats,
  getReports,
  getAuditLogs,
} from '../controllers/adminController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()
router.use(protect, authorize('admin'))

router.get('/dashboard', getDashboardStats)
router.get('/reports', getReports)
router.get('/audit-logs', getAuditLogs)

export default router

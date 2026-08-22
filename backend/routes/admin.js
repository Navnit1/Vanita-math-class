import { Router } from 'express'
import { getDashboardStats, getTeachers, createTeacher, updateTeacher, deleteTeacher, getReports, getAuditLogs } from '../controllers/adminController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()
router.use(protect, authorize('admin'))

router.get('/dashboard', getDashboardStats)
router.get('/teachers', getTeachers)
router.post('/teachers', createTeacher)
router.put('/teachers/:id', updateTeacher)
router.delete('/teachers/:id', deleteTeacher)
router.get('/reports', getReports)
router.get('/audit-logs', getAuditLogs)

export default router

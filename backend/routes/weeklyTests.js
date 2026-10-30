import { Router } from 'express'
import {
  scheduleWeeklyTest,
  getWeeklyTests,
  getTestSheet,
  saveTestMarks,
  getMyWeeklyTestResults,
  deleteWeeklyTest,
  sendTestResultWhatsApp,
} from '../controllers/weeklyTestController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()
router.use(protect)

// Student route — privacy preserved: student can only fetch their own results
router.get('/my-results', authorize('student'), getMyWeeklyTestResults)

// Admin routes
router.get('/', authorize('admin'), getWeeklyTests)
router.post('/', authorize('admin'), scheduleWeeklyTest)
router.get('/:id/sheet', authorize('admin'), getTestSheet)
router.post('/:id/marks', authorize('admin'), saveTestMarks)
router.put('/:id/marks', authorize('admin'), saveTestMarks)
router.post('/:id/send-results-whatsapp', authorize('admin'), sendTestResultWhatsApp)
router.post('/:id/whatsapp', authorize('admin'), sendTestResultWhatsApp)
router.delete('/:id', authorize('admin'), deleteWeeklyTest)

export default router

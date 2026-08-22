import { Router } from 'express'
import {
  markAttendance, getAttendanceByBatchDate, getStudentAttendance,
  getBatchAttendanceSummary, editAttendanceRecord,
} from '../controllers/attendanceController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()
router.use(protect)

router.get('/batch', authorize('admin', 'teacher'), getAttendanceByBatchDate)
router.get('/summary', authorize('admin', 'teacher'), getBatchAttendanceSummary)
router.get('/student/:studentId', authorize('admin', 'teacher'), getStudentAttendance)
router.post('/', authorize('admin', 'teacher'), markAttendance)
router.put('/:id', authorize('admin', 'teacher'), editAttendanceRecord)

export default router

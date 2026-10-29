import { Router } from 'express'
import {
  getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent,
  getMyProfile, getMyFees, getMyPayments, getMyAttendance, approveStudent,
  exportStudentsCsv, adminResetStudentPassword, toggleStudentStatus,
  sendStudentFeeReminderWhatsApp,
} from '../controllers/studentController.js'
import { protect, authorize } from '../middleware/auth.js'
import { uploadProfile } from '../middleware/upload.js'

const router = Router()
router.use(protect)

// Student self routes — must come before /:id
router.get('/me', authorize('student'), getMyProfile)
router.get('/me/fees', authorize('student'), getMyFees)
router.get('/me/payments', authorize('student'), getMyPayments)
router.get('/me/attendance', authorize('student'), getMyAttendance)

// Admin student directory operations
router.get('/export/csv', authorize('admin'), exportStudentsCsv)
router.get('/', authorize('admin'), getAllStudents)
router.post('/', authorize('admin'), createStudent)
router.get('/:id', authorize('admin'), getStudentById)
router.put('/:id', authorize('admin'), uploadProfile.single('profilePhoto'), updateStudent)
router.patch('/:id/approve', authorize('admin'), approveStudent)
router.patch('/:id/toggle-status', authorize('admin'), toggleStudentStatus)
router.post('/:id/remind-fee-whatsapp', authorize('admin'), sendStudentFeeReminderWhatsApp)
router.post('/:id/reset-password', authorize('admin'), adminResetStudentPassword)
router.delete('/:id', authorize('admin'), deleteStudent)

export default router

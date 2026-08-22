import { Router } from 'express'
import {
  getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent,
  getMyProfile, getMyFees, getMyPayments, getMyAttendance, approveStudent,
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

// Admin routes
router.get('/', authorize('admin', 'teacher'), getAllStudents)
// createStudent sends JSON (no file) — do NOT attach multer here
router.post('/', authorize('admin'), createStudent)
// updateStudent may optionally include a profile photo
router.get('/:id', authorize('admin', 'teacher'), getStudentById)
router.put('/:id', authorize('admin'), uploadProfile.single('profilePhoto'), updateStudent)
router.patch('/:id/approve', authorize('admin'), approveStudent)
router.delete('/:id', authorize('admin'), deleteStudent)

export default router

import { Router } from 'express'
import { getAllFees, createFee, createBulkFees, updateFee, deleteFee, getFeeStats, getStudentFees } from '../controllers/feeController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()
router.use(protect)

router.get('/stats', authorize('admin'), getFeeStats)
router.get('/', authorize('admin', 'teacher'), getAllFees)
router.post('/', authorize('admin'), createFee)
router.post('/bulk', authorize('admin'), createBulkFees)
router.get('/student/:studentId', authorize('admin', 'teacher'), getStudentFees)
router.put('/:id', authorize('admin'), updateFee)
router.delete('/:id', authorize('admin'), deleteFee)

export default router

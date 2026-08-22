import { Router } from 'express'
import {
  createPayment, getAllPayments, getPaymentById, verifyPayment,
  updatePayment, deletePayment, getMyPayments, getPaymentStats,
  createOnlineOrder, verifyOnlinePayment, downloadReceipt,
} from '../controllers/paymentController.js'
import { protect, authorize } from '../middleware/auth.js'
import { uploadReceipt } from '../middleware/upload.js'

const router = Router()
router.use(protect)

// Stats & listing
router.get('/stats', authorize('admin'), getPaymentStats)
router.get('/my', authorize('student'), getMyPayments)
router.get('/', authorize('admin', 'teacher'), getAllPayments)

// Online payment (student)
router.post('/online/order', authorize('student'), createOnlineOrder)
router.post('/online/verify', authorize('student'), verifyOnlinePayment)

// Offline payment (admin)
router.post('/', authorize('admin'), uploadReceipt.single('receiptImage'), createPayment)

// Receipt download (student + admin)
router.get('/:id/receipt', authorize('admin', 'student'), downloadReceipt)

// Admin CRUD
router.get('/:id', authorize('admin'), getPaymentById)
router.put('/:id/verify', authorize('admin'), verifyPayment)
router.put('/:id', authorize('admin'), uploadReceipt.single('receiptImage'), updatePayment)
router.delete('/:id', authorize('admin'), deletePayment)

export default router

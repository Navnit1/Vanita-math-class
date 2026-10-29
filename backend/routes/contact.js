import { Router } from 'express'
import { body } from 'express-validator'
import {
  submitInquiry, getInquiries, updateInquiryStatus, enrollInquiry
} from '../controllers/contactController.js'
import { protect, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

// Public — anyone can submit an enquiry without creating an account
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Student name is required').isLength({ max: 100 }),
    body('phone').trim().notEmpty().withMessage('Valid phone number is required'),
  ],
  validate,
  submitInquiry
)

// Admin only routes
router.get('/', protect, authorize('admin'), getInquiries)
router.put('/:id', protect, authorize('admin'), updateInquiryStatus)
router.post('/:id/enroll', protect, authorize('admin'), enrollInquiry)

export default router

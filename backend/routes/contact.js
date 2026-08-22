import { Router } from 'express'
import { body } from 'express-validator'
import { submitInquiry, getInquiries, updateInquiryStatus } from '../controllers/contactController.js'
import { protect, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

// Public — anyone can submit an inquiry from the landing page
router.post('/',
  [
    body('name').trim().notEmpty().isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('message').trim().notEmpty().isLength({ max: 2000 }),
  ],
  validate,
  submitInquiry
)

// Admin only
router.get('/', protect, authorize('admin'), getInquiries)
router.put('/:id', protect, authorize('admin'), updateInquiryStatus)

export default router

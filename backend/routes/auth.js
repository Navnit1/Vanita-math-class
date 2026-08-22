import { Router } from 'express'
import {
  login, register, refreshToken, logout, getMe,
  forgotPassword, resetPassword, changePassword, updateProfile,
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { uploadProfile } from '../middleware/upload.js'
import { body } from 'express-validator'
import { validate } from '../middleware/validate.js'

const router = Router()

// Login accepts email, username, OR Student ID in 'identifier' field
router.post('/login',
  [
    body('identifier')
      .trim()
      .notEmpty().withMessage('Email, username, or Student ID is required'),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
)

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required')
      .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false, outlookdotcom_remove_subaddress: false, yahoo_remove_subaddress: false, icloud_remove_subaddress: false }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
)

router.post('/refresh-token', refreshToken)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)
router.post('/forgot-password', [
  body('email').isEmail()
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false, outlookdotcom_remove_subaddress: false, yahoo_remove_subaddress: false, icloud_remove_subaddress: false }),
], validate, forgotPassword)
router.post('/reset-password', [body('token').notEmpty(), body('password').isLength({ min: 6 })], validate, resetPassword)
router.put('/change-password', protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
)
router.put('/profile', protect, uploadProfile.single('profilePhoto'), updateProfile)

export default router

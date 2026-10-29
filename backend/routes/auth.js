import { Router } from 'express'
import {
  login, register, refreshToken, logout, getMe,
  requestPasswordResetOtp, verifyOtpAndResetPassword,
  changePassword, updateProfile,
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { uploadProfile } from '../middleware/upload.js'
import { body } from 'express-validator'
import { validate } from '../middleware/validate.js'

const router = Router()

// Login accepts email, username, OR Student ID in 'identifier' or 'email' field
router.post('/login',
  (req, res, next) => {
    if (!req.body.identifier && req.body.email) {
      req.body.identifier = req.body.email
    }
    next()
  },
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
      .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
)

router.post('/refresh-token', refreshToken)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)

// 6-digit OTP password reset routes
router.post('/send-otp',
  [
    body('identifier').trim().notEmpty().withMessage('Email or username is required'),
  ],
  validate,
  requestPasswordResetOtp
)

router.post('/verify-otp-and-reset',
  [
    body('identifier').trim().notEmpty().withMessage('Email or username is required'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit verification code'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  verifyOtpAndResetPassword
)

// Legacy alias to send-otp
router.post('/forgot-password',
  [
    body('email').trim().notEmpty().withMessage('Email or username is required'),
  ],
  (req, res, next) => {
    req.body.identifier = req.body.email
    return requestPasswordResetOtp(req, res, next)
  }
)

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

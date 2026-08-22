import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export const createError = (statusCode, message) => {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

export const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  })

export const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  })

export const generateReceiptNumber = () => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
  return `VMC-${year}${month}-${random}`
}

export const generateStudentId = () => {
  const year = new Date().getFullYear().toString().slice(-2)
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `STU${year}${random}`
}

export const generateTeacherId = () => {
  const year = new Date().getFullYear().toString().slice(-2)
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `TCH${year}${random}`
}

export const generatePasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  return { resetToken, hashedToken, expiresAt }
}

export const sendResponse = (res, statusCode, data, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  })
}

export const paginate = (query, page = 1, limit = 10) => {
  const skip = (parseInt(page) - 1) * parseInt(limit)
  return { skip, limit: parseInt(limit) }
}

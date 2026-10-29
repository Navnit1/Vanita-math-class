import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import studentRoutes from './routes/students.js'
import paymentRoutes from './routes/payments.js'
import feeRoutes from './routes/fees.js'
import attendanceRoutes from './routes/attendance.js'
import announcementRoutes from './routes/announcements.js'
import materialRoutes from './routes/materials.js'
import adminRoutes from './routes/admin.js'
import contactRoutes from './routes/contact.js'
import testReportRoutes from './routes/testReports.js'
import weeklyTestRoutes from './routes/weeklyTests.js'

import { notFound, errorHandler } from './middleware/errorHandler.js'
import logger from './utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests. Please try again later.' },
})
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many auth attempts. Please try again after 15 minutes.' },
})

app.use('/api/', limiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/send-otp', authLimiter)
app.use('/api/auth/forgot-password', authLimiter)

// Body parsers
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Sanitization
app.use(mongoSanitize())

// Compression
app.use(compression())

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }))
}

// Static files (uploaded files for local fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/fees', feeRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/test-reports', testReportRoutes)
app.use('/api/weekly-tests', weeklyTestRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Vanita Math Classes API running',
    version: '2.0.0',
    theme: 'red-and-white',
    timestamp: new Date().toISOString()
  })
})

// Error handlers
app.use(notFound)
app.use(errorHandler)

export default app

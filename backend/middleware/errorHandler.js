import logger from '../utils/logger.js'

export const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`)
  error.statusCode = 404
  next(error)
}

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500
  let message = err.message || 'Internal Server Error'

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    statusCode = 409
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join(', ')
    statusCode = 400
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`
    statusCode = 400
  }

  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`, { stack: err.stack })
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

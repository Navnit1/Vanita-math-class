import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { createError } from '../utils/helpers.js'

// Routes a user with a pending forced password change is still allowed to
// hit — they need these to actually change the password and log out.
const PASSWORD_CHANGE_ALLOWLIST = new Set([
  'PUT /api/auth/change-password',
  'POST /api/auth/logout',
  'GET /api/auth/me',
])

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError(401, 'Not authorized. No token.'))
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('+status +mustChangePassword')
    if (!user) return next(createError(401, 'User no longer exists'))
    if (user.status === 'inactive') return next(createError(403, 'Account is deactivated'))

    if (user.mustChangePassword) {
      const routeKey = `${req.method} ${req.baseUrl}${req.path}`
      if (!PASSWORD_CHANGE_ALLOWLIST.has(routeKey)) {
        return next(createError(403, 'You must change your temporary password before continuing.'))
      }
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(createError(401, 'Token expired'))
    if (err.name === 'JsonWebTokenError') return next(createError(401, 'Invalid token'))
    next(err)
  }
}

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(createError(403, `Role '${req.user.role}' is not authorized for this action`))
  }
  next()
}

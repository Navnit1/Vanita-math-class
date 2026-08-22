import { validationResult } from 'express-validator'

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ')
    return res.status(400).json({ success: false, message })
  }
  next()
}

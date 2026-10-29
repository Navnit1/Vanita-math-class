import { Router } from 'express'
import Student from '../models/Student.js'
import { BATCH_DEFINITIONS } from '../config/pricing.js'
import { sendResponse } from '../utils/response.js'

const router = Router()

/**
 * Public & Admin Batch Information with LIVE enrolled student counts from MongoDB database.
 * Never returns fabricated enrollment numbers.
 */
router.get('/', async (req, res, next) => {
  try {
    const batches = await Promise.all(
      BATCH_DEFINITIONS.map(async (b) => {
        const count = await Student.countDocuments({
          class: b.standard,
          status: 'active',
        })
        const percentage = Math.min(100, Math.round((count / b.maxCapacity) * 100))
        return {
          ...b,
          enrolledCount: count,
          enrollmentPercentage: percentage,
          isFull: count >= b.maxCapacity,
        }
      })
    )

    sendResponse(res, 200, batches, 'Live batch statistics retrieved from database.')
  } catch (err) {
    next(err)
  }
})

export default router

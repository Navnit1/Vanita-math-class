import { Router } from 'express'
import Student from '../models/Student.js'
import Batch from '../models/Batch.js'
import { BATCH_DEFINITIONS } from '../config/pricing.js'
import { sendResponse, createError } from '../utils/helpers.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

/**
 * Public & Admin Batch Information with LIVE enrolled student counts from MongoDB database.
 */
router.get('/', async (req, res, next) => {
  try {
    // Authoritative 5 standards definitions with regex patterns for student matching
    const STANDARD_PATTERNS = {
      '8th': {
        classRegex: /8th|class\s*8|grade\s*8|^8$|std\s*8/i,
        batchRegex: /class\s*8|8th/i,
      },
      '9th': {
        classRegex: /9th|class\s*9|grade\s*9|^9$|std\s*9/i,
        batchRegex: /class\s*9|9th/i,
      },
      '10th': {
        classRegex: /10th|class\s*10|grade\s*10|^10$|std\s*10/i,
        batchRegex: /class\s*10|10th/i,
      },
      '+1': {
        classRegex: /\+1|11th|class\s*11|grade\s*11|^11$|std\s*11/i,
        batchRegex: /\+1|11th/i,
      },
      '+2': {
        classRegex: /\+2|12th|class\s*12|grade\s*12|^12$|std\s*12/i,
        batchRegex: /\+2|12th/i,
      },
    }

    // Also fetch any custom batches stored in DB
    const dbBatches = await Batch.find({ isActive: true }).lean()

    const batches = await Promise.all(
      BATCH_DEFINITIONS.map(async (def) => {
        const pattern = STANDARD_PATTERNS[def.standard] || {
          classRegex: new RegExp(def.standard, 'i'),
          batchRegex: new RegExp(def.standard, 'i'),
        }

        const matchingDbBatch = dbBatches.find(b => {
          const bGrade = String(b.grade || b.name || '').toLowerCase()
          return (
            bGrade.includes(def.standard.toLowerCase()) ||
            bGrade.includes(def.standardLabel.toLowerCase()) ||
            (def.standard === '8th' && bGrade.includes('8')) ||
            (def.standard === '9th' && bGrade.includes('9')) ||
            (def.standard === '10th' && bGrade.includes('10')) ||
            (def.standard === '+1' && (bGrade.includes('+1') || bGrade.includes('11'))) ||
            (def.standard === '+2' && (bGrade.includes('+2') || bGrade.includes('12')))
          )
        })

        const orFilters = [
          { class: pattern.classRegex },
          { grade: pattern.classRegex },
          { batch: pattern.batchRegex },
          { batch: def.standardLabel },
        ]

        if (matchingDbBatch) {
          orFilters.push({ batch: matchingDbBatch.name })
          if (matchingDbBatch._id) {
            orFilters.push({ batchIds: matchingDbBatch._id.toString() })
          }
          if (matchingDbBatch.batchId) {
            orFilters.push({ batchIds: matchingDbBatch.batchId })
          }
        }

        // Live count of active students enrolled in this standard from MongoDB
        const count = await Student.countDocuments({
          status: { $in: ['active', 'enrolled', 'ACTIVE'] },
          $or: orFilters,
        })

        const maxCap = matchingDbBatch?.capacity || def.maxCapacity || 30
        const percentage = Math.min(100, Math.round((count / maxCap) * 100))

        return {
          ...def,
          ...(matchingDbBatch || {}),
          id: matchingDbBatch?.batchId || matchingDbBatch?._id?.toString() || `batch-${def.standard.replace('+', '')}`,
          standard: def.standard,
          standardLabel: def.standardLabel,
          batchTitle: def.batchTitle,
          monthlyFee: matchingDbBatch?.monthlyFee || def.monthlyFee,
          maxCapacity: maxCap,
          capacity: maxCap,
          enrolledCount: count,
          enrollmentPercentage: percentage,
          isFull: count >= maxCap,
          seatsLeft: Math.max(0, maxCap - count),
        }
      })
    )

    sendResponse(res, 200, batches, 'Live batch statistics retrieved from database.')
  } catch (err) {
    next(err)
  }
})

// Create new batch
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, grade, schedule, monthlyFee, capacity, room, colorTheme, focus, instructor } = req.body
    if (!name || !grade) return next(createError(400, 'Batch name and grade are required'))

    const batchId = `batch-${Date.now().toString().slice(-4)}`
    const newBatch = await Batch.create({
      batchId,
      name,
      grade,
      schedule: schedule || 'Mon, Wed, Fri',
      monthlyFee: Number(monthlyFee) || 2500,
      capacity: Number(capacity) || 30,
      room: room || 'Hall A',
      colorTheme: colorTheme || 'indigo',
      focus: focus || '',
      instructor: instructor || 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)',
    })

    sendResponse(res, 201, newBatch, 'Batch created successfully')
  } catch (err) {
    next(err)
  }
})

// Update batch
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body

    const batch = await Batch.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id }]
    })

    if (!batch) return next(createError(404, 'Batch not found'))

    Object.assign(batch, updates)
    await batch.save()

    sendResponse(res, 200, batch, 'Batch updated successfully')
  } catch (err) {
    next(err)
  }
})

// Delete batch
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    const batch = await Batch.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id }]
    })

    if (!batch) return next(createError(404, 'Batch not found'))

    batch.isActive = false
    await batch.save()

    sendResponse(res, 200, null, 'Batch removed successfully')
  } catch (err) {
    next(err)
  }
})

export default router

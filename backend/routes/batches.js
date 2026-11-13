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
    let dbBatches = await Batch.find({ isActive: true }).sort({ createdAt: 1 })

    // If database batches are empty, seed from BATCH_DEFINITIONS
    if (dbBatches.length === 0) {
      const defaultDocs = BATCH_DEFINITIONS.map(b => ({
        batchId: `batch-${b.standard.replace('+', '')}`,
        name: `${b.standardLabel} - ${b.batchTitle}`,
        grade: b.standardLabel,
        subject: 'Mathematics',
        instructor: b.faculty,
        schedule: b.schedule,
        monthlyFee: b.monthlyFee,
        capacity: b.maxCapacity,
        room: b.standard === '10th' ? 'Hall B (Smart Classroom)' : 'Hall A',
        colorTheme: b.standard === '8th' ? 'indigo' : b.standard === '9th' ? 'cyan' : b.standard === '10th' ? 'emerald' : b.standard === '+1' ? 'amber' : 'purple',
        focus: b.focus,
        isActive: true,
      }))
      dbBatches = await Batch.insertMany(defaultDocs)
    }

    const batches = await Promise.all(
      dbBatches.map(async (b) => {
        const obj = b.toObject ? b.toObject() : b
        const count = await Student.countDocuments({
          $or: [
            { class: b.grade },
            { class: b.batchId },
            { batch: b.name },
            { batch: b.batchId },
            { class: new RegExp(b.grade.replace(/[^0-9\+]/g, ''), 'i') }
          ],
          status: 'active',
        })
        const percentage = Math.min(100, Math.round((count / (b.capacity || 30)) * 100))
        return {
          ...obj,
          id: obj.batchId || obj._id.toString(),
          enrolledCount: count,
          enrollmentPercentage: percentage,
          isFull: count >= (b.capacity || 30),
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

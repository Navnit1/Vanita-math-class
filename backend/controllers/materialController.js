import Material from '../models/Material.js'
import { createError, sendResponse, paginate } from '../utils/helpers.js'
import { cloudinary } from '../middleware/upload.js'

export const getMaterials = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, subject, class: cls, type, batch } = req.query
    const filter = { isActive: true }
    if (subject) filter.subject = { $regex: subject, $options: 'i' }
    if (cls) filter.class = cls
    if (type) filter.type = type

    // Students see materials for their class (or ones marked "All"), and
    // for their batch (or ones marked "all"). Class comparisons are
    // case-insensitive so "All", "all", "ALL" all behave the same way.
    if (req.user.role === 'student') {
      const Student = (await import('../models/Student.js')).default
      const student = await Student.findOne({ userId: req.user._id })
      if (student) {
        filter.$and = [
          { $or: [
            { class: { $regex: '^all$', $options: 'i' } },
            { class: student.class },
          ] },
          { $or: [
            { batch: { $regex: '^all$', $options: 'i' } },
            { batch: student.batch },
          ] },
        ]
      }
    }

    if (batch && req.user.role !== 'student') filter.batch = batch
    const { skip, limit: lim } = paginate(null, page, limit)
    const [materials, total] = await Promise.all([
      Material.find(filter).populate('uploadedBy', 'name role').sort({ createdAt: -1 }).skip(skip).limit(lim),
      Material.countDocuments(filter),
    ])

    sendResponse(res, 200, { materials, total, page: parseInt(page), pages: Math.ceil(total / lim) })
  } catch (err) {
    next(err)
  }
}

export const uploadMaterial = async (req, res, next) => {
  try {
    if (!req.file) return next(createError(400, 'File is required'))

    const { title, description, type, subject, class: cls, batch } = req.body
    const material = await Material.create({
      title, description, type, subject, class: cls, batch: batch || 'all',
      filePath: req.file.path,
      filePublicId: req.file.filename,
      fileResourceType: req.file.mimetype?.startsWith('image/') ? 'image' : 'raw',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
    })

    const populated = await Material.findById(material._id).populate('uploadedBy', 'name')
    sendResponse(res, 201, populated, 'Material uploaded successfully')
  } catch (err) {
    next(err)
  }
}

export const downloadMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) return next(createError(404, 'Material not found'))

    material.downloadCount += 1
    await material.save({ validateBeforeSave: false })

    if (!material.filePath) return next(createError(404, 'File not found on server'))

    res.redirect(material.filePath)
  } catch (err) {
    next(err)
  }
}

export const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) return next(createError(404, 'Material not found'))

    if (material.filePublicId) {
      await cloudinary.uploader.destroy(material.filePublicId, { resource_type: material.fileResourceType || 'raw' }).catch(() => {})
    }

    await material.deleteOne()
    sendResponse(res, 200, null, 'Material deleted')
  } catch (err) {
    next(err)
  }
}
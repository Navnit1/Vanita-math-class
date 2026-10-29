import Material from '../models/Material.js'
import Student from '../models/Student.js'
import { createError, sendResponse, paginate } from '../utils/helpers.js'
import { cloudinary, isCloudinaryConfigured } from '../middleware/upload.js'
import fs from 'fs'
import path from 'path'

/**
 * PHASE 8: Math Notes Repository
 */
export const getMaterials = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, subject, class: cls, type, topic, chapter, search } = req.query
    const filter = { isActive: true }

    if (subject) filter.subject = { $regex: subject, $options: 'i' }
    if (cls && cls !== 'All') filter.class = { $in: [cls, 'All'] }
    if (type) filter.type = type
    if (topic) filter.topic = { $regex: topic, $options: 'i' }
    if (chapter) filter.chapter = { $regex: chapter, $options: 'i' }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { chapter: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ]
    }

    // Class-specific notes access control for students:
    // Students can ONLY view notes authorized for their class (or marked 'All')
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id })
      if (!student) return next(createError(404, 'Student profile not found'))

      filter.$and = [
        {
          $or: [
            { class: { $regex: '^all$', $options: 'i' } },
            { class: student.class },
          ],
        },
        {
          $or: [
            { batch: { $regex: '^all$', $options: 'i' } },
            { batch: student.batch },
          ],
        },
      ]
    }

    const { skip, limit: lim } = paginate(null, page, limit)
    const [materials, total] = await Promise.all([
      Material.find(filter)
        .populate('uploadedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim),
      Material.countDocuments(filter),
    ])

    sendResponse(res, 200, { materials, total, page: parseInt(page), pages: Math.ceil(total / lim) })
  } catch (err) {
    next(err)
  }
}

export const uploadMaterial = async (req, res, next) => {
  try {
    if (!req.file) return next(createError(400, 'PDF note or document file is required'))

    const { title, description, type, subject, class: cls, batch, topic, chapter, tags } = req.body

    if (!title || !cls) {
      return next(createError(400, 'Title and target class are required'))
    }

    let parsedTags = []
    if (Array.isArray(tags)) parsedTags = tags
    else if (typeof tags === 'string') parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean)

    const filePath = req.file.path || req.file.secure_url || req.file.url
    const filePublicId = req.file.filename || req.file.public_id || null

    const material = await Material.create({
      title: title.trim(),
      description: (description || '').trim(),
      type: type || 'notes',
      subject: (subject || 'Mathematics').trim(),
      class: cls.trim(),
      batch: batch || 'all',
      topic: (topic || '').trim(),
      chapter: (chapter || '').trim(),
      tags: parsedTags,
      filePath,
      filePublicId,
      fileResourceType: req.file.mimetype?.startsWith('image/') ? 'image' : 'raw',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
    })

    const populated = await Material.findById(material._id).populate('uploadedBy', 'name')
    sendResponse(res, 201, populated, 'Math notes uploaded successfully')
  } catch (err) {
    next(err)
  }
}

export const updateMaterial = async (req, res, next) => {
  try {
    const { title, description, type, subject, class: cls, batch, topic, chapter, tags, isActive } = req.body
    const material = await Material.findById(req.params.id)
    if (!material) return next(createError(404, 'Material not found'))

    if (title) material.title = title.trim()
    if (description !== undefined) material.description = description.trim()
    if (type) material.type = type
    if (subject) material.subject = subject.trim()
    if (cls) material.class = cls.trim()
    if (batch) material.batch = batch
    if (topic !== undefined) material.topic = topic.trim()
    if (chapter !== undefined) material.chapter = chapter.trim()
    if (isActive !== undefined) material.isActive = Boolean(isActive)

    if (tags) {
      material.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)
    }

    // If replacement file uploaded
    if (req.file) {
      if (material.filePublicId && isCloudinaryConfigured) {
        await cloudinary.uploader.destroy(material.filePublicId, { resource_type: material.fileResourceType || 'raw' }).catch(() => {})
      }
      material.filePath = req.file.path || req.file.secure_url
      material.filePublicId = req.file.filename || req.file.public_id
      material.fileName = req.file.originalname
      material.fileSize = req.file.size
      material.mimeType = req.file.mimetype
    }

    await material.save()
    const populated = await Material.findById(material._id).populate('uploadedBy', 'name')
    sendResponse(res, 200, populated, 'Material updated successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * In-Website Protected Note Viewer
 * Opens PDF notes directly inside the portal without external links or WhatsApp sharing.
 */
export const viewNote = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material || !material.isActive) return next(createError(404, 'Study note not found or inactive'))

    // Class-specific permission check
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id })
      if (!student) return next(createError(403, 'Permission denied'))

      const isAuthorizedClass =
        material.class.toLowerCase() === 'all' ||
        material.class.toLowerCase() === student.class.toLowerCase()

      const isAuthorizedBatch =
        material.batch.toLowerCase() === 'all' ||
        material.batch.toLowerCase() === student.batch.toLowerCase()

      if (!isAuthorizedClass || !isAuthorizedBatch) {
        return next(createError(403, 'You do not have permission to view notes for this class.'))
      }
    }

    material.downloadCount += 1
    await material.save({ validateBeforeSave: false })

    // If file is stored on local filesystem:
    if (fs.existsSync(material.filePath)) {
      res.setHeader('Content-Type', material.mimeType || 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(material.fileName)}"`)
      return fs.createReadStream(material.filePath).pipe(res)
    }

    // If remote URL (Cloudinary)
    if (material.filePath.startsWith('http')) {
      return res.redirect(material.filePath)
    }

    next(createError(404, 'File not found on storage server'))
  } catch (err) {
    next(err)
  }
}

export const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) return next(createError(404, 'Material not found'))

    if (material.filePublicId && isCloudinaryConfigured) {
      await cloudinary.uploader.destroy(material.filePublicId, { resource_type: material.fileResourceType || 'raw' }).catch(() => {})
    } else if (fs.existsSync(material.filePath)) {
      try { fs.unlinkSync(material.filePath) } catch {}
    }

    await material.deleteOne()
    sendResponse(res, 200, null, 'Material deleted successfully')
  } catch (err) {
    next(err)
  }
}

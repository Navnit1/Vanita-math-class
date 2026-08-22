import Announcement from '../models/Announcement.js'
import Student from '../models/Student.js'
import { createError, sendResponse, paginate } from '../utils/helpers.js'
import { recordAudit } from '../utils/auditLog.js'

export const getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const role = req.user.role

    // Build audience filter based on the requester's role
    let audienceFilter
    if (role === 'student') audienceFilter = ['all', 'students']
    else if (role === 'teacher') audienceFilter = ['all', 'teachers']
    else audienceFilter = ['all', 'teachers', 'students', 'admin'] // admin sees everything

    const filter = { audience: { $in: audienceFilter }, isActive: true }

    // Students must only see announcements targeted at their own standard
    // (announcements with no class set are visible to all standards).
    if (role === 'student') {
      const studentProfile = await Student.findOne({ userId: req.user._id }).select('class').lean()
      const studentClass = studentProfile?.class
      filter.$and = [
        { $or: [{ class: null }, { class: '' }, ...(studentClass ? [{ class: studentClass }] : [])] },
      ]
    }

    const now = new Date()
    const expiryOr = [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    filter.$or ? filter.$and = [...(filter.$and || []), { $or: expiryOr }] : (filter.$or = expiryOr)

    const { skip, limit: lim } = paginate(null, page, limit)
    const [announcements, total, unreadCount] = await Promise.all([
      Announcement.find(filter).populate('createdBy', 'name role').sort({ priority: -1, createdAt: -1 }).skip(skip).limit(lim),
      Announcement.countDocuments(filter),
      Announcement.countDocuments({ ...filter, readBy: { $ne: req.user._id } }),
    ])

    const withReadFlag = announcements.map(a => ({
      ...a.toObject(),
      isRead: a.readBy.some(id => id.toString() === req.user._id.toString()),
    }))

    sendResponse(res, 200, { announcements: withReadFlag, total, unreadCount, page: parseInt(page), pages: Math.ceil(total / lim) })
  } catch (err) {
    next(err)
  }
}

export const markAnnouncementRead = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    )
    if (!announcement) return next(createError(404, 'Announcement not found'))
    sendResponse(res, 200, null, 'Marked as read')
  } catch (err) {
    next(err)
  }
}

export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, audience, priority, class: cls, batch, expiresAt } = req.body
    const announcement = await Announcement.create({
      title, content, audience, priority, class: cls || null, batch: batch || null, expiresAt: expiresAt || null,
      createdBy: req.user._id,
    })
    const populated = await Announcement.findById(announcement._id).populate('createdBy', 'name role')
    sendResponse(res, 201, populated, 'Announcement created')

    recordAudit({
      action: 'announcement.create', user: req.user, targetType: 'Announcement', targetId: announcement._id,
      description: `Created announcement "${title}"${cls ? ` for Std ${cls}` : ''}`, req,
    })
  } catch (err) {
    next(err)
  }
}

export const updateAnnouncement = async (req, res, next) => {
  try {
    const { title, content, audience, priority, class: cls, batch, expiresAt, isActive } = req.body
    const updates = { title, content, audience, priority, class: cls, batch, expiresAt, isActive }
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('createdBy', 'name')
    if (!announcement) return next(createError(404, 'Announcement not found'))
    sendResponse(res, 200, announcement, 'Announcement updated')
  } catch (err) {
    next(err)
  }
}

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id)
    if (!announcement) return next(createError(404, 'Announcement not found'))
    sendResponse(res, 200, null, 'Announcement deleted')

    recordAudit({
      action: 'announcement.delete', user: req.user, targetType: 'Announcement', targetId: announcement._id,
      description: `Deleted announcement "${announcement.title}"`, req,
    })
  } catch (err) {
    next(err)
  }
}

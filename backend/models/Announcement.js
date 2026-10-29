import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  audience: { type: String, enum: ['all', 'students', 'admin'], default: 'students' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  class: { type: String, default: null }, // e.g. "8th", "+1" — null/empty = all standards
  batch: { type: String, default: null }, // null = all batches
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyTest', default: null },
  attachments: [{ name: String, path: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

announcementSchema.index({ audience: 1, class: 1, isActive: 1 })
announcementSchema.index({ createdAt: -1 })

export default mongoose.model('Announcement', announcementSchema)

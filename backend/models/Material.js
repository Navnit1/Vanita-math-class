import mongoose from 'mongoose'

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  type: { type: String, enum: ['notes', 'formula_sheet', 'assignment', 'worksheet', 'pdf', 'other'], default: 'notes' },
  subject: { type: String, default: 'Mathematics', trim: true },
  class: { type: String, required: true, trim: true }, // '8th', '9th', '10th', '+1', '+2', or 'All'
  batch: { type: String, default: 'all', trim: true },
  topic: { type: String, default: '', trim: true },
  chapter: { type: String, default: '', trim: true },
  tags: [{ type: String, trim: true }],
  filePath: { type: String, required: true },
  filePublicId: { type: String },
  fileResourceType: { type: String, default: 'raw' },
  fileName: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: 'application/pdf' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true })

materialSchema.index({ class: 1, topic: 1 })
materialSchema.index({ class: 1, chapter: 1 })
materialSchema.index({ class: 1, isActive: 1 })

export default mongoose.model('Material', materialSchema)

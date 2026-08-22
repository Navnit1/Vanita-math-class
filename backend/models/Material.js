import mongoose from 'mongoose'

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  type: { type: String, enum: ['notes', 'assignment', 'worksheet', 'pdf', 'other'], default: 'notes' },
  subject: { type: String, required: true },
  class: { type: String, required: true },
  batch: { type: String, default: 'all' },
  filePath: { type: String, required: true },
  filePublicId: { type: String },
  fileResourceType: { type: String, default: 'raw' },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true })

materialSchema.index({ class: 1, subject: 1 })

export default mongoose.model('Material', materialSchema)
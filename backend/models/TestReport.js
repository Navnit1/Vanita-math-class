import mongoose from 'mongoose'

const testReportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  class: { type: String, default: null },
  batch: { type: String, default: 'all' },
  subject: { type: String, default: '' },
  testDate: { type: Date },
  marksObtained: { type: Number },
  totalMarks: { type: Number },
  remarks: { type: String, trim: true },
  filePath: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

testReportSchema.index({ student: 1, createdAt: -1 })
testReportSchema.index({ class: 1, batch: 1, createdAt: -1 })

export default mongoose.model('TestReport', testReportSchema)
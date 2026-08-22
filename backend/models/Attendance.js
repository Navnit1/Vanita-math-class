import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: String, required: true },
  batch: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'absent' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true })

attendanceSchema.index({ studentId: 1, date: -1 })
attendanceSchema.index({ class: 1, batch: 1, date: 1 })
attendanceSchema.index({ studentId: 1, class: 1, batch: 1, date: 1 }, { unique: true })

export default mongoose.model('Attendance', attendanceSchema)

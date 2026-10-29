import mongoose from 'mongoose'

const testResultSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyTest', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  attendance: { type: String, enum: ['present', 'absent'], default: 'present', required: true },
  marksObtained: { type: Number, default: null },
  maxMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  percentage: { type: Number, default: null },
  result: { type: String, enum: ['pass', 'fail', 'absent'], default: 'absent' },
  remarks: { type: String, default: '', trim: true },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: { type: Date, default: Date.now },
}, { timestamps: true })

// Prevent duplicate results for the same test and student
testResultSchema.index({ testId: 1, studentId: 1 }, { unique: true })

export default mongoose.model('TestResult', testResultSchema)

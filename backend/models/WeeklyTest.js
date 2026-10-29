import mongoose from 'mongoose'

const weeklyTestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  class: { type: String, required: true, trim: true }, // '8th', '9th', '10th', '+1', '+2'
  batch: { type: String, default: 'All Batches', trim: true }, // 'All Batches', 'Morning', 'Evening', 'Weekend'
  testDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // e.g. "10:00 AM"
  endTime: { type: String, default: '' }, // e.g. "11:30 AM"
  durationMinutes: { type: Number, default: 60 },
  subject: { type: String, default: 'Mathematics', trim: true },
  topicsCovered: { type: String, required: true, trim: true },
  maxMarks: { type: Number, required: true, min: 1 },
  passingMarks: { type: Number, required: true, min: 0 },
  instructions: { type: String, default: '' },
  announcementText: { type: String, default: '' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

weeklyTestSchema.index({ class: 1, testDate: -1 })
weeklyTestSchema.index({ status: 1, testDate: 1 })

export default mongoose.model('WeeklyTest', weeklyTestSchema)

import mongoose from 'mongoose'

const batchSchema = new mongoose.Schema({
  batchId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  grade: { type: String, required: true, trim: true },
  subject: { type: String, default: 'Mathematics', trim: true },
  instructor: {
    type: String,
    default: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)',
    trim: true
  },
  schedule: { type: String, required: true, trim: true },
  monthlyFee: { type: Number, required: true, min: 0 },
  capacity: { type: Number, default: 30, min: 1 },
  room: { type: String, default: 'Hall A', trim: true },
  colorTheme: { type: String, default: 'indigo', trim: true },
  focus: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Batch', batchSchema)

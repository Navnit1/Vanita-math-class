import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  centerName: { type: String, default: 'Vanita Math Classes' },
  tagline: { type: String, default: 'Mathmatics tuition classes for 8th, 9th, 10th, +1 & +2' },
  address: { type: String, default: '#302, Phase-II, Vishal Nagar, Bathinda' },
  phone: { type: String, default: '98159-62612' },
  email: { type: String, default: 'singla_vikas123@yahhoo.com' },
  facultyName: { type: String, default: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed, More than 17 years teaching experience)' },
  upiId: { type: String, default: '9815962612@upi' },
  accountDetails: { type: String, default: 'State Bank of India - Bathinda (Er. Vikas)' },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  receiptPrefix: { type: String, default: 'VMC-2026-' },
  academicYear: { type: String, default: '2026-2027' },
  termsAndConditions: {
    type: String,
    default: '1. Monthly fee is payable by 10th of every month. 2. Weekly math tests on every Saturday/Sunday are compulsory. 3. Fees once deposited are non-refundable.'
  },
  adminUsername: { type: String, default: 'vikas' }
}, { timestamps: true })

export default mongoose.model('Settings', settingsSchema)

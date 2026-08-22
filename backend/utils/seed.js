import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Fee from '../models/Fee.js'
import Announcement from '../models/Announcement.js'

const MONGODB_URI = process.env.MONGODB_URI

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '\n❌ Refusing to run: NODE_ENV=production.\n' +
      '   This script wipes ALL existing data and creates demo accounts with\n' +
      '   publicly-known passwords (Admin@1234, Teacher@1234, Student@1234).\n' +
      '   It must only ever be run against a local/dev database.\n' +
      '   If you really need to seed a fresh production DB, temporarily set\n' +
      '   NODE_ENV=development, run this once, then immediately log in and\n' +
      '   change every seeded password before adding real students.\n'
    )
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URI, { dbName: 'vanita-maths' })
  console.log('Connected to MongoDB')

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Student.deleteMany({}), Teacher.deleteMany({}),
    Fee.deleteMany({}), Announcement.deleteMany({}),
  ])
  console.log('Cleared existing data')

  // Admin — use .create() so the pre-save bcrypt hook fires
  const adminUser = await User.create({
    name: 'Vanita Admin', email: 'admin@vanitamath.com', username: 'admin',
    password: 'Admin@1234', role: 'admin', status: 'active',
  })
  console.log('Admin created: admin@vanitamath.com / Admin@1234')

  // Teacher
  const teacherUser = await User.create({
    name: 'Priya Sharma', email: 'teacher@vanitamath.com', username: 'priyasharma',
    password: 'Teacher@1234', role: 'teacher', status: 'active',
  })
  await Teacher.create({
    teacherId: 'TCH2400001', userId: teacherUser._id,
    name: 'Priya Sharma', email: 'teacher@vanitamath.com',
    phone: '9876543210', subjects: ['Mathematics', 'Physics'],
    batches: ['Morning', 'Evening'], qualification: 'M.Sc Mathematics',
    salary: 25000, status: 'active',
  })
  console.log('Teacher created: teacher@vanitamath.com / Teacher@1234')

  // Students — use .create() one by one so bcrypt pre-save hook fires on each
  const s1 = await User.create({
    name: 'Arjun Patil', email: 'student@vanitamath.com', username: 'arjunpatil',
    password: 'Student@1234', role: 'student', status: 'active',
  })
  const s2 = await User.create({
    name: 'Sneha Kulkarni', email: 'sneha@vanitamath.com', username: 'snehakulkarni',
    password: 'Student@1234', role: 'student', status: 'active',
  })
  const s3 = await User.create({
    name: 'Rahul Desai', email: 'rahul@vanitamath.com', username: 'rahuldesai',
    password: 'Student@1234', role: 'student', status: 'active',
  })
  const studentUsers = [s1, s2, s3]

  const currentYear = new Date().getFullYear()
  const studentData = [
    {
      studentId: `STD10-${currentYear}-002`, userId: s1._id,
      fullName: 'Arjun Patil', email: 'student@vanitamath.com', phone: '9123456780',
      class: '10th', section: 'A', batch: 'Morning', academicYear: String(currentYear),
      course: 'Advanced Mathematics', parentName: 'Suresh Patil', parentPhone: '9123456781',
      totalFee: 36000, paidFee: 27000, feePlan: 'monthly', feeStatus: 'partial', status: 'active',
    },
    {
      studentId: `STD9-${currentYear}-001`, userId: s2._id,
      fullName: 'Sneha Kulkarni', email: 'sneha@vanitamath.com', phone: '9123456782',
      class: '9th', section: 'A', batch: 'Evening', academicYear: String(currentYear),
      course: 'Foundation Mathematics', parentName: 'Anand Kulkarni', parentPhone: '9123456783',
      totalFee: 30000, paidFee: 30000, feePlan: 'quarterly', feeStatus: 'paid', status: 'active',
    },
    {
      studentId: `STD10-${currentYear}-001`, userId: s3._id,
      fullName: 'Rahul Desai', email: 'rahul@vanitamath.com', phone: '9123456784',
      class: '10th', section: 'B', batch: 'Morning', academicYear: String(currentYear),
      course: 'Foundation Mathematics', parentName: 'Vijay Desai', parentPhone: '9123456785',
      totalFee: 24000, paidFee: 0, feePlan: 'monthly', feeStatus: 'pending', status: 'active',
    },
  ]

  const students = await Student.insertMany(studentData)

  // Fee records
  const months = ['January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025']
  const feeRecords = []
  for (const student of students) {
    for (let i = 0; i < months.length; i++) {
      feeRecords.push({
        studentId: student._id,
        feeType: 'monthly',
        amount: Math.round(student.totalFee / 12),
        dueDate: new Date(2025, i, 10),
        month: months[i],
        paymentStatus: student.feeStatus === 'paid' ? 'paid' : (i < 3 ? 'paid' : 'pending'),
        paidAmount: student.feeStatus === 'paid' ? Math.round(student.totalFee / 12) : (i < 3 ? Math.round(student.totalFee / 12) : 0),
        createdBy: adminUser._id,
      })
    }
  }
  await Fee.insertMany(feeRecords)

  // Announcements
  await Announcement.insertMany([
    {
      title: 'Welcome to Vanita Maths Classes!',
      content: 'We are excited to begin the new academic year. Classes start from June 15. Please check your batch schedule.',
      audience: 'all', priority: 'high', class: null, createdBy: adminUser._id,
    },
    {
      title: 'Monthly Test - June 2025',
      content: 'Monthly assessment will be held on June 25, 2025. Topics: Quadratic Equations for 10th, Polynomials for 9th.',
      audience: 'students', priority: 'medium', class: null, createdBy: teacherUser._id,
    },
    {
      title: 'Fee Reminder - June 2025',
      content: 'Please note that June fees are due by June 10, 2025. Kindly clear dues to avoid late fees.',
      audience: 'students', priority: 'high', class: null, createdBy: adminUser._id,
    },
  ])

  console.log('\nSeed completed successfully!')
  console.log('\n=== LOGIN CREDENTIALS ===')
  console.log('Admin:   admin@vanitamath.com   | password: Admin@1234')
  console.log('         username: admin         | password: Admin@1234')
  console.log('Teacher: teacher@vanitamath.com | password: Teacher@1234')
  console.log('Student: student@vanitamath.com | password: Student@1234')
  console.log('         username: arjunpatil    | password: Student@1234')
  console.log('=========================\n')

  await mongoose.disconnect()
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1) })

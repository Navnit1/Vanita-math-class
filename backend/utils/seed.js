import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Student from '../models/Student.js'
import Fee from '../models/Fee.js'
import Announcement from '../models/Announcement.js'
import WeeklyTest from '../models/WeeklyTest.js'
import TestResult from '../models/TestResult.js'

const MONGODB_URI = process.env.MONGODB_URI

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '\n❌ Refusing to run: NODE_ENV=production.\n' +
      '   This script wipes ALL existing data and creates demo accounts.\n' +
      '   It must only ever be run against a local/dev database.\n'
    )
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URI, { dbName: 'vanita-maths' })
  console.log('Connected to MongoDB')

  // Clear existing data (Teacher model purged!)
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Fee.deleteMany({}),
    Announcement.deleteMany({}),
    WeeklyTest.deleteMany({}),
    TestResult.deleteMany({}),
  ])
  console.log('Cleared existing data')

  // Exactly ONE Admin account
  const adminUser = await User.create({
    name: 'Vanita Rani Gupta',
    email: 'admin@vanitamath.com',
    username: 'admin',
    password: 'Admin@1234',
    role: 'admin',
    status: 'active',
  })
  console.log('Admin created: admin@vanitamath.com (username: admin) / Admin@1234')

  // Multiple Students across 8th, 9th, 10th, +1, +2
  const currentYear = new Date().getFullYear()

  const s1 = await User.create({
    name: 'Arjun Patil',
    email: 'arjun@vanitamaths.local',
    username: 'arjunpatil',
    password: 'Student@1234',
    role: 'student',
    status: 'active',
  })
  const s2 = await User.create({
    name: 'Sneha Kulkarni',
    email: 'sneha@vanitamaths.local',
    username: 'snehakulkarni',
    password: 'Student@1234',
    role: 'student',
    status: 'active',
  })
  const s3 = await User.create({
    name: 'Rahul Desai',
    email: 'rahul@vanitamaths.local',
    username: 'rahuldesai',
    password: 'Student@1234',
    role: 'student',
    status: 'active',
  })
  const s4 = await User.create({
    name: 'Jaspreet Singh',
    email: 'jaspreet@vanitamaths.local',
    username: 'jaspreetsingh',
    password: 'Student@1234',
    role: 'student',
    status: 'active',
  })
  const s5 = await User.create({
    name: 'Simran Kaur',
    email: 'simran@vanitamaths.local',
    username: 'simrankaur',
    password: 'Student@1234',
    role: 'student',
    status: 'active',
  })

  await Student.create([
    {
      studentId: `STD10-${currentYear}-001`,
      userId: s1._id,
      fullName: 'Arjun Patil',
      email: s1.email,
      phone: '9815962001',
      class: '10th',
      batch: 'Evening',
      school: 'St. Joseph Convent School',
      parentName: 'Suresh Patil',
      parentPhone: '9815962001',
      monthlyFee: 3000,
      totalFee: 30000,
      paidFee: 24000,
      feeStatus: 'partial',
      status: 'active',
    },
    {
      studentId: `STD9-${currentYear}-001`,
      userId: s2._id,
      fullName: 'Sneha Kulkarni',
      email: s2.email,
      phone: '9815962002',
      class: '9th',
      batch: 'Evening',
      school: 'Delhi Public School, Bathinda',
      parentName: 'Anand Kulkarni',
      parentPhone: '9815962002',
      monthlyFee: 2500,
      totalFee: 25000,
      paidFee: 25000,
      feeStatus: 'paid',
      status: 'active',
    },
    {
      studentId: `STD8-${currentYear}-001`,
      userId: s3._id,
      fullName: 'Rahul Desai',
      email: s3.email,
      phone: '9815962003',
      class: '8th',
      batch: 'Morning',
      school: 'DAV Public School',
      parentName: 'Vijay Desai',
      parentPhone: '9815962003',
      monthlyFee: 2200,
      totalFee: 22000,
      paidFee: 0,
      feeStatus: 'pending',
      status: 'active',
    },
    {
      studentId: `STD11-${currentYear}-001`,
      userId: s4._id,
      fullName: 'Jaspreet Singh',
      email: s4.email,
      phone: '9815962004',
      class: '+1',
      batch: 'Evening',
      school: 'Government Senior Secondary School',
      parentName: 'Harjit Singh',
      parentPhone: '9815962004',
      monthlyFee: 3500,
      totalFee: 35000,
      paidFee: 17500,
      feeStatus: 'partial',
      status: 'active',
    },
    {
      studentId: `STD12-${currentYear}-001`,
      userId: s5._id,
      fullName: 'Simran Kaur',
      email: s5.email,
      phone: '9815962005',
      class: '+2',
      batch: 'Evening',
      school: 'Silver Oaks School, Bathinda',
      parentName: 'Gurdeep Singh',
      parentPhone: '9815962005',
      monthlyFee: 4000,
      totalFee: 40000,
      paidFee: 40000,
      feeStatus: 'paid',
      status: 'active',
    },
  ])

  // Sample Weekly Test
  const testDate = new Date()
  testDate.setDate(testDate.getDate() + 3)

  const test = await WeeklyTest.create({
    title: 'Quadratic Equations & Polynomials',
    class: '10th',
    batch: 'All Batches',
    testDate,
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    durationMinutes: 90,
    subject: 'Mathematics',
    topicsCovered: 'Standard form, Discriminant, Nature of Roots, Factoring method',
    maxMarks: 50,
    passingMarks: 20,
    instructions: 'Bring your own geometry box and blue/black pen. Calculators strictly not permitted.',
    status: 'scheduled',
    createdBy: adminUser._id,
  })

  await Announcement.create({
    title: 'Weekly Test: Quadratic Equations (Class 10th)',
    content: 'Scheduled for this Sunday at 10:00 AM. Total Marks: 50. Please prepare Chapters 2 and 4 thoroughly.',
    audience: 'students',
    priority: 'high',
    class: '10th',
    testId: test._id,
    createdBy: adminUser._id,
  })

  console.log('Database seeded with 1 Admin, 5 Students (8th, 9th, 10th, +1, +2), and 1 Weekly Test!')
  process.exit(0)
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})

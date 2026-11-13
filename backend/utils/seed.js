import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Student from '../models/Student.js'
import Fee from '../models/Fee.js'
import Payment from '../models/Payment.js'
import Announcement from '../models/Announcement.js'
import WeeklyTest from '../models/WeeklyTest.js'
import TestResult from '../models/TestResult.js'
import Material from '../models/Material.js'
import ContactInquiry from '../models/ContactInquiry.js'
import Batch from '../models/Batch.js'
import Settings from '../models/Settings.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vanita_math_classes'

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('\nRefusing to wipe production database.\n')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URI, { dbName: 'vanita-maths' })
  console.log('Connected to MongoDB for seeding')

  // Clear existing collections safely
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Fee.deleteMany({}),
    Payment.deleteMany({}),
    Announcement.deleteMany({}),
    WeeklyTest.deleteMany({}),
    TestResult.deleteMany({}),
    Material.deleteMany({}),
    ContactInquiry.deleteMany({}),
    Batch.deleteMany({}),
    Settings.deleteMany({}),
  ])
  console.log('Cleared existing collections')

  // 1. Center Settings
  const settings = await Settings.create({
    centerName: 'Vanita Math Classes',
    tagline: 'Mathmatics tuition classes for 8th, 9th, 10th, +1 & +2',
    address: '#302, Phase-II, Vishal Nagar, Bathinda',
    phone: '98159-62612',
    email: 'singla_vikas123@yahhoo.com',
    facultyName: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed, More than 17 years teaching experience)',
    upiId: '9815962612@upi',
    accountDetails: 'State Bank of India - Bathinda (Er. Vikas)',
    currency: 'INR',
    currencySymbol: '₹',
    receiptPrefix: 'VMC-2026-',
    academicYear: '2026-2027',
    termsAndConditions: '1. Monthly fee is payable by 10th of every month. 2. Weekly math tests on every Saturday/Sunday are compulsory. 3. Fees once deposited are non-refundable.',
    adminUsername: 'navnit'
  })
  console.log('Center settings created')

  // 2. Administrators: Vikas & Admin
  const adminNavnit = await User.create({
    name: 'Navnit Kumar',
    email: 'navnit@vanitamaths.com',
    username: 'navnit',
    password: 'navnit1',
    role: 'admin',
    status: 'active',
  })
  const adminVikas = adminNavnit
  console.log('Admin accounts created (username: vikas & admin, password: vanita)')

  // 3. Batches
  const b8 = await Batch.create({
    batchId: 'batch-8',
    name: 'Class 8th - Mathematics Foundation & NTSE',
    grade: '8th Class',
    subject: 'Mathematics',
    instructor: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)',
    schedule: 'Tue, Thu, Sat · 3:30 PM - 4:45 PM',
    monthlyFee: 1800,
    capacity: 25,
    room: 'Hall A',
    colorTheme: 'indigo',
    focus: 'Rational Numbers, Linear Equations, Algebraic Expressions & Mensuration',
    isActive: true,
  })

  const b9 = await Batch.create({
    batchId: 'batch-9',
    name: 'Class 9th - Comprehensive Mathematics (CBSE/ICSE)',
    grade: '9th Class',
    subject: 'Mathematics',
    instructor: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)',
    schedule: 'Mon, Wed, Fri · 3:30 PM - 4:45 PM',
    monthlyFee: 2000,
    capacity: 25,
    room: 'Hall A',
    colorTheme: 'cyan',
    focus: 'Number Systems, Polynomials, Coordinate Geometry, Triangles & Circles',
    isActive: true,
  })

  const b10 = await Batch.create({
    batchId: 'batch-10',
    name: 'Class 10th - Board Target & Mathematics Mastery',
    grade: '10th Class',
    subject: 'Mathematics',
    instructor: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)',
    schedule: 'Mon, Wed, Fri · 5:00 PM - 6:30 PM',
    monthlyFee: 2500,
    capacity: 30,
    room: 'Hall B (Smart Classroom)',
    colorTheme: 'emerald',
    focus: 'Real Numbers, Quadratic Equations, Trigonometry & Surface Areas',
    isActive: true,
  })

  const b11 = await Batch.create({
    batchId: 'batch-11',
    name: 'Class +1 (11th) - Advanced Mathematics (Core & Calculus)',
    grade: '+1 (11th) Mathematics',
    subject: 'Mathematics',
    instructor: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)',
    schedule: 'Tue, Thu, Sat · 5:00 PM - 6:45 PM',
    monthlyFee: 3000,
    capacity: 25,
    room: 'Hall B',
    colorTheme: 'amber',
    focus: 'Sets, Trigonometric Functions, Permutations, Conic Sections & Calculus Intro',
    isActive: true,
  })

  const b12 = await Batch.create({
    batchId: 'batch-12',
    name: 'Class +2 (12th) - Board Excellence & Competitive Math',
    grade: '+2 (12th) Mathematics',
    subject: 'Mathematics',
    instructor: 'Vanita Rani Gupta (M.Sc, M.Phil, B.Ed)',
    schedule: 'Daily (Mon-Sat) · 6:45 PM - 8:15 PM',
    monthlyFee: 3500,
    capacity: 30,
    room: 'Hall B',
    colorTheme: 'purple',
    focus: 'Relations & Functions, Matrices, Continuity & Diff, Integrals, Vectors & 3D',
    isActive: true,
  })
  console.log('5 Batches seeded')

  // 4. Reference Students
  const rawStudents = [
    {
      rollNo: 'VMC-101',
      name: 'Diya Singhal',
      phone: '9871100234',
      email: 'diya.singhal@gmail.com',
      guardianName: 'Vikas Singhal',
      guardianPhone: '9871100200',
      grade: '10th Class',
      class: '10th',
      batch: 'Class 10th - Board Target & Mathematics Mastery',
      batchId: 'batch-10',
      schoolOrCollege: 'St. Xavier Senior Secondary School',
      monthlyFee: 2500,
      totalFee: 25000,
      paidFee: 25000,
      feeStatus: 'paid',
      avatarColor: '#0891b2',
      notes: 'Aiming for 100/100 in Class 10 Board Mathematics. Excellent conceptual grasp.',
    },
    {
      rollNo: 'VMC-102',
      name: 'Aarav Sharma',
      phone: '9823011223',
      email: 'aarav.math@gmail.com',
      guardianName: 'Ramesh Sharma',
      guardianPhone: '9823011200',
      grade: '+2 (12th) Mathematics',
      class: '+2',
      batch: 'Class +2 (12th) - Board Excellence & Competitive Math',
      batchId: 'batch-12',
      schoolOrCollege: 'Delhi Public School',
      monthlyFee: 3150,
      totalFee: 31500,
      paidFee: 3150,
      feeStatus: 'partial',
      avatarColor: '#4f46e5',
      notes: 'Merit scholarship holder (10% waiver). Preparing for JEE Advanced Mathematics.',
    },
    {
      rollNo: 'VMC-103',
      name: 'Rohan Deshmukh',
      phone: '9765432190',
      email: 'rohan.d@gmail.com',
      guardianName: 'Sanjay Deshmukh',
      guardianPhone: '9765432100',
      grade: '+1 (11th) Mathematics',
      class: '+1',
      batch: 'Class +1 (11th) - Advanced Mathematics (Core & Calculus)',
      batchId: 'batch-11',
      schoolOrCollege: 'Modern Vidya Mandir',
      monthlyFee: 3000,
      totalFee: 30000,
      paidFee: 0,
      feeStatus: 'due',
      avatarColor: '#059669',
      notes: 'Focusing on Trigonometry and Coordinate Geometry.',
    },
    {
      rollNo: 'VMC-104',
      name: 'Ananya Iyer',
      phone: '9443218765',
      email: 'ananya.iyer@gmail.com',
      guardianName: 'R. K. Iyer',
      guardianPhone: '9443218700',
      grade: '+2 (12th) Mathematics',
      class: '+2',
      batch: 'Class +2 (12th) - Board Excellence & Competitive Math',
      batchId: 'batch-12',
      schoolOrCollege: 'National Public School',
      monthlyFee: 3500,
      totalFee: 35000,
      paidFee: 3500,
      feeStatus: 'paid',
      avatarColor: '#d97706',
      notes: 'Consistent weekly test performer. Very neat presentation.',
    },
    {
      rollNo: 'VMC-105',
      name: 'Kabir Verma',
      phone: '9811234567',
      email: 'kabir.v@gmail.com',
      guardianName: 'Harish Verma',
      guardianPhone: '9811234500',
      grade: '9th Class',
      class: '9th',
      batch: 'Class 9th - Comprehensive Mathematics (CBSE/ICSE)',
      batchId: 'batch-9',
      schoolOrCollege: 'Bhavan Vidyalaya',
      monthlyFee: 2000,
      totalFee: 20000,
      paidFee: 0,
      feeStatus: 'due',
      avatarColor: '#7c3aed',
      notes: 'Good problem solving speed, needs occasional practice on Geometry proofs.',
    },
    {
      rollNo: 'VMC-106',
      name: 'Simran Kaur',
      phone: '9872233445',
      email: 'simran.kaur@gmail.com',
      guardianName: 'Gurmeet Singh',
      guardianPhone: '9872233400',
      grade: '8th Class',
      class: '8th',
      batch: 'Class 8th - Mathematics Foundation & NTSE',
      batchId: 'batch-8',
      schoolOrCollege: 'Sacred Heart Convent',
      monthlyFee: 1800,
      totalFee: 18000,
      paidFee: 1800,
      feeStatus: 'paid',
      avatarColor: '#e11d48',
      notes: 'Top scorer in 8th Class Algebra weekly tests.',
    },
  ]

  const createdStudents = []
  for (const s of rawStudents) {
    const u = await User.create({
      name: s.name,
      email: s.email,
      username: s.rollNo.toLowerCase(),
      phone: s.phone,
      password: 'vanita',
      role: 'student',
      status: 'active',
    })

    const stdDoc = await Student.create({
      studentId: s.rollNo,
      userId: u._id,
      fullName: s.name,
      email: s.email,
      phone: s.phone,
      class: s.class,
      batch: s.batch,
      school: s.schoolOrCollege,
      parentName: s.guardianName,
      parentPhone: s.guardianPhone,
      monthlyFee: s.monthlyFee,
      totalFee: s.totalFee,
      paidFee: s.paidFee,
      feeStatus: s.feeStatus,
      status: 'active',
      joiningDate: new Date('2026-04-01'),
    })
    createdStudents.push({ ...s, _id: stdDoc._id, userId: u._id })
  }
  console.log('6 Students created with login credentials (roll / password: vanita)')

  // 5. Payments & Receipts
  const paymentsData = [
    {
      studentIndex: 0, // Diya
      receiptNo: 'VMC-2026-0041',
      amount: 2500,
      month: 'September 2026',
      paymentMethod: 'upi',
      transactionId: 'UPI/9928172901/SBI',
      notes: 'September tuition fee received via UPI. Receipt generated.',
      recordedBy: 'Admin (Vikas)',
      paymentDate: new Date('2026-09-05'),
    },
    {
      studentIndex: 0, // Diya
      receiptNo: 'VMC-2026-0035',
      amount: 2500,
      month: 'August 2026',
      paymentMethod: 'cash',
      transactionId: 'CASH-REC-06',
      notes: 'August fee cleared in cash at desk.',
      recordedBy: 'Vanita Mam',
      paymentDate: new Date('2026-08-06'),
    },
    {
      studentIndex: 1, // Aarav
      receiptNo: 'VMC-2026-0042',
      amount: 3150,
      month: 'September 2026',
      paymentMethod: 'upi',
      transactionId: 'GPay/8819230192',
      notes: '10% merit scholarship applied.',
      recordedBy: 'Admin (Vikas)',
      paymentDate: new Date('2026-09-07'),
    },
    {
      studentIndex: 3, // Ananya
      receiptNo: 'VMC-2026-0043',
      amount: 3500,
      month: 'September 2026',
      paymentMethod: 'bank_transfer',
      transactionId: 'NEFT-SBIN2026090801',
      notes: 'September fees paid in full.',
      recordedBy: 'Admin (Vikas)',
      paymentDate: new Date('2026-09-08'),
    },
    {
      studentIndex: 5, // Simran
      receiptNo: 'VMC-2026-0044',
      amount: 1800,
      month: 'September 2026',
      paymentMethod: 'cash',
      transactionId: 'CASH-09',
      notes: 'Cleared on time.',
      recordedBy: 'Vanita Mam',
      paymentDate: new Date('2026-09-09'),
    },
  ]

  for (const p of paymentsData) {
    const student = createdStudents[p.studentIndex]
    await Payment.create({
      studentId: student._id,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate,
      receiptNumber: p.receiptNo,
      notes: p.notes,
      month: p.month,
      transactionId: p.transactionId,
      approvalStatus: 'approved',
    })
  }
  console.log('5 Fee Receipts seeded')

  // 6. Weekly Tests & Results
  const t1 = await WeeklyTest.create({
    title: 'Weekly Test 1: Real Numbers & Polynomials',
    class: '10th',
    batch: 'Class 10th - Board Target & Mathematics Mastery',
    testDate: new Date('2026-09-06'),
    startTime: '10:00 AM',
    durationMinutes: 60,
    subject: 'Mathematics',
    topicsCovered: 'Euclid Division, Fundamental Theorem of Arithmetic, Zeroes of Polynomials',
    maxMarks: 50,
    passingMarks: 20,
    instructions: 'Section A: 10 MCQs, Section B: 5 Short Answer, Section C: 5 Long Problems',
    status: 'completed',
    createdBy: adminVikas._id,
  })

  const t2 = await WeeklyTest.create({
    title: 'Weekly Test 2: Quadratic Equations & Arithmetic Progressions',
    class: '10th',
    batch: 'Class 10th - Board Target & Mathematics Mastery',
    testDate: new Date('2026-09-13'),
    startTime: '10:00 AM',
    durationMinutes: 60,
    subject: 'Mathematics',
    topicsCovered: 'Quadratic Formula, Nature of Roots, nth Term & Sum of AP series',
    maxMarks: 50,
    passingMarks: 20,
    status: 'completed',
    createdBy: adminVikas._id,
  })

  const t3 = await WeeklyTest.create({
    title: 'Weekly Test 3: Limits, Continuity & Derivatives',
    class: '+2',
    batch: 'Class +2 (12th) - Board Excellence & Competitive Math',
    testDate: new Date('2026-09-14'),
    startTime: '11:00 AM',
    durationMinutes: 75,
    subject: 'Mathematics',
    topicsCovered: 'Product Rule, Quotient Rule, Chain Rule, Logarithmic Differentiation',
    maxMarks: 50,
    passingMarks: 20,
    status: 'completed',
    createdBy: adminVikas._id,
  })

  await TestResult.create([
    {
      testId: t1._id,
      studentId: createdStudents[0]._id, // Diya
      attendance: 'present',
      marksObtained: 48,
      maxMarks: 50,
      passingMarks: 20,
      percentage: 96,
      result: 'pass',
      remarks: 'Outstanding work! Full marks in Section A & C. Minor step omission in Q14.',
    },
    {
      testId: t2._id,
      studentId: createdStudents[0]._id, // Diya
      attendance: 'present',
      marksObtained: 49,
      maxMarks: 50,
      passingMarks: 20,
      percentage: 98,
      result: 'pass',
      remarks: 'Flawless solution of the quadratic discriminant and AP sum problem.',
    },
    {
      testId: t3._id,
      studentId: createdStudents[1]._id, // Aarav
      attendance: 'present',
      marksObtained: 46,
      maxMarks: 50,
      passingMarks: 20,
      percentage: 92,
      result: 'pass',
      remarks: 'Very strong calculus application. Chain rule steps well presented.',
    },
  ])
  console.log('Weekly tests and student results seeded')

  // 7. Math Notes & Materials
  await Material.create([
    {
      title: 'Class 10th Math: Complete Formula Sheet & Trigonometry Tables',
      class: '10th',
      batch: 'Class 10th - Board Target & Mathematics Mastery',
      topic: 'Trigonometry & Quadratic Equations',
      chapter: 'Trigonometry & Quadratic Equations',
      description: 'KEY MATHEMATICAL FORMULAS & THEOREMS for Class 10 Board Examinations.',
      type: 'formula_sheet',
      filePath: '/materials/Class10_Math_Formula_CheatSheet_VanitaClasses.pdf',
      fileName: 'Class10_Math_Formula_CheatSheet_VanitaClasses.pdf',
      uploadedBy: adminVikas._id,
      isActive: true,
    },
    {
      title: 'Class +2 (12th) Math: Calculus & Standard Derivatives Reference',
      class: '+2',
      batch: 'Class +2 (12th) - Board Excellence & Competitive Math',
      topic: 'Differential Calculus & Chain Rule',
      chapter: 'Differential Calculus',
      description: 'DIFFERENTIATION ESSENTIALS FOR BOARD & JEE.',
      type: 'notes',
      filePath: '/materials/Class12_Differentiation_Mastery_VanitaClasses.pdf',
      fileName: 'Class12_Differentiation_Mastery_VanitaClasses.pdf',
      uploadedBy: adminVikas._id,
      isActive: true,
    },
  ])
  console.log('Math Notes and Formula Sheets seeded')

  // 8. Contact Inquiries (Admissions)
  await ContactInquiry.create([
    {
      name: 'Amanpreet Singh',
      parentName: 'Gurpreet Singh',
      phone: '98144-55667',
      class: '10th',
      school: 'St. Xavier Senior Secondary School, Bathinda',
      preferredBatch: 'Evening (5:00 PM)',
      message: 'Looking for Class 10 Board preparation batch and weekly test series.',
      status: 'new',
    },
    {
      name: 'Navya Garg',
      parentName: 'Sanjay Garg',
      phone: '98722-33445',
      class: '+1',
      school: 'DAV Public School, Bathinda',
      preferredBatch: 'Evening (5:00 PM)',
      message: 'Enquiry for Class 11 Non-Medical Mathematics by Vanita Rani Gupta.',
      status: 'contacted',
    },
  ])
  console.log('Admission inquiries seeded')

  console.log('\n✅ Database seeding successfully completed with real VMC dataset!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Error seeding database:', err)
  process.exit(1)
})

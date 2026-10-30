import dns from 'node:dns'
dns.setServers(['8.8.8.8', '1.1.1.1'])
import dotenv from 'dotenv'
dotenv.config({ path: './backend/.env' })
import mongoose from 'mongoose'
import assert from 'node:assert/strict'
import User from './models/User.js'
import Student from './models/Student.js'
import Payment from './models/Payment.js'
import WeeklyTest from './models/WeeklyTest.js'
import TestResult from './models/TestResult.js'
import ContactInquiry from './models/ContactInquiry.js'
import { CLASS_PRICING, normalizeStandard } from './config/pricing.js'
import { getDashboardStats } from './controllers/adminController.js'
import {
  buildFeeReminderMessage,
  buildFeeReceiptMessage,
  createDirectWhatsAppLink,
} from './services/whatsappService.js'

async function runE2ESuite() {
  console.log('\n=============================================================')
  console.log('🧪 VMC FULL-SUITE E2E INTEGRATION & VERIFICATION TEST')
  console.log('=============================================================\n')

  const mongoUri = process.env.MONGODB_URI
  assert.ok(mongoUri, 'MONGODB_URI must be present in backend/.env')

  await mongoose.connect(mongoUri, { dbName: 'vanita-maths' })
  console.log('✅ Connected to MongoDB database: vanita-maths')

  // Clean any previous test artifacts
  await Student.deleteMany({ email: /@vmctest\.local$/ })
  await User.deleteMany({ email: /@vmctest\.local$/ })
  await WeeklyTest.deleteMany({ title: /^E2E / })

  try {
    // -------------------------------------------------------------
    // Test 1: Authoritative Standard Pricing
    // -------------------------------------------------------------
    console.log('\n--- 1. Authoritative Pricing Table Verification ---')
    assert.equal(CLASS_PRICING['8th'], 1800, 'Class 8th must be ₹1,800')
    assert.equal(CLASS_PRICING['9th'], 2000, 'Class 9th must be ₹2,000')
    assert.equal(CLASS_PRICING['10th'], 2500, 'Class 10th must be ₹2,500')
    assert.equal(CLASS_PRICING['+1'], 3000, 'Class +1 must be ₹3,000')
    assert.equal(CLASS_PRICING['+2'], 3500, 'Class +2 must be ₹3,500')
    console.log('✅ Central pricing verified for all 5 standards: ₹1800, ₹2000, ₹2500, ₹3000, ₹3500')

    // -------------------------------------------------------------
    // Test 2: Admin Dashboard Controller (Zero ReferenceErrors)
    // -------------------------------------------------------------
    console.log('\n--- 2. Admin Dashboard Stats Query & Serialization ---')
    let dashboardResponse = null
    const req = { query: {}, user: { role: 'admin' } }
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this },
      json(payload) {
        dashboardResponse = payload
        return this
      }
    }
    let errorCaught = null
    const next = (err) => { errorCaught = err }

    await getDashboardStats(req, res, next)
    assert.equal(errorCaught, null, `Dashboard query failed: ${errorCaught?.message}`)
    assert.ok(dashboardResponse?.success, 'Dashboard response must have success: true')
    assert.ok(Array.isArray(dashboardResponse?.data?.classCounts), 'classCounts must be an array')
    assert.ok(Array.isArray(dashboardResponse?.data?.recentReceipts), 'recentReceipts must be an array')
    assert.ok(dashboardResponse?.data?.recentPayments !== undefined, 'recentPayments alias must be defined')
    console.log('✅ Dashboard stats computed successfully from live DB:')
    console.log(`   - Total Students: ${dashboardResponse.data.totalStudents}`)
    console.log(`   - Active Students: ${dashboardResponse.data.activeStudents}`)
    console.log(`   - Scheduled Tests: ${dashboardResponse.data.weeklyTestsScheduled}`)
    console.log(`   - Completed Tests: ${dashboardResponse.data.weeklyTestsCompleted}`)

    // -------------------------------------------------------------
    // Test 3: Temporary Student Creation with Authoritative Pricing
    // -------------------------------------------------------------
    console.log('\n--- 3. Student Enrollment & Dues Calculation ---')
    const testEmail = `test_student_${Date.now()}@vmctest.local`
    const testUser = await User.create({
      name: 'E2E Test Student',
      email: testEmail,
      username: `teststud_${Date.now()}`,
      password: 'TestPassword@123',
      role: 'student',
      status: 'active',
    })

    const standard = '10th'
    const standardMonthlyFee = CLASS_PRICING[standard] // 2500
    const annualTotal = standardMonthlyFee * 10 // 25000
    const testRollNo = `STD10-${new Date().getFullYear()}-999`

    const testStudent = await Student.create({
      studentId: testRollNo,
      userId: testUser._id,
      fullName: 'E2E Test Student',
      email: testEmail,
      phone: '9815962000',
      parentName: 'Mr. Test Parent',
      parentPhone: '9815962001',
      class: standard,
      batch: 'Evening',
      monthlyFee: standardMonthlyFee,
      totalFee: annualTotal,
      paidFee: 0,
      feeStatus: 'pending',
    })

    assert.equal(testStudent.monthlyFee, 2500)
    assert.equal(testStudent.totalFee, 25000)
    assert.equal(testStudent.pendingFee, 25000)
    console.log(`✅ Student created: ${testStudent.fullName} (${testStudent.studentId}) with monthly fee ₹${testStudent.monthlyFee}`)

    // -------------------------------------------------------------
    // Test 4: One-Click Fee Reminder WhatsApp URL Generator
    // -------------------------------------------------------------
    console.log('\n--- 4. Fee Reminder Message & Link Generation ---')
    const reminderMsg = buildFeeReminderMessage({
      studentName: testStudent.fullName,
      studentId: testStudent.studentId,
      studentClass: testStudent.class,
      month: 'October 2026',
      pendingAmount: testStudent.pendingFee,
    })
    assert.ok(reminderMsg.includes(testStudent.fullName))
    assert.ok(reminderMsg.includes('25,000'))
    assert.ok(reminderMsg.includes('98159-62612'))

    const waLink = createDirectWhatsAppLink(testStudent.parentPhone, reminderMsg)
    assert.ok(waLink.startsWith('https://wa.me/919815962001?text='))
    console.log('✅ WhatsApp fee reminder URL generated correctly:')
    console.log(`   ${waLink.slice(0, 75)}...`)

    // -------------------------------------------------------------
    // Test 5: Fee Payment Recording & Balance Decrement
    // -------------------------------------------------------------
    console.log('\n--- 5. Payment Recording & Dynamic Dues Update ---')
    const paymentAmount = 2500
    const testPayment = await Payment.create({
      receiptNumber: `VMC-REC-${Date.now()}`,
      studentId: testStudent._id,
      amount: paymentAmount,
      month: 'October 2026',
      paymentMethod: 'cash',
      approvalStatus: 'approved',
      createdBy: testUser._id,
      notes: 'October monthly tuition installment',
    })

    testStudent.paidFee = (testStudent.paidFee || 0) + paymentAmount
    testStudent.feeStatus = testStudent.paidFee >= testStudent.totalFee ? 'paid' : 'partial'
    await testStudent.save()

    assert.equal(testStudent.paidFee, 2500)
    assert.equal(testStudent.pendingFee, 22500)
    assert.equal(testStudent.feeStatus, 'partial')
    console.log(`✅ Payment of ₹${paymentAmount} recorded. New balance: ₹${testStudent.pendingFee} (Status: ${testStudent.feeStatus})`)

    // -------------------------------------------------------------
    // Test 6: Fee Receipt WhatsApp Message
    // -------------------------------------------------------------
    console.log('\n--- 6. Fee Receipt WhatsApp Formatter ---')
    const receiptMsg = buildFeeReceiptMessage({
      studentName: testStudent.fullName,
      studentId: testStudent.studentId,
      studentClass: testStudent.class,
      receiptNumber: testPayment.receiptNumber,
      amountPaid: testPayment.amount,
      paymentMethod: 'Cash',
      date: '30 Oct 2026',
      remainingBalance: testStudent.pendingFee,
    })
    assert.ok(receiptMsg.includes(testPayment.receiptNumber))
    assert.ok(receiptMsg.includes('₹2,500'))
    assert.ok(receiptMsg.includes('₹22,500'))
    console.log('✅ Receipt message formatted with accurate payment and balance numbers')

    // -------------------------------------------------------------
    // Test 7: Weekly Test Creation & Marks Entry
    // -------------------------------------------------------------
    console.log('\n--- 7. Weekly Test Creation, Scoring & Pass/Fail Metrics ---')
    const testObj = await WeeklyTest.create({
      title: 'E2E Quadratic Equations & AP Test',
      class: standard,
      batch: 'All Batches',
      testDate: new Date(),
      startTime: '10:00 AM',
      topicsCovered: 'Quadratic equations roots and arithmetic progression nth term',
      maxMarks: 50,
      passingMarks: 20,
      status: 'scheduled',
      createdBy: testUser._id,
    })

    // Add marks result for the student: 42 / 50 -> 84% -> Passed
    const marksObtained = 42
    const percentage = Number(((marksObtained / testObj.maxMarks) * 100).toFixed(1))
    const resultStatus = marksObtained >= testObj.passingMarks ? 'pass' : 'fail'

    const testResult = await TestResult.create({
      testId: testObj._id,
      studentId: testStudent._id,
      attendance: 'present',
      marksObtained,
      maxMarks: testObj.maxMarks,
      passingMarks: testObj.passingMarks,
      percentage,
      result: resultStatus,
      remarks: 'Excellent mastery of quadratic roots and word problems!',
    })

    assert.equal(testResult.percentage, 84.0)
    assert.equal(testResult.result, 'pass')
    console.log(`✅ Test scheduled: "${testObj.title}"`)
    console.log(`   Marks saved for student: ${marksObtained}/50 (${percentage}%) -> ${resultStatus.toUpperCase()}`)

    // -------------------------------------------------------------
    // Test 8: Cleanup Test Records
    // -------------------------------------------------------------
    console.log('\n--- 8. Database Clean-up of Transient Test Records ---')
    await TestResult.deleteOne({ _id: testResult._id })
    await WeeklyTest.deleteOne({ _id: testObj._id })
    await Payment.deleteOne({ _id: testPayment._id })
    await Student.deleteOne({ _id: testStudent._id })
    await User.deleteOne({ _id: testUser._id })
    console.log('✅ Transient records cleaned up cleanly from database.')

    console.log('\n=============================================================')
    console.log('🎉 ALL 8 E2E INTEGRATION & CROSS-MODULE TESTS PASSED 100%!')
    console.log('=============================================================\n')
  } finally {
    await mongoose.disconnect()
  }
}

runE2ESuite().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err)
  process.exit(1)
})

import Settings from '../models/Settings.js'
import Batch from '../models/Batch.js'
import Student from '../models/Student.js'
import Payment from '../models/Payment.js'
import Fee from '../models/Fee.js'
import Attendance from '../models/Attendance.js'
import User from '../models/User.js'
import Material from '../models/Material.js'
import Announcement from '../models/Announcement.js'
import ContactInquiry from '../models/ContactInquiry.js'
import WeeklyTest from '../models/WeeklyTest.js'
import TestResult from '../models/TestResult.js'
import AuditLog from '../models/AuditLog.js'
import { sendResponse, createError } from '../utils/helpers.js'
import { getWhatsAppStatus, createDirectWhatsAppLink, buildFeeReminderMessage } from '../services/whatsappService.js'
import { getEmailStatus } from '../services/emailService.js'

/**
 * PHASE 4: Admin Tuition Management Dashboard
 * All values computed strictly from the MongoDB database.
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date()
    const selectedMonth = req.query.month // optional e.g. "2026-10"
    let startOfMonth, endOfMonth

    if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) {
      const [y, m] = selectedMonth.split('-').map(Number)
      startOfMonth = new Date(y, m - 1, 1)
      endOfMonth = new Date(y, m, 0, 23, 59, 59)
    } else {
      startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    const [
      activeStudents,
      totalStudents,
      monthlyFeesAgg,
      allTimeRevenueAgg,
      newEnquiriesCount,
      notesCount,
      scheduledTestsCount,
      completedTestsCount,
      classDistributionAgg,
      pendingStudents,
      recentReceipts,
      upcomingTests,
      latestTest,
      recentEnquiries,
      recentNotes,
      attendanceThisMonthAgg,
    ] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      Student.countDocuments(),
      // Fees collected in the selected month
      Payment.aggregate([
        { $match: { paymentDate: { $gte: startOfMonth, $lte: endOfMonth }, approvalStatus: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // All time fees collected
      Payment.aggregate([
        { $match: { approvalStatus: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      ContactInquiry.countDocuments({ status: 'new' }),
      Material.countDocuments({ isActive: true }),
      WeeklyTest.countDocuments({ status: 'scheduled' }),
      WeeklyTest.countDocuments({ status: 'completed' }),
      // Class-wise active student counts
      Student.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$class', count: { $sum: 1 } } }
      ]),
      // Students with pending dues
      Student.find({
        status: 'active',
        $expr: { $gt: [{ $subtract: ['$totalFee', '$paidFee'] }, 0] }
      })
        .select('studentId fullName class batch parentName parentPhone phone totalFee paidFee feeStatus')
        .sort({ totalFee: -1 })
        .limit(10),
      // Recent fee receipts
      Payment.find({ approvalStatus: 'approved' })
        .populate('studentId', 'fullName studentId class batch phone')
        .sort({ paymentDate: -1 })
        .limit(6),
      // Upcoming tests
      WeeklyTest.find({ status: 'scheduled', testDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
        .sort({ testDate: 1 })
        .limit(5),
      // Latest test
      WeeklyTest.findOne().sort({ testDate: -1 }),
      // Recent enquiries
      ContactInquiry.find().sort({ createdAt: -1 }).limit(5),
      // Recent notes
      Material.find({ isActive: true }).sort({ createdAt: -1 }).limit(5),
      // Attendance percentage this month
      Attendance.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } } } }
      ]),
    ])

    // Calculate total outstanding balance
    const outstandingAgg = await Student.aggregate([
      { $match: { status: 'active' } },
      { $project: { balance: { $max: [0, { $subtract: ['$totalFee', '$paidFee'] }] } } },
      { $group: { _id: null, totalOutstanding: { $sum: '$balance' }, pendingCount: { $sum: { $cond: [{ $gt: ['$balance', 0] }, 1, 0] } } } }
    ])

    const totalOutstandingFee = outstandingAgg[0]?.totalOutstanding || 0
    const studentsWithPendingDuesCount = outstandingAgg[0]?.pendingCount || 0
    const feesCollectedInMonth = monthlyFeesAgg[0]?.total || 0
    const totalCollectedAllTime = allTimeRevenueAgg[0]?.total || 0

    // Format class counts: 8th, 9th, 10th, +1, +2
    const standardClassList = ['8th', '9th', '10th', '+1', '+2']
    const classCountMap = new Map(classDistributionAgg.map(c => [String(c._id).trim(), c.count]))
    const classCounts = standardClassList.map(cls => ({
      class: cls,
      count: classCountMap.get(cls) ||
        classCountMap.get(cls.replace('+', '11th')) ||
        classCountMap.get(cls.replace('+', '12th')) ||
        classCountMap.get(`Class ${cls}`) || 0,
    }))

    // Add any other classes found in DB
    for (const [cls, cnt] of classCountMap.entries()) {
      if (!standardClassList.includes(cls) && !classCounts.some(c => c.class === cls)) {
        classCounts.push({ class: cls, count: cnt })
      }
    }

    // Enrich pending fee dues with one-click WhatsApp reminder link
    const pendingFeeDues = pendingStudents.map(s => {
      const pendingAmount = Math.max(0, (s.totalFee || 0) - (s.paidFee || 0))
      const targetPhone = s.parentPhone || s.phone
      const currentMonthName = startOfMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      const reminderText = buildFeeReminderMessage({
        studentName: s.fullName,
        studentId: s.studentId,
        studentClass: s.class,
        month: currentMonthName,
        pendingAmount,
      })

      return {
        _id: s._id,
        studentId: s.studentId,
        fullName: s.fullName,
        class: s.class,
        batch: s.batch,
        totalFee: s.totalFee,
        paidFee: s.paidFee,
        pendingAmount,
        parentPhone: targetPhone,
        whatsappLink: createDirectWhatsAppLink(targetPhone, reminderText),
      }
    })

    const attendanceRate = attendanceThisMonthAgg[0]?.total
      ? Math.round((attendanceThisMonthAgg[0].present / attendanceThisMonthAgg[0].total) * 100)
      : 100

    sendResponse(res, 200, {
      activeStudents,
      totalStudents,
      feesCollectedThisMonth: feesCollectedInMonth,
      totalCollectedAllTime,
      totalOutstandingFee,
      studentsWithPendingDuesCount,
      newEnquiriesCount,
      weeklyTestsScheduled: scheduledTestsCount,
      weeklyTestsCompleted: completedTestsCount,
      uploadedNotesCount: notesCount,
      attendanceRate,
      classCounts,
      pendingFeeDues,
      recentReceipts,
      recentPayments: recentReceipts,
      upcomingTests,
      latestTest,
      recentEnquiries,
      recentNotes,
      selectedMonthLabel: startOfMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      integrations: {
        whatsapp: getWhatsAppStatus(),
        email: getEmailStatus(),
      },
    })
  } catch (err) {
    next(err)
  }
}

export const getReports = async (req, res, next) => {
  try {
    const [monthlyFeeCollection, classStrength] = await Promise.all([
      Payment.aggregate([
        { $match: { approvalStatus: 'approved' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 12 }
      ]),
      Student.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$class', count: { $sum: 1 } } }
      ])
    ])

    sendResponse(res, 200, { monthlyFeeCollection, classStrength })
  } catch (err) {
    next(err)
  }
}

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
    const total = await AuditLog.countDocuments()

    sendResponse(res, 200, { logs, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne()
    if (!settings) {
      settings = await Settings.create({})
    }
    sendResponse(res, 200, settings, 'Settings retrieved successfully')
  } catch (err) {
    next(err)
  }
}

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne()
    if (!settings) {
      settings = new Settings(req.body)
    } else {
      Object.assign(settings, req.body)
    }
    await settings.save()
    sendResponse(res, 200, settings, 'Settings updated successfully')
  } catch (err) {
    next(err)
  }
}

export const exportAllData = async (req, res, next) => {
  try {
    const [students, batches, payments, fees, tests, marks, materials, enquiries, settings] = await Promise.all([
      Student.find().lean(),
      Batch.find().lean(),
      Payment.find().lean(),
      Fee.find().lean(),
      WeeklyTest.find().lean(),
      TestResult.find().lean(),
      Material.find().lean(),
      ContactInquiry.find().lean(),
      Settings.findOne().lean(),
    ])

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      data: {
        students,
        batches,
        payments,
        fees,
        tests,
        marks,
        materials,
        enquiries,
        settings: settings || {}
      }
    }

    sendResponse(res, 200, backup, 'Complete backup generated successfully')
  } catch (err) {
    next(err)
  }
}

export const importAllData = async (req, res, next) => {
  try {
    const { data } = req.body
    if (!data) return next(createError(400, 'Invalid backup data'))

    if (Array.isArray(data.batches) && data.batches.length > 0) {
      await Batch.deleteMany({})
      await Batch.insertMany(data.batches)
    }
    if (data.settings) {
      await Settings.deleteMany({})
      await Settings.create(data.settings)
    }

    sendResponse(res, 200, null, 'Data restored successfully')
  } catch (err) {
    next(err)
  }
}


export const transitionAcademicYear = async (req, res, next) => {
  try {
    const { nextAcademicYear } = req.body
    if (!nextAcademicYear) return next(createError(400, 'New academic year is required'))

    let settings = await Settings.findOne()
    if (!settings) settings = await Settings.create({})
    const oldYear = settings.academicYear || '2026-2027'

    const allStudents = await Student.find({ status: { $in: ['active', 'pending'] } })
    const results = {
      promoted: [],
      graduatedAlumni: [],
      blockedDueToFees: [],
    }

    const NEXT_CLASS_MAP = {
      '8th': { next: '9th', fee: 2000 },
      '8th Class': { next: '9th Class', fee: 2000 },
      'Class 8th': { next: 'Class 9th', fee: 2000 },
      'Class 8th Mathematics': { next: 'Class 9th Mathematics', fee: 2000 },
      '9th': { next: '10th', fee: 2500 },
      '9th Class': { next: '10th Class', fee: 2500 },
      'Class 9th': { next: 'Class 10th', fee: 2500 },
      'Class 9th Mathematics': { next: 'Class 10th Mathematics', fee: 2500 },
      '10th': { next: '+1 (11th) Mathematics', fee: 3000 },
      '10th Class': { next: '+1 (11th) Mathematics', fee: 3000 },
      'Class 10th': { next: '+1 (11th) Mathematics', fee: 3000 },
      'Class 10th Mathematics': { next: '+1 (11th) Mathematics', fee: 3000 },
      '+1': { next: '+2 (12th) Mathematics', fee: 3500 },
      '+1 (11th)': { next: '+2 (12th) Mathematics', fee: 3500 },
      '+1 (11th) Mathematics': { next: '+2 (12th) Mathematics', fee: 3500 },
      '11th': { next: '+2 (12th) Mathematics', fee: 3500 },
      '+2': { next: 'alumni', fee: 0 },
      '+2 (12th)': { next: 'alumni', fee: 0 },
      '+2 (12th) Mathematics': { next: 'alumni', fee: 0 },
      '+2 (12th Board)': { next: 'alumni', fee: 0 },
      '12th': { next: 'alumni', fee: 0 },
    }

    for (const student of allStudents) {
      // Calculate pending fee balance
      const pendingFee = Math.max(0, (student.totalFee || 0) - (student.paidFee || 0))
      if (pendingFee > 0) {
        results.blockedDueToFees.push({
          studentId: student.studentId,
          name: student.fullName,
          class: student.class,
          pendingFee,
        })
        continue // Cannot move to new academic year until fees are cleared
      }

      const currentClassKey = String(student.class || student.grade || '').trim()
      const target = NEXT_CLASS_MAP[currentClassKey] || {
        next: currentClassKey.includes('10') ? '+1 (11th) Mathematics' : currentClassKey.includes('+1') ? '+2 (12th) Mathematics' : 'alumni',
        fee: currentClassKey.includes('10') ? 3000 : currentClassKey.includes('+1') ? 3500 : 0
      }

      if (target.next === 'alumni' || currentClassKey.includes('12') || currentClassKey.includes('+2')) {
        student.status = 'alumni'
        student.notes = `${student.notes || ''} [Alumni - Graduated session ${oldYear}]`.trim()
        student.monthlyFee = 0
        await student.save()
        results.graduatedAlumni.push({
          studentId: student.studentId,
          name: student.fullName,
          fromClass: currentClassKey,
        })
      } else {
        student.class = target.next
        student.grade = target.next
        student.monthlyFee = target.fee
        student.academicYear = nextAcademicYear
        student.totalFee = 0
        student.paidFee = 0
        student.feeStatus = 'pending'
        await student.save()
        results.promoted.push({
          studentId: student.studentId,
          name: student.fullName,
          fromClass: currentClassKey,
          toClass: target.next,
          newMonthlyFee: target.fee,
        })
      }
    }

    // Archive previous year notes / materials so old notes are unavailable for new session while keeping full restore capability
    await Material.updateMany(
      { isActive: true },
      { $set: { isActive: false, isArchived: true, sessionYear: oldYear } }
    )

    // Update settings
    settings.academicYear = nextAcademicYear
    await settings.save()

    sendResponse(res, 200, {
      settings,
      results,
      message: `Academic year transitioned to ${nextAcademicYear}. ${results.promoted.length} students promoted, ${results.graduatedAlumni.length} students graduated to Alumni. ${results.blockedDueToFees.length} students held back due to uncleared fees.`
    })
  } catch (err) {
    next(err)
  }
}

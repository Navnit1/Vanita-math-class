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
      recentPayments,
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

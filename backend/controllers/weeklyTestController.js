import WeeklyTest from '../models/WeeklyTest.js'
import TestResult from '../models/TestResult.js'
import Student from '../models/Student.js'
import Announcement from '../models/Announcement.js'
import { createError, sendResponse, paginate } from '../utils/helpers.js'
import { recordAudit } from '../utils/auditLog.js'
import logger from '../utils/logger.js'
import {
  sendMetaWhatsAppMessage,
  createDirectWhatsAppLink,
  buildTestAnnouncementMessage
} from '../services/whatsappService.js'

/**
 * PHASE 6: Schedule Weekly Test
 */
export const scheduleWeeklyTest = async (req, res, next) => {
  try {
    const {
      title, class: cls, batch, testDate, startTime, endTime,
      durationMinutes, subject, topicsCovered, maxMarks, passingMarks,
      instructions, announcementText, notifyWhatsApp
    } = req.body

    if (!title || !cls || !testDate || !startTime || !topicsCovered || maxMarks == null || passingMarks == null) {
      return next(createError(400, 'Title, class, test date, start time, topics, max marks, and passing marks are required.'))
    }

    const nMaxMarks = Number(maxMarks)
    const nPassingMarks = Number(passingMarks)

    if (nMaxMarks <= 0) {
      return next(createError(400, 'Maximum marks must be greater than zero.'))
    }

    if (nPassingMarks > nMaxMarks) {
      return next(createError(400, 'Passing marks cannot exceed maximum marks.'))
    }

    if (nPassingMarks < 0) {
      return next(createError(400, 'Passing marks cannot be negative.'))
    }

    const targetBatch = batch || 'All Batches'

    const test = await WeeklyTest.create({
      title: title.trim(),
      class: cls.trim(),
      batch: targetBatch,
      testDate: new Date(testDate),
      startTime: startTime.trim(),
      endTime: (endTime || '').trim(),
      durationMinutes: Number(durationMinutes || 60),
      subject: (subject || 'Mathematics').trim(),
      topicsCovered: topicsCovered.trim(),
      maxMarks: nMaxMarks,
      passingMarks: nPassingMarks,
      instructions: (instructions || '').trim(),
      announcementText: (announcementText || '').trim(),
      status: 'scheduled',
      createdBy: req.user._id,
    })

    // Publish targeted announcement for this exact class and batch
    const formattedDate = new Date(testDate).toLocaleDateString('en-IN', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    })

    const noticeContent = announcementText?.trim() ||
      `Weekly Mathematics Test on "${topicsCovered.trim()}".\nDate: ${formattedDate} at ${startTime}.\nMax Marks: ${nMaxMarks} | Passing Marks: ${nPassingMarks}.\n${instructions ? `Instructions: ${instructions}` : 'Please be punctual.'}`

    await Announcement.create({
      title: `Weekly Test: ${title.trim()} (Class ${cls})`,
      content: noticeContent,
      audience: 'students',
      priority: 'high',
      class: cls.trim(),
      batch: targetBatch === 'All Batches' ? null : targetBatch,
      testId: test._id,
      createdBy: req.user._id,
    })

    // Optional WhatsApp notification
    if (notifyWhatsApp) {
      const targetFilter = { class: cls.trim(), status: 'active' }
      if (targetBatch !== 'All Batches') targetFilter.batch = targetBatch
      const students = await Student.find(targetFilter).select('phone parentPhone')

      const messageText = buildTestAnnouncementMessage({
        testTitle: title.trim(),
        studentClass: cls.trim(),
        batch: targetBatch,
        testDate: formattedDate,
        startTime: startTime.trim(),
        maxMarks: nMaxMarks,
        topicsCovered: topicsCovered.trim(),
      })

      for (const s of students) {
        const dest = s.parentPhone || s.phone
        if (dest) {
          sendMetaWhatsAppMessage({ to: dest, text: messageText }).catch(() => {})
        }
      }
    }

    recordAudit({
      action: 'weekly_test.create',
      user: req.user,
      targetType: 'WeeklyTest',
      targetId: test._id,
      description: `Scheduled weekly test "${title}" for Class ${cls} (${targetBatch})`,
      req,
    })

    sendResponse(res, 201, test, 'Weekly test scheduled and announced successfully.')
  } catch (err) {
    next(err)
  }
}

/**
 * Get all weekly tests (searchable/filterable)
 */
export const getWeeklyTests = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, class: cls, batch, status, search } = req.query
    const filter = {}
    if (cls) filter.class = cls
    if (batch && batch !== 'All Batches') filter.batch = { $in: [batch, 'All Batches'] }
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topicsCovered: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ]
    }

    const { skip, limit: lim } = paginate(null, page, limit)
    const [tests, total] = await Promise.all([
      WeeklyTest.find(filter)
        .populate('createdBy', 'name')
        .sort({ testDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(lim),
      WeeklyTest.countDocuments(filter),
    ])

    // Attach graded status for each test
    const testIds = tests.map(t => t._id)
    const resultsCount = await TestResult.aggregate([
      { $match: { testId: { $in: testIds } } },
      { $group: { _id: '$testId', gradedCount: { $sum: 1 }, presentCount: { $sum: { $cond: [{ $eq: ['$attendance', 'present'] }, 1, 0] } } } }
    ])
    const countMap = new Map(resultsCount.map(r => [String(r._id), r]))

    const enriched = tests.map(t => {
      const obj = t.toObject()
      const stats = countMap.get(String(t._id)) || { gradedCount: 0, presentCount: 0 }
      obj.gradedCount = stats.gradedCount
      obj.presentCount = stats.presentCount
      return obj
    })

    sendResponse(res, 200, { tests: enriched, total, page: parseInt(page), pages: Math.ceil(total / lim) })
  } catch (err) {
    next(err)
  }
}

/**
 * Get Test Sheet for marks entry: loads test + class roster with any existing marks
 */
export const getTestSheet = async (req, res, next) => {
  try {
    const { id } = req.params
    const test = await WeeklyTest.findById(id).populate('createdBy', 'name')
    if (!test) return next(createError(404, 'Weekly test not found'))

    // Load active students belonging to test's class and batch
    const studentFilter = { class: test.class, status: 'active' }
    if (test.batch && test.batch !== 'All Batches') {
      studentFilter.batch = test.batch
    }

    const students = await Student.find(studentFilter)
      .select('studentId fullName class batch phone parentPhone profilePhoto')
      .sort({ studentId: 1, fullName: 1 })

    // Load existing results
    const results = await TestResult.find({ testId: test._id })
    const resultMap = new Map(results.map(r => [String(r.studentId), r]))

    // Build spreadsheet rows
    let presentCount = 0
    let absentCount = 0
    let gradedCount = 0
    let passCount = 0
    let failCount = 0
    let totalMarksPresent = 0
    let highestMarks = 0

    const rows = students.map(s => {
      const resDoc = resultMap.get(String(s._id))
      const attendance = resDoc ? resDoc.attendance : 'present'
      const marksObtained = resDoc ? resDoc.marksObtained : null
      const percentage = resDoc ? resDoc.percentage : null
      const result = resDoc ? resDoc.result : (attendance === 'absent' ? 'absent' : null)
      const remarks = resDoc ? resDoc.remarks : ''

      if (resDoc) {
        gradedCount++
        if (attendance === 'absent') {
          absentCount++
        } else {
          presentCount++
          if (marksObtained != null) {
            totalMarksPresent += marksObtained
            if (marksObtained > highestMarks) highestMarks = marksObtained
          }
          if (result === 'pass') passCount++
          else if (result === 'fail') failCount++
        }
      }

      return {
        studentId: s._id,
        rollNumber: s.studentId,
        studentName: s.fullName,
        class: s.class,
        batch: s.batch,
        attendance,
        maxMarks: test.maxMarks,
        passingMarks: test.passingMarks,
        marksObtained,
        percentage,
        result,
        remarks,
        isSaved: Boolean(resDoc),
      }
    })

    const averageMarks = presentCount > 0 ? Number((totalMarksPresent / presentCount).toFixed(1)) : 0

    const summary = {
      expected: students.length,
      present: presentCount,
      absent: absentCount,
      graded: gradedCount,
      highestMarks: presentCount > 0 ? highestMarks : 0,
      averageMarks,
      passCount,
      failCount,
    }

    sendResponse(res, 200, { test, rows, summary })
  } catch (err) {
    next(err)
  }
}

/**
 * Save / Update marks spreadsheet
 */
export const saveTestMarks = async (req, res, next) => {
  try {
    const { id } = req.params
    const test = await WeeklyTest.findById(id)
    if (!test) return next(createError(404, 'Weekly test not found'))

    const { marksList } = req.body
    if (!Array.isArray(marksList) || marksList.length === 0) {
      return next(createError(400, 'Marks list must be a non-empty array.'))
    }

    const bulkOps = []
    let presentCount = 0
    let absentCount = 0
    let passCount = 0
    let failCount = 0
    let highestMarks = 0
    let totalMarks = 0

    for (const item of marksList) {
      const { studentId, attendance, marksObtained, remarks } = item
      if (!studentId) continue

      const isAbsent = attendance === 'absent'
      let numMarks = null
      let percentage = null
      let result = 'absent'

      if (isAbsent) {
        absentCount++
        numMarks = null
        percentage = null
        result = 'absent'
      } else {
        presentCount++
        numMarks = marksObtained != null && marksObtained !== '' ? Number(marksObtained) : 0

        if (numMarks < 0 || numMarks > test.maxMarks) {
          return next(createError(400, `Marks for student must be between 0 and ${test.maxMarks}. Received: ${numMarks}`))
        }

        percentage = Number(((numMarks / test.maxMarks) * 100).toFixed(1))
        result = numMarks >= test.passingMarks ? 'pass' : 'fail'

        if (result === 'pass') passCount++
        else failCount++

        if (numMarks > highestMarks) highestMarks = numMarks
        totalMarks += numMarks
      }

      bulkOps.push({
        updateOne: {
          filter: { testId: test._id, studentId },
          update: {
            $set: {
              testId: test._id,
              studentId,
              attendance: isAbsent ? 'absent' : 'present',
              marksObtained: numMarks,
              maxMarks: test.maxMarks,
              passingMarks: test.passingMarks,
              percentage,
              result,
              remarks: (remarks || '').trim(),
              gradedBy: req.user._id,
              gradedAt: new Date(),
            },
          },
          upsert: true,
        },
      })
    }

    if (bulkOps.length > 0) {
      await TestResult.bulkWrite(bulkOps)
    }

    // Mark test status as completed
    test.status = 'completed'
    await test.save()

    const averageMarks = presentCount > 0 ? Number((totalMarks / presentCount).toFixed(1)) : 0

    recordAudit({
      action: 'weekly_test.enter_marks',
      user: req.user,
      targetType: 'WeeklyTest',
      targetId: test._id,
      description: `Saved marks for weekly test "${test.title}" (${marksList.length} students processed)`,
      req,
    })

    sendResponse(res, 200, {
      summary: {
        expected: marksList.length,
        present: presentCount,
        absent: absentCount,
        graded: marksList.length,
        highestMarks,
        averageMarks,
        passCount,
        failCount,
      },
    }, 'Marks spreadsheet saved successfully.')
  } catch (err) {
    next(err)
  }
}

/**
 * PHASE 6 & 9: Student Result Privacy
 * Student gets ONLY their own test results and upcoming tests.
 * NEVER returns other students' scores.
 */
export const getMyWeeklyTestResults = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
    if (!student) return next(createError(404, 'Student profile not found'))

    // 1. Fetch own test results
    const results = await TestResult.find({ studentId: student._id })
      .populate('testId', 'title subject class batch testDate startTime endTime maxMarks passingMarks topicsCovered instructions')
      .sort({ createdAt: -1 })

    // Filter out results where test might have been removed
    const validResults = results
      .filter(r => r.testId)
      .map(r => ({
        resultId: r._id,
        testId: r.testId._id,
        title: r.testId.title,
        subject: r.testId.subject,
        class: r.testId.class,
        batch: r.testId.batch,
        testDate: r.testId.testDate,
        startTime: r.testId.startTime,
        topicsCovered: r.testId.topicsCovered,
        instructions: r.testId.instructions,
        maxMarks: r.maxMarks,
        passingMarks: r.passingMarks,
        attendance: r.attendance,
        marksObtained: r.marksObtained,
        percentage: r.percentage,
        result: r.result,
        remarks: r.remarks,
        gradedAt: r.gradedAt,
      }))

    // 2. Fetch upcoming tests for this student's class
    const upcomingTests = await WeeklyTest.find({
      class: student.class,
      status: 'scheduled',
      testDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      $or: [
        { batch: 'All Batches' },
        { batch: student.batch },
      ],
    }).sort({ testDate: 1 })

    // Summary performance stats for student
    const gradedPresent = validResults.filter(r => r.attendance === 'present' && r.percentage != null)
    const avgPercentage = gradedPresent.length > 0
      ? Number((gradedPresent.reduce((acc, r) => acc + r.percentage, 0) / gradedPresent.length).toFixed(1))
      : 0
    const passedCount = validResults.filter(r => r.result === 'pass').length

    sendResponse(res, 200, {
      results: validResults,
      upcomingTests,
      stats: {
        totalTests: validResults.length,
        passedCount,
        averagePercentage: avgPercentage,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Delete a weekly test and its results
 */
export const deleteWeeklyTest = async (req, res, next) => {
  try {
    const test = await WeeklyTest.findById(req.params.id)
    if (!test) return next(createError(404, 'Weekly test not found'))

    await Promise.all([
      WeeklyTest.findByIdAndDelete(req.params.id),
      TestResult.deleteMany({ testId: req.params.id }),
      Announcement.deleteMany({ testId: req.params.id }),
    ])

    recordAudit({
      action: 'weekly_test.delete',
      user: req.user,
      targetType: 'WeeklyTest',
      targetId: req.params.id,
      description: `Deleted weekly test "${test.title}"`,
      req,
    })

    sendResponse(res, 200, null, 'Weekly test and associated records deleted.')
  } catch (err) {
    next(err)
  }
}

/**
 * Send weekly test results via Meta WhatsApp Cloud API (with direct manual link fallback)
 * Supports single studentId or array of studentIds.
 */
export const sendTestResultWhatsApp = async (req, res, next) => {
  try {
    const { id } = req.params
    const { studentId, studentIds } = req.body

    const test = await WeeklyTest.findById(id)
    if (!test) return next(createError(404, 'Weekly test not found'))

    const targetStudentIds = studentIds || (studentId ? [studentId] : [])
    if (!targetStudentIds.length) {
      return next(createError(400, 'Please select at least one student recipient.'))
    }

    const results = await TestResult.find({
      testId: test._id,
      studentId: { $in: targetStudentIds }
    }).populate('studentId', 'fullName studentId phone parentPhone class batch')

    if (!results.length) {
      return next(createError(404, 'No test result records found for the selected students.'))
    }

    const dispatches = []

    for (const r of results) {
      const student = r.studentId
      if (!student) continue

      const targetPhone = student.parentPhone || student.phone
      if (!targetPhone) {
        dispatches.push({
          studentId: student.studentId,
          name: student.fullName,
          phone: null,
          status: 'missing_phone',
          success: false,
          directLink: null,
        })
        continue
      }

      const isAbsent = r.attendance === 'absent'
      const marksText = isAbsent ? 'Absent' : `${r.marksObtained}/${test.maxMarks} (${r.percentage}%)`
      const resultVerdict = isAbsent ? 'Absent' : (r.result ? r.result.toUpperCase() : (r.percentage >= 40 ? 'PASSED' : 'NEEDS PRACTICE'))

      const messageText = `📊 *VANITA MATH CLASSES — WEEKLY TEST RESULT*

Dear Parent / Student,
Here is the performance report for:

👤 *Student:* ${student.fullName} (Roll: ${student.studentId})
📝 *Test:* ${test.title}
📚 *Class:* Class ${test.class} (${test.batch || 'Regular'})
🎯 *Marks Scored:* ${marksText}
🏆 *Result Status:* ${resultVerdict}
${r.remarks ? `💬 *Faculty Remarks:* ${r.remarks}\n` : ''}
🌐 *Portal Details:* https://vanita-math-class.vercel.app/login

— *Vanita Rani Gupta*
Vanita Math Classes, Bathinda | 📞 98159-62612`

      const directLink = createDirectWhatsAppLink(targetPhone, messageText)

      let apiResult = { success: false, status: 'unattempted' }
      try {
        apiResult = await sendMetaWhatsAppMessage({
          to: targetPhone,
          text: messageText,
        })
      } catch (err) {
        apiResult = { success: false, status: 'api_error', message: err.message }
      }

      dispatches.push({
        studentId: student.studentId,
        name: student.fullName,
        phone: targetPhone,
        status: apiResult.status,
        success: apiResult.success,
        directLink,
      })
    }

    const successCount = dispatches.filter(d => d.success).length

    recordAudit({
      action: 'weekly_test.send_results_whatsapp',
      user: req.user,
      targetType: 'WeeklyTest',
      targetId: test._id,
      description: `Sent WhatsApp results for "${test.title}" to ${dispatches.length} students (${successCount} accepted by provider)`,
      req,
    })

    sendResponse(res, 200, {
      total: dispatches.length,
      successCount,
      dispatches,
    }, `Processed WhatsApp result notifications for ${dispatches.length} students.`)
  } catch (err) {
    next(err)
  }
}

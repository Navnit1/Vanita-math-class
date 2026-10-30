/**
 * Vanita Math Classes — WhatsApp Web Direct URL Builders
 * Complies with Section 6 specifications.
 */

export function getWhatsAppFeeReminderUrl(student) {
  const cleanPhone = (student.parentPhone || student.phone || '').replace(/\D/g, '').replace(/^0+/, '')
  const phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`

  const due = Number(student.dueAmount ?? student.pendingAmount ?? student.pendingBalance ?? 0)
  const studentName = student.fullName || student.name || 'Student'
  const roll = student.studentId || student.rollNo || 'VMC'
  const cls = student.class || student.standard || ''

  const text = encodeURIComponent(
    `📢 *VANITA MATH CLASSES - Fee Reminder*\n\n` +
    `Dear ${student.parentName || 'Parent'},\n` +
    `This is a gentle reminder regarding tuition fees for *${studentName}* (Roll: ${roll}) - Class ${cls}.\n\n` +
    `💳 *Pending Dues:* ₹${due.toLocaleString('en-IN')}\n\n` +
    `Kindly clear the pending fees via Cash or UPI at your earliest convenience.\n` +
    `If already paid, please ignore this message.\n\n` +
    `Warm regards,\n*Vanita Rani Gupta*\nVanita Math Classes, Bathinda\n📞 98159-62612`
  )

  return `https://wa.me/${phone}?text=${text}`
}

export function getWhatsAppTestResultUrl(test, studentResult) {
  const cleanPhone = (studentResult.parentPhone || studentResult.phone || '').replace(/\D/g, '').replace(/^0+/, '')
  const phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`

  const isAbsent = studentResult.attendance === 'absent' || studentResult.attendance === 'Absent'
  const marksObtained = isAbsent ? 'Absent' : (studentResult.marksObtained ?? 0)
  const pct = studentResult.percentage ?? 0
  const resultStatus = isAbsent
    ? 'Absent'
    : (studentResult.result === 'pass' || studentResult.resultStatus === 'Pass' || pct >= 40 ? 'PASSED 🎯' : 'NEEDS PRACTICE ⚠️')

  const formattedDate = test.testDate
    ? new Date(test.testDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Recent Test'

  const studentName = studentResult.studentName || studentResult.name || 'Student'
  const roll = studentResult.rollNo || studentResult.studentId || 'VMC'
  const cls = test.class || test.standard || ''
  const topic = test.title || test.topicsCovered || 'Weekly Mathematics Test'

  const text = encodeURIComponent(
    `📊 *VANITA MATH CLASSES - Weekly Test Report*\n\n` +
    `Student: *${studentName}* (Roll: ${roll})\n` +
    `Class: Class ${cls} | Date: ${formattedDate}\n` +
    `Topic: *${topic}*\n\n` +
    `Attendance: ${isAbsent ? '❌ Absent' : '✅ Present'}\n` +
    `Marks: *${marksObtained} / ${test.maxMarks}* (${pct}%)\n` +
    `Result: *${resultStatus}*\n` +
    `Teacher Remark: ${studentResult.remarks || studentResult.remark || 'Regular practice of NCERT theorems and problem sets required.'}\n\n` +
    `Vanita Math Classes, Bathinda\nFaculty: Vanita Rani Gupta (17+ Yrs Exp)\n📞 98159-62612`
  )

  return `https://wa.me/${phone}?text=${text}`
}

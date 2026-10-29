import assert from 'node:assert'
import {
  normalizePhoneNumber,
  getAdminRecipientNumber,
  buildAdminNewEnquiryAlert,
  buildAdminNewRegistrationAlert,
  buildAdmissionCredentialsMessage,
  buildFeeReminderMessage,
  buildFeeReceiptMessage,
  buildTestAnnouncementMessage,
  createDirectWhatsAppLink,
  sendMetaWhatsAppMessage,
  getWhatsAppStatus,
} from './services/whatsappService.js'

console.log('🧪 Starting Vanita Math Classes WhatsApp & Notification Unit Tests...\n')

// 1. Phone number normalization
console.log('Test 1: normalizePhoneNumber')
assert.strictEqual(normalizePhoneNumber('9815962612'), '919815962612', '10 digits should get 91 prefix')
assert.strictEqual(normalizePhoneNumber('09815962612'), '919815962612', '11 digits with 0 should normalize to 91')
assert.strictEqual(normalizePhoneNumber('+91 98159-62612'), '919815962612', 'Formatting spaces and + should be cleaned')
assert.strictEqual(normalizePhoneNumber('919815962612'), '919815962612', '12 digits with 91 should remain 919815962612')
assert.strictEqual(normalizePhoneNumber('12345'), null, 'Short invalid number should return null')
assert.strictEqual(normalizePhoneNumber(null), null, 'Null number should return null')
console.log('  ✅ Phone number normalization verified.\n')

// 2. Admin recipient number
console.log('Test 2: getAdminRecipientNumber')
const adminNumber = getAdminRecipientNumber()
assert(adminNumber.startsWith('91'), 'Admin recipient number should be 91 formatted')
console.log(`  ✅ Admin number configured: ${adminNumber}\n`)

// 3. Message Builders
console.log('Test 3: Message Builders for 6 Core Workflows')

// Workflow 1: New Enquiry Alert to Admin
const enquiryMsg = buildAdminNewEnquiryAlert({
  name: 'Gurpreet Singh',
  phone: '9876543210',
  email: 'gurpreet@test.com',
  studentClass: '10th',
  school: 'St. Joseph Bathinda',
  message: 'Interested in evening batch',
})
assert(enquiryMsg.includes('Gurpreet Singh'), 'Enquiry alert should include student name')
assert(enquiryMsg.includes('10th'), 'Enquiry alert should include student class')
assert(enquiryMsg.includes('9876543210'), 'Enquiry alert should include phone')
console.log('  ✅ 1. buildAdminNewEnquiryAlert verified.')

// Workflow 2: New Student Registration Alert to Admin
const regMsg = buildAdminNewRegistrationAlert({
  studentName: 'Harman Kaur',
  studentId: 'VMC-2026-1001',
  studentClass: '+1',
  phone: '9812345678',
  parentName: 'Baldev Singh',
  parentPhone: '9812345679',
})
assert(regMsg.includes('Harman Kaur'), 'Reg alert should include name')
assert(regMsg.includes('VMC-2026-1001'), 'Reg alert should include roll number')
assert(regMsg.includes('Pending Admission Approval'), 'Reg alert should instruct admin to review/approve')
console.log('  ✅ 2. buildAdminNewRegistrationAlert verified.')

// Workflow 3: Admission Credentials Message to Student
const admissionMsg = buildAdmissionCredentialsMessage({
  studentName: 'Harman Kaur',
  studentId: 'VMC-2026-1001',
  username: 'harman.vmc',
  tempPassword: '(Set during registration)',
  studentClass: '+1',
  batch: 'Evening',
})
assert(admissionMsg.includes('admission has been approved'), 'Admission message should confirm admission')
assert(admissionMsg.includes('harman.vmc'), 'Admission message should include username')
console.log('  ✅ 3. buildAdmissionCredentialsMessage verified.')

// Workflow 4: Fee Reminder Message
const feeReminderMsg = buildFeeReminderMessage({
  studentName: 'Harman Kaur',
  studentId: 'VMC-2026-1001',
  studentClass: '+1',
  month: 'November 2026',
  pendingAmount: 2500,
})
assert(feeReminderMsg.includes('2,500') || feeReminderMsg.includes('2500'), 'Fee reminder should contain pending amount')
assert(feeReminderMsg.includes('98159-62612'), 'Fee reminder should contain institute contact')
console.log('  ✅ 4. buildFeeReminderMessage verified.')

// Workflow 5: Fee Receipt Message
const feeReceiptMsg = buildFeeReceiptMessage({
  receiptNumber: 'VMC-RCP-2026-0042',
  studentName: 'Harman Kaur',
  studentId: 'VMC-2026-1001',
  studentClass: '+1',
  amount: 2500,
  paymentDate: '29 Oct 2026',
  paymentMethod: 'UPI',
  month: 'November 2026',
  remainingBalance: 0,
})
assert(feeReceiptMsg.includes('VMC-RCP-2026-0042'), 'Receipt message should include receipt number')
assert(feeReceiptMsg.includes('UPI'), 'Receipt message should include payment method')
console.log('  ✅ 5. buildFeeReceiptMessage verified.')

// Workflow 6: Weekly Test Announcement
const testMsg = buildTestAnnouncementMessage({
  testTitle: 'Quadratic Equations & AP',
  studentClass: '10th',
  testDate: '02 Nov 2026',
  startTime: '05:00 PM',
  durationMinutes: 60,
  maxMarks: 50,
  topicsCovered: 'Ex 4.1 to 4.4, Word Problems',
})
assert(testMsg.includes('Quadratic Equations'), 'Test message should include title')
assert(testMsg.includes('Max Marks:') && testMsg.includes('50'), 'Test message should include max marks')
console.log('  ✅ 6. buildTestAnnouncementMessage verified.\n')

// 4. WhatsApp Direct Link Fallback
console.log('Test 4: createDirectWhatsAppLink')
const waLink = createDirectWhatsAppLink('9815962612', 'Hello VMC!')
assert(waLink.startsWith('https://wa.me/919815962612?text='), 'Link should use wa.me with normalized number and text')
console.log(`  ✅ Fallback link verified: ${waLink}\n`)

// 5. Cloud API Dispatch Handling (when unconfigured vs configured)
console.log('Test 5: sendMetaWhatsAppMessage behavior')
const unconfiguredResult = await sendMetaWhatsAppMessage({
  to: '9815962612',
  text: 'Test message',
})
assert.strictEqual(unconfiguredResult.success, false, 'Unconfigured environment should return success: false without throwing')
assert.strictEqual(unconfiguredResult.status, 'not_configured', 'Status should be not_configured')
console.log('  ✅ Graceful degradation verified (no unhandled rejections).\n')

// 6. WhatsApp Configuration Status check
console.log('Test 6: getWhatsAppStatus')
const status = getWhatsAppStatus()
assert('configured' in status, 'Status should report configured boolean')
assert.strictEqual(status.adminRecipient, adminNumber, 'Status should report correct admin recipient')
console.log('  ✅ Status reporting verified:', JSON.stringify(status), '\n')

console.log('🎉 ALL 6 AUTOMATED WHATSAPP NOTIFICATION TESTS PASSED SUCCESSFULLY!')

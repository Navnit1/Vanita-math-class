import PDFDocument from 'pdfkit'

/**
 * Generate a professional VMC receipt PDF with Red & White branding
 */
export const generateReceiptPDF = (payment, student, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="receipt-${payment.receiptNumber}.pdf"`
  )
  doc.pipe(res)

  const primaryRed = '#E50914'
  const deepRed = '#C90019'
  const darkText = '#171717'
  const mutedText = '#64748B'
  const borderColor = '#D9DDE3'
  const lightBg = '#F3F4F6'

  // ── Header Banner ──────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 115).fill(deepRed)
  
  // Header text
  doc.fillColor('white')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('VANITA MATH CLASSES', 40, 24)
  
  doc.fontSize(10)
    .font('Helvetica')
    .text('Mathematics Tuition for 8th, 9th, 10th, +1 and +2', 40, 52)
  doc.fontSize(9)
    .text('Faculty: Vanita Rani Gupta (M.Sc., M.Phil., B.Ed. · 17+ Years Experience)', 40, 68)
  doc.fontSize(9)
    .text('#302, Phase-II, Vishal Nagar, Bathinda · Phone: 98159-62612', 40, 82)

  // Receipt number badge (top right)
  doc.rect(380, 24, 175, 60).fill('#9B0013')
  doc.fillColor('white')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('FEE RECEIPT', 392, 32)
    .fontSize(11)
    .text(payment.receiptNumber, 392, 46)
    .fontSize(8)
    .font('Helvetica')
    .text(`Date: ${new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 392, 64)

  // ── Body ────────────────────────────────────────────────
  let y = 135

  // Section title
  doc.fillColor(darkText).fontSize(12).font('Helvetica-Bold').text('Student & Admission Details', 40, y)
  doc.moveTo(40, y + 16).lineTo(555, y + 16).strokeColor(borderColor).stroke()
  y += 24

  const row = (label, value, x1 = 40, x2 = 180, highlight = false) => {
    doc.fontSize(9.5).font('Helvetica').fillColor(mutedText).text(label, x1, y)
    doc.fontSize(9.5)
      .font(highlight ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(highlight ? deepRed : darkText)
      .text(value || '—', x2, y)
    y += 18
  }

  const s = student || {}
  row('Student Name', s.fullName, 40, 160)
  row('Roll No / Student ID', s.studentId, 40, 160)
  row('Class & Batch', `${s.class || '—'} · ${s.batch || '—'} Batch`, 40, 160)
  if (s.school) row('School', s.school, 40, 160)
  row('Parent / Guardian', s.parentName ? `${s.parentName} (${s.parentPhone || s.phone || '—'})` : (s.phone || '—'), 40, 160)

  y += 8
  doc.fillColor(darkText).fontSize(12).font('Helvetica-Bold').text('Payment Information', 40, y)
  doc.moveTo(40, y + 16).lineTo(555, y + 16).strokeColor(borderColor).stroke()
  y += 24

  row('Payment Method', formatMethod(payment.paymentMethod), 40, 160)
  row('Payment Type', payment.paymentType === 'online' ? 'Online (Razorpay)' : 'Direct / Offline Entry', 40, 160)
  if (payment.transactionId) row('Transaction ID', payment.transactionId, 40, 160)
  if (payment.gatewayPaymentId) row('Gateway Reference', payment.gatewayPaymentId, 40, 160)
  row('Billing Period / Month', payment.month || 'Current Cycle', 40, 160)
  if (payment.notes) row('Remarks / Notes', payment.notes, 40, 160)

  y += 10

  // Amount box
  doc.rect(40, y, 515, 60).fill('#FFF5F5').stroke(primaryRed)
  doc.fillColor(deepRed)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('AMOUNT RECEIVED', 55, y + 12)
  doc.fontSize(22)
    .font('Helvetica-Bold')
    .text(`₹${Number(payment.amount).toLocaleString('en-IN')}`, 55, y + 26)

  doc.fillColor(mutedText).fontSize(8.5).font('Helvetica')
    .text('Receipt Status:', 380, y + 14)
  doc.fillColor('#059669').fontSize(11).font('Helvetica-Bold')
    .text('PAYMENT VERIFIED', 380, y + 28)

  y += 76

  // Fee summary box
  doc.fillColor(darkText).fontSize(12).font('Helvetica-Bold').text('Tuition Fee Balance Summary', 40, y)
  doc.moveTo(40, y + 16).lineTo(555, y + 16).strokeColor(borderColor).stroke()
  y += 24

  const totalFee = Number(s.totalFee || 0)
  const paidFee = Number(s.paidFee || 0)
  const remaining = Math.max(0, totalFee - paidFee)

  row('Total Fee Obligation', `₹${totalFee.toLocaleString('en-IN')}`, 40, 160)
  row('Total Paid to Date', `₹${paidFee.toLocaleString('en-IN')}`, 40, 160, true)
  row('Outstanding Dues', `₹${remaining.toLocaleString('en-IN')}`, 40, 160)
  row('Overall Status', (s.feeStatus || 'pending').toUpperCase(), 40, 160)

  y += 30

  // Footer notes & signature block
  doc.moveTo(40, y).lineTo(555, y).strokeColor(borderColor).stroke()
  y += 14

  doc.fillColor(mutedText).fontSize(8).font('Helvetica')
    .text('This is an official computer-generated receipt from Vanita Math Classes. Receipts are archived permanently in the portal.', 40, y, { align: 'center', width: 515 })
  doc.text(`Generated on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} · Bathinda, Punjab`, 40, y + 12, { align: 'center', width: 515 })

  doc.end()
}

function formatMethod(m) {
  const map = {
    cash: 'Cash Payment',
    upi: 'UPI (GPay / PhonePe / Paytm)',
    bank_transfer: 'Bank Transfer / NEFT',
    cheque: 'Cheque',
    demand_draft: 'Demand Draft',
    online: 'Online (Razorpay)',
  }
  return map[m] || m || 'Direct Payment'
}

import PDFDocument from 'pdfkit'

/**
 * Generate a professional receipt PDF and pipe to response/stream
 */
export const generateReceiptPDF = (payment, student, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="receipt-${payment.receiptNumber}.pdf"`
  )
  doc.pipe(res)

  // ── Header ──────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 110).fill('#2563eb')
  doc.fillColor('white')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('Vanita Maths Classes', 50, 30)
  doc.fontSize(11)
    .font('Helvetica')
    .text('Official Fee Receipt', 50, 58)
  doc.fontSize(10)
    .text('Coaching Institute · Maharashtra, India', 50, 76)

  // Receipt number badge (top right)
  doc.fillColor('white')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('RECEIPT NO.', 380, 30)
    .fontSize(13)
    .text(payment.receiptNumber, 380, 45)

  // ── Body ────────────────────────────────────────────────
  doc.fillColor('#1e293b')
  let y = 135

  // Section title
  doc.fontSize(13).font('Helvetica-Bold').text('Payment Details', 50, y)
  doc.moveTo(50, y + 18).lineTo(545, y + 18).strokeColor('#e2e8f0').stroke()
  y += 30

  const row = (label, value, highlight = false) => {
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(label, 50, y)
    doc.fontSize(10)
      .font(highlight ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(highlight ? '#16a34a' : '#1e293b')
      .text(value || '—', 200, y)
    y += 22
  }

  row('Student Name', student.fullName)
  row('Student ID', student.studentId)
  row('Class & Batch', `${student.class} · ${student.batch} Batch`)
  row('Parent Name', student.parentName)
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#f1f5f9').stroke()
  y += 12

  row('Payment Date', new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }))
  row('Payment Method', formatMethod(payment.paymentMethod))
  row('Payment Type', payment.paymentType === 'online' ? 'Online (Razorpay)' : 'Offline')
  if (payment.transactionId) row('Transaction ID', payment.transactionId)
  if (payment.gatewayPaymentId) row('Gateway Payment ID', payment.gatewayPaymentId)
  row('Month / Period', payment.month || '—')
  if (payment.notes) row('Notes', payment.notes)
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#f1f5f9').stroke()
  y += 12

  // Amount box
  doc.rect(50, y, 495, 54).fill('#f0fdf4').stroke('#bbf7d0')
  doc.fillColor('#15803d')
    .fontSize(12)
    .font('Helvetica')
    .text('Amount Paid', 70, y + 10)
  doc.fontSize(22)
    .font('Helvetica-Bold')
    .text(`₹${Number(payment.amount).toLocaleString('en-IN')}`, 70, y + 24)

  doc.fillColor('#64748b').fontSize(9).font('Helvetica')
    .text('Status:', 380, y + 10)
  doc.fillColor('#16a34a').fontSize(11).font('Helvetica-Bold')
    .text(payment.status === 'verified' ? 'VERIFIED' : 'RECORDED', 380, y + 24)

  y += 74

  // Fee summary
  doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold').text('Fee Summary', 50, y)
  doc.moveTo(50, y + 18).lineTo(545, y + 18).strokeColor('#e2e8f0').stroke()
  y += 30

  row('Total Fee', `₹${Number(student.totalFee || 0).toLocaleString('en-IN')}`)
  row('Total Paid', `₹${Number(student.paidFee || 0).toLocaleString('en-IN')}`, true)
  row('Remaining', `₹${Math.max(0, (student.totalFee || 0) - (student.paidFee || 0)).toLocaleString('en-IN')}`)
  row('Fee Status', (student.feeStatus || 'pending').toUpperCase())

  y += 20

  // Footer
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').stroke()
  y += 14
  doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
    .text('This is a computer-generated receipt and does not require a physical signature.', 50, y, { align: 'center', width: 495 })
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')} · Vanita Maths Classes`, 50, y + 14, { align: 'center', width: 495 })

  doc.end()
}

function formatMethod(m) {
  const map = { cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', cheque: 'Cheque', demand_draft: 'Demand Draft', online: 'Online (Razorpay)' }
  return map[m] || m
}

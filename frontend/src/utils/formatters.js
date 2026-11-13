// Currency and Indian Number formatting helpers

export function formatCurrency(amount, symbol = '₹') {
  const num = Number(amount) || 0
  return `${symbol}${num.toLocaleString('en-IN')}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export function numberToWords(amount) {
  const num = Math.round(Number(amount) || 0)
  if (num === 0) return 'Zero'
  if (num < 0) return 'Negative ' + numberToWords(Math.abs(num))

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertHundreds(n) {
    let str = ''
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' '
      n %= 10
    }
    if (n > 0) {
      str += units[n] + ' '
    }
    return str.trim()
  }

  let result = ''
  let crore = Math.floor(num / 10000000)
  let rem = num % 10000000
  let lakh = Math.floor(rem / 100000)
  rem %= 100000
  let thousand = Math.floor(rem / 1000)
  let hundred = rem % 1000

  if (crore > 0) result += convertHundreds(crore) + ' Crore '
  if (lakh > 0) result += convertHundreds(lakh) + ' Lakh '
  if (thousand > 0) result += convertHundreds(thousand) + ' Thousand '
  if (hundred > 0) result += convertHundreds(hundred)

  return (result.trim() || 'Zero') + ' Only'
}

export function buildWhatsAppFeeReminder(student, settings, dueAmount, months = []) {
  const phone = (student.guardianPhone || student.phone || '').replace(/[^0-9]/g, '')
  const period = months.length > 0 ? months.join(', ') : 'Current Month'
  const text = `Dear Parent/Student,
This is a gentle reminder from *${settings.centerName}* regarding the pending tuition fee for *${student.fullName || student.name}* (Roll No: ${student.studentId || student.rollNo}, ${student.class || student.grade}).

• Pending Amount: *${settings.currencySymbol || '₹'}${Number(dueAmount).toLocaleString('en-IN')}*
• Period/Month: ${period}
${settings.upiId ? `• UPI ID for Payment: *${settings.upiId}*` : ''}
${settings.phone ? `• For queries, contact: ${settings.phone}` : ''}

Kindly clear the balance at your earliest convenience. If already paid, please disregard this message.

Thank you!
*${settings.centerName}*`

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export function exportToCsv(filename, headers, rows) {
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', filename)
  a.style.visibility = 'hidden'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

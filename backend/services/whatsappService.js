import logger from '../utils/logger.js'

/**
 * Vanita Math Classes - WhatsApp Service
 * 
 * Supports:
 * 1. Meta WhatsApp Cloud API (Graph API v20.0)
 * 2. Pre-formatted Direct WhatsApp Links (100% free, immediate one-click messaging to student/parent)
 */

export const isWhatsAppConfigured = () => {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  )
}

export const getWhatsAppStatus = () => {
  const configured = isWhatsAppConfigured()
  return {
    provider: process.env.WHATSAPP_PROVIDER || 'meta',
    configured,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
    phoneNumberIdSet: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    hasAccessToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
    businessAccountIdSet: Boolean(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID),
    mode: configured ? 'cloud_api' : 'direct_links_only',
  }
}

/**
 * Clean phone number to 10 or 12 digits (default Indian country code 91)
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return ''
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.startsWith('91') && digits.length === 12) return digits
  return digits
}

/**
 * Generate direct WhatsApp web/app link with URL encoded message
 */
export const createDirectWhatsAppLink = (phone, text) => {
  const cleanPhone = normalizePhoneNumber(phone)
  const encoded = encodeURIComponent(text)
  return `https://wa.me/${cleanPhone}?text=${encoded}`
}

/**
 * Send template or text message via Meta WhatsApp Cloud API
 */
export const sendMetaWhatsAppMessage = async ({ to, text, templateName, templateLanguage = 'en', components = [] }) => {
  const cleanPhone = normalizePhoneNumber(to)
  if (!cleanPhone) {
    return { success: false, status: 'invalid_recipient', message: 'Invalid recipient phone number' }
  }

  if (!isWhatsAppConfigured()) {
    logger.warn(`WhatsApp Cloud API not configured. Message to ${cleanPhone} was not sent via Cloud API.`)
    return {
      success: false,
      status: 'not_configured',
      message: 'Meta WhatsApp Cloud API credentials not configured in environment.',
      directLink: createDirectWhatsAppLink(cleanPhone, text || 'Vanita Math Classes notification'),
    }
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0'
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
  }

  if (templateName) {
    body.type = 'template'
    body.template = {
      name: templateName,
      language: { code: templateLanguage },
      components,
    }
  } else {
    body.type = 'text'
    body.text = { preview_url: false, body: text }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok) {
      logger.error('Meta WhatsApp API error:', data)
      return {
        success: false,
        status: 'api_error',
        error: data.error?.message || 'Meta API returned an error',
        data,
      }
    }

    logger.info(`WhatsApp message sent successfully via Meta Cloud API to ${cleanPhone}. Message ID: ${data.messages?.[0]?.id}`)
    return {
      success: true,
      status: 'delivered_to_gateway',
      messageId: data.messages?.[0]?.id,
      data,
    }
  } catch (err) {
    logger.error('WhatsApp network send error:', err)
    return {
      success: false,
      status: 'network_error',
      error: err.message,
    }
  }
}

/**
 * Pre-formatted notification builders for VMC:
 */

export const buildTestAnnouncementMessage = ({ testTitle, studentClass, batch, testDate, startTime, maxMarks, topicsCovered }) => {
  return `📢 *VANITA MATH CLASSES — WEEKLY TEST ANNOUNCEMENT*

Dear Student / Parent,
A weekly mathematics test has been scheduled:

📝 *Test:* ${testTitle}
📚 *Class:* ${studentClass} (${batch})
📅 *Date:* ${testDate}
⏰ *Time:* ${startTime}
🎯 *Max Marks:* ${maxMarks}
📖 *Topics:* ${topicsCovered}

Please arrive on time with required geometry instruments and stationery.
— *Vanita Rani Gupta*
Vanita Math Classes | 98159-62612
#302, Phase-II, Vishal Nagar, Bathinda`
}

export const buildFeeReminderMessage = ({ studentName, studentId, studentClass, month, pendingAmount }) => {
  return `🔔 *VANITA MATH CLASSES — FEE REMINDER*

Dear Parent of *${studentName}* (${studentId}, Class ${studentClass}),
This is a gentle reminder regarding tuition fees for *${month}*.

💰 *Pending Dues:* ₹${Number(pendingAmount).toLocaleString('en-IN')}

Kindly clear the balance at your earliest convenience via Cash/UPI at the institute.
If already paid, please ignore this notice.

Thank you,
*Vanita Math Classes*
Phone: 98159-62612
#302, Phase-II, Vishal Nagar, Bathinda`
}

export const buildFeeReceiptMessage = ({ receiptNumber, studentName, studentId, studentClass, amountPaid, paymentMethod, date, remainingBalance }) => {
  return `🧾 *VANITA MATH CLASSES — PAYMENT RECEIPT*

Receipt No: *${receiptNumber}*
Student: *${studentName}* (${studentId})
Class: *${studentClass}*
Date: *${date}*

💵 *Amount Paid:* ₹${Number(amountPaid).toLocaleString('en-IN')}
💳 *Payment Mode:* ${paymentMethod}
⚖️ *Remaining Balance:* ₹${Number(remainingBalance).toLocaleString('en-IN')}

Thank you for your payment!
— *Vanita Math Classes*
Bathinda | 98159-62612`
}

export const buildAdmissionCredentialsMessage = ({ studentName, studentId, username, tempPassword, studentClass, batch }) => {
  return `🎉 *WELCOME TO VANITA MATH CLASSES*

Dear *${studentName}*, your admission has been approved!

📋 *Roll No:* ${studentId}
📚 *Class:* ${studentClass} (${batch})
🌐 *Student Portal:* ${process.env.FRONTEND_URL || 'https://vanitamath.com'}

🔐 *Login Credentials:*
Username: \`${username}\`
Temporary Password: \`${tempPassword}\`

⚠️ *Important:* You will be asked to change your password upon first login. Keep your credentials private.

— *Vanita Rani Gupta*
Faculty, Vanita Math Classes
Phone: 98159-62612`
}

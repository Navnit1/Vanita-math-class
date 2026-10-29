import logger from '../utils/logger.js'

/**
 * Vanita Math Classes - Official WhatsApp Cloud API Service & Fallback
 * 
 * Supports:
 * 1. Meta WhatsApp Cloud API (Graph API) - Real server-side automated notifications
 * 2. Pre-formatted Direct WhatsApp Links (Clearly labeled fallback for manual communication)
 */

export const isWhatsAppConfigured = () => {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  )
}

export const getAdminRecipientNumber = () => {
  return normalizePhoneNumber(process.env.VMC_ADMIN_WHATSAPP_NUMBER || '9815962612')
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
    adminRecipientConfigured: Boolean(process.env.VMC_ADMIN_WHATSAPP_NUMBER),
    adminRecipient: getAdminRecipientNumber(),
    adminRecipientNumber: getAdminRecipientNumber(),
    mode: configured ? 'cloud_api' : 'not_configured',
  }
}

/**
 * Robust phone number normalizer for Meta WhatsApp Cloud API:
 * - Strips all non-digit characters
 * - Handles Indian local formats (10 digits -> prepends 91)
 * - Handles numbers with leading 0 (e.g. 09815962612 -> 919815962612)
 * - Retains full international format with country code (e.g. 919815962612)
 * - Returns digits-only string without '+' or spaces, as strictly required by Meta Graph API
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return null
  let digits = String(phone).replace(/\D/g, '')

  // Strip leading zeros
  digits = digits.replace(/^0+/, '')

  // Standard 10-digit Indian mobile number
  if (digits.length === 10) {
    return `91${digits}`
  }

  // Already prefixed with 91 and total 12 digits
  if (digits.startsWith('91') && digits.length === 12) {
    return digits
  }

  // International numbers (between 10 and 15 digits)
  if (digits.length >= 10 && digits.length <= 15) {
    return digits
  }

  return null
}

/**
 * Generates an explicit manual fallback link for opening WhatsApp chat with a pre-filled message.
 * Clearly labeled as manual fallback — never confused with automatic sending.
 */
export const createDirectWhatsAppLink = (phone, text) => {
  const cleanPhone = normalizePhoneNumber(phone)
  const encoded = encodeURIComponent(text || '')
  return `https://wa.me/${cleanPhone}?text=${encoded}`
}

/**
 * Send template or text message via Meta WhatsApp Cloud API
 *
 * Status values returned:
 * - 'sent_to_provider': Meta API accepted the request and returned a message ID.
 * - 'not_configured': WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing.
 * - 'invalid_recipient': Recipient phone number could not be normalized.
 * - 'api_error': Meta Graph API returned an error response (invalid token, template missing, etc.).
 * - 'network_error': Network request timed out or failed.
 */
export const sendMetaWhatsAppMessage = async ({ to, text, templateName, templateLanguage = 'en', components = [] }) => {
  const cleanPhone = normalizePhoneNumber(to)
  if (!cleanPhone || cleanPhone.length < 10) {
    logger.warn(`WhatsApp dispatch skipped: Invalid phone number '${to}'`)
    return {
      success: false,
      status: 'invalid_recipient',
      message: 'Invalid recipient phone number. Must be at least 10 digits.',
      directLink: createDirectWhatsAppLink(to, text),
    }
  }

  if (!isWhatsAppConfigured()) {
    logger.info(`WhatsApp Cloud API credentials not configured in environment. Manual link generated for ${cleanPhone}.`)
    return {
      success: false,
      status: 'not_configured',
      message: 'Meta WhatsApp Cloud API credentials not configured. Configure WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.',
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
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await res.json()

    if (!res.ok) {
      // Log sanitized error without leaking tokens
      logger.error('Meta WhatsApp Cloud API error:', {
        status: res.status,
        code: data.error?.code,
        subcode: data.error?.error_subcode,
        message: data.error?.message,
      })
      return {
        success: false,
        status: 'api_error',
        errorCode: data.error?.code,
        errorSubcode: data.error?.error_subcode,
        message: data.error?.message || 'Meta Cloud API rejected message request.',
        directLink: createDirectWhatsAppLink(cleanPhone, text),
      }
    }

    const messageId = data.messages?.[0]?.id
    logger.info(`WhatsApp message accepted by Meta Cloud API for ${cleanPhone}. Message ID: ${messageId}`)
    return {
      success: true,
      status: 'sent_to_provider',
      messageId,
      message: 'Message accepted by Meta WhatsApp gateway.',
      directLink: createDirectWhatsAppLink(cleanPhone, text),
    }
  } catch (err) {
    logger.error('Meta WhatsApp network error:', err.message)
    return {
      success: false,
      status: 'network_error',
      message: err.name === 'AbortError' ? 'Meta API request timed out after 15s.' : err.message,
      directLink: createDirectWhatsAppLink(cleanPhone, text),
    }
  }
}

/**
 * Convenience helper: Safely notify admin without breaking caller transaction
 */
export const notifyAdminWhatsApp = async (text) => {
  const adminPhone = getAdminRecipientNumber()
  try {
    return await sendMetaWhatsAppMessage({ to: adminPhone, text })
  } catch (err) {
    logger.error('Failed to dispatch admin WhatsApp alert:', err.message)
    return { success: false, status: 'error', message: err.message }
  }
}

// ─────────────────────────────────────────────────────────────────
// NOTIFICATION BUILDERS FOR ALL 6 REQUIRED WORKFLOWS
// ─────────────────────────────────────────────────────────────────

/**
 * 1. Admin Alert: New Public Enquiry Received
 */
export const buildAdminNewEnquiryAlert = ({ name, parentName, phone, studentClass, batch, school, message, enquiryId }) => {
  return `📢 *NEW ADMISSION ENQUIRY — VANITA MATH CLASSES*

A new enquiry has been submitted through the website:

👤 *Student:* ${name}
👨‍👩‍👦 *Parent:* ${parentName || 'Not specified'}
📞 *Phone:* ${phone}
📚 *Interested Class:* ${studentClass}
⏰ *Preferred Batch:* ${batch || 'Evening'}
🏫 *School:* ${school || 'Not specified'}
💬 *Message:* ${message || 'None provided'}
🆔 *Enquiry ID:* ${enquiryId || 'New'}

👉 Please log in to the Admin Portal to review and approve admission.`
}

/**
 * 2. Admin Alert: New Student Online Registration Received
 */
export const buildAdminNewRegistrationAlert = ({ name, studentName, studentId, studentClass, batch, phone, parentName, parentPhone, email }) => {
  const displayName = name || studentName
  return `🔔 *NEW STUDENT REGISTRATION ALERT — VANITA MATH CLASSES*

A prospective student has self-registered online and is awaiting admission approval:

👤 *Student:* ${displayName}
📋 *Assigned Roll No:* ${studentId}
📚 *Class:* ${studentClass} (${batch || 'Evening'})
📞 *Student Phone:* ${phone}
👨‍👩‍👦 *Parent:* ${parentName || 'Not specified'} (${parentPhone || 'Not specified'})
✉️ *Email:* ${email || 'Not specified'}

⚠️ *Status:* Pending Admission Approval
The student cannot log in until approved in the Admin Portal.
👉 Open Admin Portal → Enquiries / Students to review.`
}

/**
 * 3. Student/Parent Alert: Admission Approved & Login Credentials
 */
export const buildAdmissionCredentialsMessage = ({ studentName, studentId, username, tempPassword, studentClass, batch }) => {
  const portalUrl = (process.env.FRONTEND_URL || 'https://vanita-math-class.vercel.app').replace(/\/+$/, '')
  return `🎉 *WELCOME TO VANITA MATH CLASSES*

Dear *${studentName}*, your admission has been approved!

📋 *Roll Number:* ${studentId}
📚 *Class:* ${studentClass} (${batch})
🌐 *Student Portal:* ${portalUrl}/login

🔐 *Your Login Credentials:*
• Username: \`${username}\`
• Temporary Password: \`${tempPassword}\`

⚠️ *Important:* You will be asked to set your permanent password upon first login. Keep these credentials confidential.

— *Vanita Rani Gupta*
Faculty, Vanita Math Classes
📞 98159-62612
📍 #302, Phase-II, Vishal Nagar, Bathinda`
}

/**
 * 4. Parent Alert: Fee Reminder with Outstanding Balance
 */
export const buildFeeReminderMessage = ({ studentName, studentId, studentClass, month, pendingAmount }) => {
  return `🔔 *VANITA MATH CLASSES — TUITION FEE REMINDER*

Dear Parent of *${studentName}* (${studentId}, Class ${studentClass}),
This is a gentle reminder regarding tuition fees for *${month}*.

💰 *Outstanding Balance:* ₹${Number(pendingAmount).toLocaleString('en-IN')}

Kindly clear the balance at the institute at your earliest convenience (Cash or UPI accepted).
If payment has already been completed, please disregard this notice.

Thank you,
*Vanita Math Classes*
📞 98159-62612
📍 #302, Phase-II, Vishal Nagar, Bathinda`
}

/**
 * 5. Parent/Student Alert: Fee Payment Receipt
 */
export const buildFeeReceiptMessage = ({ receiptNumber, studentName, studentId, studentClass, amountPaid, paymentMethod, date, remainingBalance }) => {
  return `🧾 *VANITA MATH CLASSES — OFFICIAL FEE RECEIPT*

Receipt No: *${receiptNumber}*
Student: *${studentName}* (${studentId})
Class: *Class ${studentClass}*
Date: *${date}*

💵 *Amount Received:* ₹${Number(amountPaid).toLocaleString('en-IN')}
💳 *Payment Mode:* ${paymentMethod}
⚖️ *Remaining Balance:* ₹${Number(remainingBalance).toLocaleString('en-IN')}

Thank you for your payment!
— *Vanita Math Classes*
Bathinda | 📞 98159-62612`
}

/**
 * 6. Class/Batch Alert: Weekly Test Announcement
 */
export const buildTestAnnouncementMessage = ({ testTitle, studentClass, batch, testDate, startTime, maxMarks, topicsCovered }) => {
  return `📢 *VANITA MATH CLASSES — WEEKLY TEST ANNOUNCEMENT*

Dear Student / Parent,
A weekly mathematics test has been scheduled:

📝 *Test:* ${testTitle}
📚 *Class:* Class ${studentClass} (${batch})
📅 *Date:* ${testDate}
⏰ *Time:* ${startTime}
🎯 *Max Marks:* ${maxMarks}
📖 *Syllabus / Topics:* ${topicsCovered}

Please arrive 10 minutes early with your geometry box and writing instruments. Calculators are strictly prohibited.

— *Vanita Rani Gupta*
Vanita Math Classes | 📞 98159-62612
📍 #302, Phase-II, Vishal Nagar, Bathinda`
}

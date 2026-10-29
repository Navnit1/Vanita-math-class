import nodemailer from 'nodemailer'
import logger from '../utils/logger.js'

/**
 * Vanita Math Classes - Email Service
 * 
 * Primary: Resend API (HTTP POST https://api.resend.com/emails)
 * Fallback: Nodemailer SMTP
 */

export const isEmailConfigured = () => {
  if (process.env.EMAIL_API_KEY) return true
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) return true
  return false
}

export const getEmailStatus = () => {
  const provider = process.env.EMAIL_PROVIDER || (process.env.EMAIL_API_KEY ? 'resend' : 'smtp')
  const configured = isEmailConfigured()
  return {
    provider,
    configured,
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
    fromName: process.env.EMAIL_FROM_NAME || 'Vanita Math Classes',
    hasApiKey: Boolean(process.env.EMAIL_API_KEY),
    hasSmtp: Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER),
  }
}

/**
 * Send an email via Resend API
 */
async function sendViaResend({ to, subject, html, text }) {
  const fromName = process.env.EMAIL_FROM_NAME || 'Vanita Math Classes'
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev'
  const apiKey = process.env.EMAIL_API_KEY

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddress}>`,
      to: [to],
      subject,
      html,
      text,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || `Resend API returned status ${response.status}`)
  }
  return data
}

/**
 * Send an email via SMTP
 */
async function sendViaSmtp({ to, subject, html, text }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const fromName = process.env.EMAIL_FROM_NAME || 'Vanita Math Classes'
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER

  return transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    html,
    text,
  })
}

/**
 * Unified sendEmail function
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!to) throw new Error('Missing recipient email address')

  if (!isEmailConfigured()) {
    logger.warn(`Email service not configured. Email to ${to} was not dispatched externally.`)
    return { success: false, notConfigured: true }
  }

  try {
    if (process.env.EMAIL_API_KEY) {
      const resendRes = await sendViaResend({ to, subject, html, text })
      logger.info(`Email sent via Resend to ${to}. ID: ${resendRes.id}`)
      return { success: true, id: resendRes.id, provider: 'resend' }
    } else {
      const smtpRes = await sendViaSmtp({ to, subject, html, text })
      logger.info(`Email sent via SMTP to ${to}. MessageId: ${smtpRes.messageId}`)
      return { success: true, id: smtpRes.messageId, provider: 'smtp' }
    }
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`)
    throw err
  }
}

/**
 * Send 6-Digit Password Reset OTP Email
 */
export async function sendPasswordResetOtpEmail(to, otp) {
  const subject = `${otp} is your Vanita Math Classes verification code`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fafafa; margin: 0; padding: 24px; color: #171717; }
          .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #d9dde3; overflow: hidden; }
          .header { background: #E50914; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
          .content { padding: 32px 24px; text-align: center; }
          .otp-box { background: #F3F4F6; border: 2px dashed #C90019; border-radius: 8px; padding: 16px; margin: 24px 0; display: inline-block; }
          .otp-code { font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #C90019; margin: 0; }
          .notice { font-size: 13px; color: #64748B; line-height: 1.5; margin-top: 16px; text-align: left; }
          .footer { background: #F3F4F6; padding: 16px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #d9dde3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VANITA MATH CLASSES</h1>
            <p>Mathematics Tuition · Bathinda</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; color: #171717; margin: 0 0 8px;">Password Recovery Code</h2>
            <p style="font-size: 14px; color: #64748B; margin: 0;">Use the single-use verification code below to reset your student portal password:</p>
            
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
            </div>
            
            <div class="notice">
              <p>⏱️ <strong>This code expires in 5 minutes.</strong></p>
              <p>🔒 Never share this code with anyone. Vanita Math Classes staff will never ask for your code.</p>
              <p>ℹ️ If you did not request this verification code, please ignore this email.</p>
            </div>
          </div>
          <div class="footer">
            #302, Phase-II, Vishal Nagar, Bathinda · Phone: 98159-62612<br>
            Faculty: Vanita Rani Gupta (M.Sc., M.Phil., B.Ed.)
          </div>
        </div>
      </body>
    </html>
  `
  const text = `Your Vanita Math Classes verification code is: ${otp}\n\nThis code expires in 5 minutes. If you did not request a password reset, please ignore this message.\n\nVanita Math Classes\nPhone: 98159-62612`

  return sendEmail({ to, subject, html, text })
}

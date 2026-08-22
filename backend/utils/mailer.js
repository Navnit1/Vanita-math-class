import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendPasswordResetEmail(to, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

  await transporter.sendMail({
    from: `"Vanita Maths Classes" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your password — Vanita Maths Classes',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Reset your password</h2>
        <p>We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#0F172A; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">
            Reset Password
          </a>
        </p>
        <p style="color:#666; font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}
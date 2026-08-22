import Razorpay from 'razorpay'
import crypto from 'crypto'

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const razorpay = getRazorpayInstance()
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
  })
  return order
}

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')
  return expectedSignature === signature
}

export const fetchRazorpayPayment = async (paymentId) => {
  const razorpay = getRazorpayInstance()
  return razorpay.payments.fetch(paymentId)
}

// Returns the amount Razorpay actually captured for this payment, in rupees.
// Always use this as the source of truth instead of any amount value the
// browser sends — the browser's value can be tampered with in dev tools.
export const getVerifiedPaymentAmount = async (paymentId) => {
  const razorpay = getRazorpayInstance()
  const payment = await razorpay.payments.fetch(paymentId)
  if (payment.status !== 'captured' && payment.status !== 'authorized') {
    throw new Error(`Payment not captured (status: ${payment.status})`)
  }
  return payment.amount / 100
}

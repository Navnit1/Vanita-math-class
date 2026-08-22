import { useCallback } from 'react'

export function useRazorpay() {
  const loadScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }, [])

  const openCheckout = useCallback(async (options) => {
    const loaded = await loadScript()
    if (!loaded) throw new Error('Razorpay SDK failed to load. Check your internet connection.')
    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        ...options,
        handler: (response) => resolve(response),
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      })
      rzp.on('payment.failed', (response) =>
        reject(new Error(response.error?.description || 'Payment failed'))
      )
      rzp.open()
    })
  }, [loadScript])

  
  return { openCheckout }
}

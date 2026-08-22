import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Phone, Mail, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { contactService } from '@/services/index'

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  interestedStandard: z.string().optional(),
  message: z.string().min(10, 'Tell us a bit more (10+ characters)'),
})

const STANDARDS = [ '8th', '9th', '10th', '11th', '12th' ]

export default function Contact() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setError } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    try {
      await contactService.submit(data)
      setSent(true)
      reset()
    } catch (err) {
      setError('root', { message: err.response?.data?.message || 'Could not send your message. Please try again.' })
    }
  }

  return (
    <section id="contact" className="bg-chalk-100 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-mark font-mono text-sm tracking-wide uppercase mb-3">Contact us</p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-ink-950 leading-tight">
            Let's talk about your child's maths.
          </h2>
          <p className="mt-4 text-steel-500 text-sm leading-relaxed max-w-md">
            Drop us a message and our admissions team will get back to you within one working day.
          </p>

          <div className="mt-9 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-ink-950 flex items-center justify-center shrink-0">
                <MapPin className="w-4.5 h-4.5 text-gold-300" />
              </div>
              <div>
                <p className="text-ink-950 font-medium text-sm">Visit us</p>
                <p className="text-steel-400 text-sm mt-0.5">House No: 302, Phase-II,Vishal Nagar, Bathinda, Punjab</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-ink-950 flex items-center justify-center shrink-0">
                <Phone className="w-4.5 h-4.5 text-gold-300" />
              </div>
              <div>
                <p className="text-ink-950 font-medium text-sm">Call us</p>
                <p className="text-steel-400 text-sm mt-0.5">+91  98159-62612</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-ink-950 flex items-center justify-center shrink-0">
                <Mail className="w-4.5 h-4.5 text-gold-300" />
              </div>
              <div>
                <p className="text-ink-950 font-medium text-sm">Email us</p>
                <p className="text-steel-400 text-sm mt-0.5"> singla_vikas123@yahoo.com</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-ink-950 flex items-center justify-center shrink-0">
                <Clock className="w-4.5 h-4.5 text-gold-300" />
              </div>
              <div>
                <p className="text-ink-950 font-medium text-sm">Office hours</p>
                <p className="text-steel-400 text-sm mt-0.5">Mon–Sat, 9:00 AM – 7:00 PM</p>
              </div>
            </div>
          </div>

          {/* Google Map placeholder */}
          <div className="mt-8 aspect-video rounded-2xl bg-ink-950 border border-steel-300/20 flex items-center justify-center relative overflow-hidden">
          <iframe
              title="Vanita Math Classes location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3447.3869558390084!2d74.92967277383212!3d30.22603990994704!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391733d338e5649f%3A0xd4fa3403876bb165!2sVANITA%20MATH%20CLASSES%20-%20Best%20Mathematics%20coaching%20%2F%20tuition%20center%20in%20Bathinda!5e0!3m2!1sen!2sin!4v1786950620258!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl p-7 sm:p-8 border border-steel-300/15 h-fit"
        >
          {sent ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-ink-950 font-medium text-lg">Message sent!</h3>
              <p className="text-steel-400 text-sm mt-2">We'll be in touch within one working day.</p>
              <button onClick={() => setSent(false)} className="mt-5 text-mark text-sm font-medium hover:underline">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{errors.root.message}</div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Your name</label>
                  <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Full name" />
                  {errors.name && <p className="error-msg">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@example.com" />
                  {errors.email && <p className="error-msg">{errors.email.message}</p>}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone (optional)</label>
                  <input {...register('phone')} type="tel" className="input" placeholder="10-digit mobile" />
                </div>
                <div>
                  <label className="label">Interested standard</label>
                  <select {...register('interestedStandard')} className="input">
                    <option value="">Select standard</option>
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Message</label>
                <textarea {...register('message')} rows={4} className={`input resize-none ${errors.message ? 'input-error' : ''}`} placeholder="Tell us what you're looking for..." />
                {errors.message && <p className="error-msg">{errors.message.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : 'Send message'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Phone, Mail, Clock, Loader2, CheckCircle2, Send } from 'lucide-react'
import { contactService } from '@/services/index'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Enter student name'),
  parentName: z.string().min(2, 'Enter parent / guardian name'),
  phone: z.string().min(10, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  class: z.string().min(1, 'Select class'),
  school: z.string().optional(),
  preferredBatch: z.string().optional(),
  message: z.string().optional(),
})

const CLASSES = ['8th', '9th', '10th', '+1', '+2']
const BATCHES = ['Morning', 'Evening', 'Weekend', 'Any Batch']

export default function Contact() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { class: '10th', preferredBatch: 'Evening' },
  })

  const onSubmit = async (data) => {
    try {
      await contactService.submit(data)
      setSent(true)
      toast.success('Your enquiry has been received! We will contact you shortly.')
      reset()
    } catch (err) {
      setError('root', {
        message: err.response?.data?.message || 'Could not submit enquiry. Please call us directly.',
      })
    }
  }

  return (
    <section id="contact" className="bg-gray-50 py-20 sm:py-28 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-5"
        >
          <span className="text-primary-600 font-bold text-xs tracking-wider uppercase mb-2 block">
            Admissions & Enquiries
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Take the First Step to Mathematics Mastery.
          </h2>
          <p className="mt-4 text-gray-600 text-sm leading-relaxed">
            Fill in the enquiry form or contact us directly. We will schedule an interaction to understand your child's learning stage and recommend the right batch.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Class Address</p>
                <p className="text-gray-900 font-bold text-sm mt-0.5">
                  #302, Phase-II, Vishal Nagar, Bathinda, Punjab
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone / WhatsApp</p>
                <a
                  href="tel:+919815962612"
                  className="text-gray-900 font-bold text-sm mt-0.5 hover:text-primary-600 transition-colors block"
                >
                  +91 98159-62612
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow-2xs">
              <div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tuition Timings</p>
                <p className="text-gray-900 font-bold text-sm mt-0.5">
                  Mon – Sat: Morning & Evening Batches
                </p>
              </div>
            </div>
          </div>

          {/* Google Maps Embed */}
          <div className="mt-6 aspect-video rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
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

        {/* Right Student Enquiry Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-7"
        >
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-lg">
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              Submit Student Enquiry
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              No account creation needed. We will respond promptly with admission & batch options.
            </p>

            {sent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="text-xl font-extrabold text-emerald-900">Enquiry Received!</h4>
                <p className="text-xs text-emerald-700 mt-2 max-w-sm mx-auto leading-relaxed">
                  Thank you for enquiring with Vanita Math Classes. Mrs. Vanita Rani Gupta will review your submission and contact you shortly.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="btn btn-outline btn-sm border-emerald-300 text-emerald-800 hover:bg-emerald-100 mt-6"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errors.root && (
                  <div className="bg-red-50 border border-red-200 text-primary-800 text-xs px-4 py-3 rounded-xl">
                    {errors.root.message}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Student Name <span className="text-primary-600">*</span>
                    </label>
                    <input
                      {...register('name')}
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.name ? 'border-primary-500 bg-red-50/20' : 'border-gray-300'
                      }`}
                      placeholder="e.g. Navjot Singh"
                    />
                    {errors.name && (
                      <p className="text-[11px] text-primary-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Parent / Guardian Name <span className="text-primary-600">*</span>
                    </label>
                    <input
                      {...register('parentName')}
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.parentName ? 'border-primary-500 bg-red-50/20' : 'border-gray-300'
                      }`}
                      placeholder="e.g. Gurpreet Singh"
                    />
                    {errors.parentName && (
                      <p className="text-[11px] text-primary-600 mt-1">{errors.parentName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Phone Number (WhatsApp) <span className="text-primary-600">*</span>
                    </label>
                    <input
                      {...register('phone')}
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.phone ? 'border-primary-500 bg-red-50/20' : 'border-gray-300'
                      }`}
                      placeholder="e.g. 9815962612"
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-primary-600 mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Email Address (optional)
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g. parent@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Class / Standard <span className="text-primary-600">*</span>
                    </label>
                    <select
                      {...register('class')}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {CLASSES.map((c) => (
                        <option key={c} value={c}>
                          Class {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Preferred Batch
                    </label>
                    <select
                      {...register('preferredBatch')}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {BATCHES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      School Name
                    </label>
                    <input
                      {...register('school')}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g. St. Xavier's"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Message / Current Mathematics Challenges (optional)
                  </label>
                  <textarea
                    {...register('message')}
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Tell us about specific topics (e.g. trigonometry, algebra) or queries..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full justify-center gap-2 py-3.5 text-sm font-bold shadow-md rounded-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Enquiry…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Enquiry
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

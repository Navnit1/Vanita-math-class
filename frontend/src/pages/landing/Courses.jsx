import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Check, Users, Clock, GraduationCap, Sparkles, UserPlus } from 'lucide-react'
import { batchService } from '@/services'
import { BATCH_DEFINITIONS } from '@/config/pricing'
import { formatCurrency } from '@/lib/utils'

export default function Courses() {
  const { data: liveBatches, isLoading } = useQuery({
    queryKey: ['public-batches'],
    queryFn: batchService.getAll,
    staleTime: 30000,
  })

  // Merge live database enrolled counts with authoritative configuration
  const batches = (liveBatches && liveBatches.length > 0)
    ? liveBatches
    : BATCH_DEFINITIONS.map(b => ({ ...b, enrolledCount: 0, enrollmentPercentage: 0 }))

  return (
    <section id="courses" className="bg-[#FAFAFA] py-20 sm:py-28 border-b border-[#D9DDE3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14"
        >
          <div>
            <span className="text-[#E50914] font-bold text-xs tracking-wider uppercase mb-2 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Authoritative Batch Schedule & Fees
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
              Small-Batch Mathematics Coaching (8th to +2)
            </h2>
          </div>
          <p className="text-[#64748B] text-sm max-w-sm">
            Strictly limited batch sizes ensuring personal attention, weekly test evaluations, and 100% board curriculum alignment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((b, i) => {
            const enrolled = b.enrolledCount ?? 0
            const maxCap = b.maxCapacity || 30
            const pct = b.enrollmentPercentage ?? Math.min(100, Math.round((enrolled / maxCap) * 100))
            const isFull = pct >= 100

            return (
              <motion.div
                key={b.standard}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="bg-white rounded-2xl p-6 border border-[#D9DDE3] hover:border-[#E50914] hover:shadow-card transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#FFF5F5] text-[#C90019] border border-[#FFCCD0]">
                      {b.standardLabel}
                    </span>
                    <span className="text-xs font-bold text-[#171717] bg-[#F3F4F6] px-2.5 py-1 rounded-lg">
                      {formatCurrency(b.monthlyFee)} <span className="text-[10px] text-[#64748B] font-normal">/ mo</span>
                    </span>
                  </div>

                  {/* Batch Title & Focus */}
                  <h3 className="text-lg font-black text-[#171717] mb-1 group-hover:text-[#E50914] transition-colors leading-snug">
                    {b.batchTitle}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed mb-4 min-h-[2.5rem]">
                    {b.description || b.focus}
                  </p>

                  {/* Timing & Faculty */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#FAFAFA] border border-[#D9DDE3] text-xs text-[#171717] mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
                      <span className="font-medium text-[11px] truncate">{b.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
                      <span className="font-semibold text-[11px]">{b.faculty}</span>
                    </div>
                  </div>

                  {/* Live Database Enrollment Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-[#64748B] flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#E50914]" />
                        <strong>{enrolled}</strong> active enrolled students
                      </span>
                      <span className="font-mono font-bold text-[#171717]">
                        {isFull ? (
                          <span className="text-[#C90019]">Batch Full</span>
                        ) : (
                          `${maxCap - enrolled} seats left`
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden border border-[#D9DDE3]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 90 ? 'bg-[#C90019]' : pct >= 60 ? 'bg-[#F59E0B]' : 'bg-[#E50914]'
                        }`}
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Features Checklist */}
                  <div className="pt-3 border-t border-[#F3F4F6] space-y-1.5">
                    {(b.features || []).map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#171717]">
                        <Check className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-6 pt-4 border-t border-[#D9DDE3] flex items-center gap-2">
                  <a
                    href="#contact"
                    className="btn btn-secondary btn-sm flex-1 text-center justify-center text-xs font-semibold"
                  >
                    Enquire Now
                  </a>
                  <Link
                    to={`/register?class=${encodeURIComponent(b.standard)}`}
                    className="btn btn-primary btn-sm flex-1 text-center justify-center text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <UserPlus className="w-3 h-3" />
                    Register
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#FFF5F5] via-white to-[#FFF5F5] border border-[#FFCCD0] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="font-extrabold text-base text-[#171717]">Need Guidance on Standard Selection or Syllabus?</h4>
            <p className="text-xs text-[#64748B] mt-0.5">
              Talk directly with Mrs. Vanita Rani Gupta for personal syllabus assessment and batch allocation.
            </p>
          </div>
          <a
            href="tel:9815962612"
            className="btn btn-primary btn-sm font-bold text-xs shrink-0 shadow-xs"
          >
            Call 98159-62612
          </a>
        </div>
      </div>
    </section>
  )
}

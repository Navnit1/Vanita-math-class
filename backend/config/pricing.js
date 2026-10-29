/**
 * Central authoritative pricing and batch configuration for Vanita Math Classes (VMC).
 * 
 * AUTHORITATIVE MONTHLY FEES (Single source of truth):
 * - Class 8th:  ₹1,800/month
 * - Class 9th:  ₹2,000/month
 * - Class 10th: ₹2,500/month
 * - Class +1:   ₹3,000/month
 * - Class +2:   ₹3,500/month
 */

export const CLASS_PRICING = {
  '8th': 1800,
  '8': 1800,
  '9th': 2000,
  '9': 2000,
  '10th': 2500,
  '10': 2500,
  '+1': 3000,
  '11th': 3000,
  '11': 3000,
  '+2': 3500,
  '12th': 3500,
  '12': 3500,
}

export const BATCH_DEFINITIONS = [
  {
    standard: '8th',
    standardLabel: 'Class 8',
    batchTitle: 'Mathematics Foundation & NTSE',
    monthlyFee: 1800,
    annualFee: 18000,
    schedule: 'Mon, Wed, Fri · 04:00 PM – 05:00 PM',
    faculty: 'Vanita Rani Gupta (17+ Yrs Exp)',
    maxCapacity: 30,
    focus: 'Rational Numbers, Linear Equations, Algebraic Expressions & Mensuration',
    description: 'Strong foundation in NCERT, Olympiads, and NTSE mental ability.',
    features: ['Strong algebra fundamentals', 'School exam prep', 'Weekly practice tests'],
  },
  {
    standard: '9th',
    standardLabel: 'Class 9',
    batchTitle: 'Comprehensive Mathematics (CBSE/ICSE)',
    monthlyFee: 2000,
    annualFee: 20000,
    schedule: 'Tue, Thu, Sat · 04:00 PM – 05:00 PM',
    faculty: 'Vanita Rani Gupta (17+ Yrs Exp)',
    maxCapacity: 30,
    focus: 'Number Systems, Polynomials, Coordinate Geometry, Triangles & Circles',
    description: 'In-depth conceptual mastery for CBSE and ICSE board syllabi.',
    features: ['Step-by-step theorem proofs', 'NCERT + exemplar mastery', 'Regular doubt clearing'],
  },
  {
    standard: '10th',
    standardLabel: 'Class 10',
    batchTitle: 'Board Target & Mathematics Mastery',
    monthlyFee: 2500,
    annualFee: 25000,
    schedule: 'Mon to Fri · 05:00 PM – 06:15 PM',
    faculty: 'Vanita Rani Gupta (17+ Yrs Exp)',
    maxCapacity: 35,
    focus: 'Real Numbers, Quadratic Equations, Trigonometry & Surface Areas',
    description: 'Target 100/100 in Class 10 Board Examinations with weekly rigorous testing.',
    features: ['Board exam test series', '100% past year questions', 'Time management coaching'],
  },
  {
    standard: '+1',
    standardLabel: 'Class +1 / 11th',
    batchTitle: 'Advanced Mathematics (Core & Calculus)',
    monthlyFee: 3000,
    annualFee: 30000,
    schedule: 'Mon to Fri · 06:15 PM – 07:30 PM',
    faculty: 'Vanita Rani Gupta (17+ Yrs Exp)',
    maxCapacity: 35,
    focus: 'Sets, Trigonometric Functions, Permutations, Conic Sections & Calculus Intro',
    description: 'Rigorous coaching for Sets, Relations, Trigonometry, and introductory Calculus.',
    features: ['Deep conceptual grounding', 'Higher secondary rigor', 'Formula derivations'],
  },
  {
    standard: '+2',
    standardLabel: 'Class +2 / 12th',
    batchTitle: 'Board Excellence & Competitive Math',
    monthlyFee: 3500,
    annualFee: 35000,
    schedule: 'Mon to Sat · 07:30 PM – 08:45 PM',
    faculty: 'Vanita Rani Gupta (17+ Yrs Exp)',
    maxCapacity: 35,
    focus: 'Relations & Functions, Matrices, Continuity & Diff, Integrals, Vectors & 3D',
    description: 'Complete syllabus completion, Calculus mastery, Sample Papers, and JEE/CUET prep.',
    features: ['Board topper strategies', 'Integration speed techniques', 'Weekly full mock tests'],
  },
]

export const normalizeStandard = (cls) => {
  if (!cls) return '10th'
  const s = String(cls).trim().toLowerCase().replace(/class/i, '').trim()
  if (s === '8' || s === '8th') return '8th'
  if (s === '9' || s === '9th') return '9th'
  if (s === '10' || s === '10th') return '10th'
  if (s === '11' || s === '11th' || s === '+1' || s === 'plus one') return '+1'
  if (s === '12' || s === '12th' || s === '+2' || s === 'plus two') return '+2'
  return cls
}

export const getStandardMonthlyFee = (cls) => {
  const norm = normalizeStandard(cls)
  return CLASS_PRICING[norm] || 2500
}

export const getStandardAnnualFee = (cls) => {
  return getStandardMonthlyFee(cls) * 10
}

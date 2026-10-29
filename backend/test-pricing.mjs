import assert from 'node:assert'
import {
  CLASS_PRICING,
  BATCH_DEFINITIONS,
  normalizeStandard,
  getStandardMonthlyFee,
  getStandardAnnualFee,
} from './config/pricing.js'

console.log('🧪 Starting Vanita Math Classes Central Pricing & Batch Tests...\n')

// Test 1: Authoritative fees
console.log('Test 1: Single source of truth fees for all 5 standards')
assert.strictEqual(getStandardMonthlyFee('8th'), 1800, 'Class 8th must be 1800')
assert.strictEqual(getStandardMonthlyFee('Class 8'), 1800, 'Class 8 must normalize to 1800')
assert.strictEqual(getStandardMonthlyFee('9th'), 2000, 'Class 9th must be 2000')
assert.strictEqual(getStandardMonthlyFee('Class 9'), 2000, 'Class 9 must normalize to 2000')
assert.strictEqual(getStandardMonthlyFee('10th'), 2500, 'Class 10th must be 2500')
assert.strictEqual(getStandardMonthlyFee('+1'), 3000, 'Class +1 must be 3000')
assert.strictEqual(getStandardMonthlyFee('11th'), 3000, 'Class 11th must be 3000')
assert.strictEqual(getStandardMonthlyFee('+2'), 3500, 'Class +2 must be 3500')
assert.strictEqual(getStandardMonthlyFee('12th'), 3500, 'Class 12th must be 3500')
console.log('  ✅ Authoritative monthly fee mappings verified.\n')

// Test 2: Standard normalization
console.log('Test 2: normalizeStandard helper')
assert.strictEqual(normalizeStandard('8'), '8th')
assert.strictEqual(normalizeStandard('Class 8th'), '8th')
assert.strictEqual(normalizeStandard('9th'), '9th')
assert.strictEqual(normalizeStandard('10'), '10th')
assert.strictEqual(normalizeStandard('11th'), '+1')
assert.strictEqual(normalizeStandard('+1'), '+1')
assert.strictEqual(normalizeStandard('12th'), '+2')
assert.strictEqual(normalizeStandard('+2'), '+2')
console.log('  ✅ Standard normalizer verified.\n')

// Test 3: Batch definitions completeness
console.log('Test 3: 5 Fixed Batch Definitions')
assert.strictEqual(BATCH_DEFINITIONS.length, 5, 'Must contain exactly 5 batch definitions')
const standards = BATCH_DEFINITIONS.map(b => b.standard)
assert.deepStrictEqual(standards, ['8th', '9th', '10th', '+1', '+2'], 'Standards must be 8th, 9th, 10th, +1, +2')

const expectedFees = [1800, 2000, 2500, 3000, 3500]
BATCH_DEFINITIONS.forEach((b, idx) => {
  assert.strictEqual(b.monthlyFee, expectedFees[idx], `${b.standard} fee must be ${expectedFees[idx]}`)
  assert(b.schedule, `Schedule must be defined for ${b.standard}`)
  assert(b.faculty.includes('Vanita Rani Gupta'), `Faculty must be Vanita Rani Gupta for ${b.standard}`)
  assert(b.maxCapacity >= 30, `Capacity must be defined for ${b.standard}`)
})
console.log('  ✅ Batch definitions verified.\n')

console.log('🎉 ALL PRICING & BATCH TESTS PASSED!')

import { describe, it, expect } from 'vitest'
import { calcPercentScheduled, calcPercentComplete, calculateEVM } from './evm'

describe('calcPercentScheduled', () => {
  const start = new Date('2025-01-01')
  const end = new Date('2025-01-11') // 10-day range

  it('returns 0 before the start date', () => {
    const now = new Date('2024-12-25')
    expect(calcPercentScheduled(start, end, now)).toBe(0)
  })

  it('returns 1 after the end date', () => {
    const now = new Date('2025-02-01')
    expect(calcPercentScheduled(start, end, now)).toBe(1)
  })

  it('returns 0.5 at the midpoint', () => {
    const now = new Date('2025-01-06') // 5 days into 10-day range
    expect(calcPercentScheduled(start, end, now)).toBe(0.5)
  })

  it('returns 0 exactly at start', () => {
    expect(calcPercentScheduled(start, end, start)).toBe(0)
  })

  it('returns 1 exactly at end', () => {
    expect(calcPercentScheduled(start, end, end)).toBe(1)
  })

  it('returns 1 when start equals end (zero duration)', () => {
    const same = new Date('2025-01-01')
    expect(calcPercentScheduled(same, same, same)).toBe(1)
  })
})

describe('calcPercentComplete', () => {
  it('returns 0 for empty tasks', () => {
    expect(calcPercentComplete([])).toBe(0)
  })

  it('returns 1 when all tasks are done', () => {
    const tasks = [{ status: 'done' }, { status: 'done' }, { status: 'done' }]
    expect(calcPercentComplete(tasks)).toBe(1)
  })

  it('returns 0 when all tasks are todo', () => {
    const tasks = [{ status: 'todo' }, { status: 'todo' }]
    expect(calcPercentComplete(tasks)).toBe(0)
  })

  it('returns 0.5 for in_progress tasks', () => {
    const tasks = [{ status: 'in_progress' }]
    expect(calcPercentComplete(tasks)).toBe(0.5)
  })

  it('handles mixed statuses correctly', () => {
    // 1 done (1) + 1 in_progress (0.5) + 1 todo (0) + 1 blocked (0) = 1.5 / 4
    const tasks = [
      { status: 'done' },
      { status: 'in_progress' },
      { status: 'todo' },
      { status: 'blocked' },
    ]
    expect(calcPercentComplete(tasks)).toBe(0.375)
  })

  it('treats unknown statuses as zero weight', () => {
    const tasks = [{ status: 'unknown_status' }]
    expect(calcPercentComplete(tasks)).toBe(0)
  })
})

describe('calculateEVM', () => {
  it('calculates full EVM metrics with known inputs', () => {
    // BAC = 100,000 halalas, 50% through timeline, 2 of 4 tasks done
    const result = calculateEVM({
      budgetAtCompletion: 100_000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-11'),
      now: new Date('2025-01-06'), // 50% scheduled
      tasks: [
        { status: 'done' },
        { status: 'done' },
        { status: 'todo' },
        { status: 'todo' },
      ],
      totalExpenses: 40_000,
    })

    // PV = 100,000 * 0.5 = 50,000
    expect(result.plannedValue).toBe(50_000)
    // EV = 100,000 * 0.5 = 50,000
    expect(result.earnedValue).toBe(50_000)
    // AC = 40,000
    expect(result.actualCost).toBe(40_000)
    // SV = EV - PV = 0
    expect(result.scheduleVariance).toBe(0)
    // CV = EV - AC = 10,000
    expect(result.costVariance).toBe(10_000)
    // SPI = EV / PV = 1
    expect(result.schedulePerformanceIndex).toBe(1)
    // CPI = EV / AC = 50000 / 40000 = 1.25
    expect(result.costPerformanceIndex).toBe(1.25)
    // EAC = BAC / CPI = 100000 / 1.25 = 80,000
    expect(result.estimateAtCompletion).toBe(80_000)
    // ETC = EAC - AC = 80000 - 40000 = 40,000
    expect(result.estimateToComplete).toBe(40_000)
    // VAC = BAC - EAC = 100000 - 80000 = 20,000
    expect(result.varianceAtCompletion).toBe(20_000)
    // Percent complete = 50%
    expect(result.percentComplete).toBe(50)
    // Percent scheduled = 50%
    expect(result.percentScheduled).toBe(50)
  })

  it('handles zero budget', () => {
    const result = calculateEVM({
      budgetAtCompletion: 0,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-11'),
      now: new Date('2025-01-06'),
      tasks: [{ status: 'done' }],
      totalExpenses: 0,
    })

    expect(result.plannedValue).toBe(0)
    expect(result.earnedValue).toBe(0)
    expect(result.actualCost).toBe(0)
    expect(result.budgetAtCompletion).toBe(0)
    expect(result.schedulePerformanceIndex).toBe(0)
    expect(result.costPerformanceIndex).toBe(0)
  })

  it('handles all tasks complete', () => {
    const result = calculateEVM({
      budgetAtCompletion: 200_000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-11'),
      now: new Date('2025-01-11'), // 100% through timeline
      tasks: [{ status: 'done' }, { status: 'done' }],
      totalExpenses: 200_000,
    })

    expect(result.percentComplete).toBe(100)
    expect(result.percentScheduled).toBe(100)
    expect(result.earnedValue).toBe(200_000)
    expect(result.plannedValue).toBe(200_000)
    expect(result.costPerformanceIndex).toBe(1)
    expect(result.schedulePerformanceIndex).toBe(1)
  })

  it('handles no tasks', () => {
    const result = calculateEVM({
      budgetAtCompletion: 50_000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-11'),
      now: new Date('2025-01-06'),
      tasks: [],
      totalExpenses: 10_000,
    })

    expect(result.percentComplete).toBe(0)
    expect(result.earnedValue).toBe(0)
    expect(result.costVariance).toBe(-10_000)
  })

  it('handles over-budget scenario', () => {
    const result = calculateEVM({
      budgetAtCompletion: 100_000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-11'),
      now: new Date('2025-01-06'),
      tasks: [{ status: 'done' }, { status: 'todo' }],
      totalExpenses: 80_000,
    })

    // EV = 100,000 * 0.5 = 50,000, AC = 80,000
    // CV = 50,000 - 80,000 = -30,000
    expect(result.costVariance).toBe(-30_000)
    // CPI = 50000 / 80000 = 0.625
    expect(result.costPerformanceIndex).toBe(0.63) // rounded to 2 decimals
  })
})

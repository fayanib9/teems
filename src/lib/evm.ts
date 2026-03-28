/**
 * Earned Value Management (EVM) calculations for event projects.
 * All monetary values are in halalas (1 SAR = 100 halalas).
 */

export type EVMMetrics = {
  // Core metrics
  plannedValue: number       // PV: budgeted cost of work scheduled
  earnedValue: number        // EV: budgeted cost of work performed
  actualCost: number         // AC: actual cost of work performed
  budgetAtCompletion: number // BAC: total budget

  // Performance indices
  scheduleVariance: number          // SV = EV - PV
  costVariance: number              // CV = EV - AC
  schedulePerformanceIndex: number  // SPI = EV / PV
  costPerformanceIndex: number      // CPI = EV / AC

  // Forecasts
  estimateAtCompletion: number  // EAC = BAC / CPI
  estimateToComplete: number    // ETC = EAC - AC
  varianceAtCompletion: number  // VAC = BAC - EAC

  // Progress
  percentComplete: number   // % tasks done
  percentScheduled: number  // % of timeline elapsed
}

export type EVMInput = {
  budgetAtCompletion: number
  startDate: Date
  endDate: Date
  now?: Date
  tasks: { status: string }[]
  totalExpenses: number // sum of expense amounts (halalas)
}

/**
 * Calculate % of timeline elapsed, clamped to [0, 1].
 */
export function calcPercentScheduled(start: Date, end: Date, now: Date): number {
  const totalDuration = end.getTime() - start.getTime()
  if (totalDuration <= 0) return 1
  const elapsed = now.getTime() - start.getTime()
  return Math.max(0, Math.min(1, elapsed / totalDuration))
}

/**
 * Calculate % of tasks completed.
 * Weights: done = 1, in_progress = 0.5, todo/blocked = 0.
 */
export function calcPercentComplete(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0
  const weighted = tasks.reduce((sum, t) => {
    if (t.status === 'done') return sum + 1
    if (t.status === 'in_progress') return sum + 0.5
    return sum
  }, 0)
  return weighted / tasks.length
}

/**
 * Calculate full EVM metrics from inputs.
 */
export function calculateEVM(input: EVMInput): EVMMetrics {
  const { budgetAtCompletion, startDate, endDate, tasks, totalExpenses } = input
  const now = input.now ?? new Date()

  const bac = budgetAtCompletion
  const percentScheduled = calcPercentScheduled(startDate, endDate, now)
  const percentComplete = calcPercentComplete(tasks)

  // Core metrics
  const plannedValue = bac * percentScheduled
  const earnedValue = bac * percentComplete
  const actualCost = totalExpenses

  // Variances
  const scheduleVariance = earnedValue - plannedValue
  const costVariance = earnedValue - actualCost

  // Performance indices (guard against division by zero)
  const schedulePerformanceIndex = plannedValue === 0 ? 0 : earnedValue / plannedValue
  const costPerformanceIndex = actualCost === 0 ? 0 : earnedValue / actualCost

  // Forecasts
  const estimateAtCompletion = costPerformanceIndex === 0 ? 0 : bac / costPerformanceIndex
  const estimateToComplete = Math.max(0, estimateAtCompletion - actualCost)
  const varianceAtCompletion = bac - estimateAtCompletion

  return {
    plannedValue: Math.round(plannedValue),
    earnedValue: Math.round(earnedValue),
    actualCost,
    budgetAtCompletion: bac,
    scheduleVariance: Math.round(scheduleVariance),
    costVariance: Math.round(costVariance),
    schedulePerformanceIndex: round2(schedulePerformanceIndex),
    costPerformanceIndex: round2(costPerformanceIndex),
    estimateAtCompletion: Math.round(estimateAtCompletion),
    estimateToComplete: Math.round(estimateToComplete),
    varianceAtCompletion: Math.round(varianceAtCompletion),
    percentComplete: round2(percentComplete * 100),
    percentScheduled: round2(percentScheduled * 100),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export type ComplexityWeight = {
  factor: string
  weight: number
  value: number // 0-1 normalized
}

/**
 * Calculate a 0-100 complexity score from weighted factors.
 */
export function calculateComplexity(weights: ComplexityWeight[]): number {
  if (weights.length === 0) return 0

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
  if (totalWeight === 0) return 0

  const weightedSum = weights.reduce((sum, w) => sum + (w.weight * w.value), 0)
  const score = Math.round((weightedSum / totalWeight) * 100)

  return Math.max(0, Math.min(100, score))
}

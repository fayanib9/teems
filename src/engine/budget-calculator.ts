import { db } from '@/db'
import { budget_category_defaults } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { BudgetFormData, BudgetResult, BudgetBreakdownItem } from './types'

export async function calculateBudget(formData: BudgetFormData): Promise<BudgetResult> {
  const defaults = await db
    .select()
    .from(budget_category_defaults)
    .where(eq(budget_category_defaults.is_active, true))

  const breakdown: BudgetBreakdownItem[] = []
  let totalEstimated = 0

  // Duration factor: multi-day events cost more
  const durationFactor = 1 + (formData.duration_days - 1) * 0.3

  for (const service of formData.services) {
    const categoryDefault = defaults.find(d => d.category === service)
    if (!categoryDefault) continue

    const rawCost = categoryDefault.base_cost_per_person * formData.attendees * durationFactor

    // Apply modifiers as additive premiums (not multiplicative)
    // to avoid compounding: baseCost * (1 + sum_of_premiums)
    let premium = 0
    if (formData.has_vip) premium += 0.3
    if (formData.venue_type === 'outdoor') premium += 0.2
    if (formData.has_government) premium += 0.25
    if (formData.has_international_speakers && service === 'production') premium += 0.15
    let baseCost = rawCost * (1 + premium)

    const cost = Math.round(baseCost)
    totalEstimated += cost

    breakdown.push({
      category: service,
      label: categoryDefault.label,
      estimated_cost: cost,
      percentage: 0, // calculated after total
      notes: '',
    })
  }

  // Always add venue if not in services
  if (!formData.services.includes('venue')) {
    const venueDefault = defaults.find(d => d.category === 'venue')
    if (venueDefault) {
      const rawVenueCost = venueDefault.base_cost_per_person * formData.attendees * durationFactor
      let venuePremium = 0
      if (formData.venue_type === 'outdoor') venuePremium += 0.2
      if (formData.has_government) venuePremium += 0.25
      let venueCost = rawVenueCost * (1 + venuePremium)
      const cost = Math.round(venueCost)
      totalEstimated += cost
      breakdown.push({
        category: 'venue',
        label: venueDefault.label,
        estimated_cost: cost,
        percentage: 0,
        notes: 'Automatically included',
      })
    }
  }

  // Calculate percentages
  for (const item of breakdown) {
    item.percentage = totalEstimated > 0 ? Math.round((item.estimated_cost / totalEstimated) * 100) : 0
  }

  // Sort by cost descending
  breakdown.sort((a, b) => b.estimated_cost - a.estimated_cost)

  // Benchmarks
  const costPerPerson = totalEstimated > 0 ? Math.round(totalEstimated / formData.attendees) : 0
  const benchmarks = [
    { label: 'Cost per Person', value: `${(costPerPerson / 100).toLocaleString()} SAR` },
    { label: 'Cost per Day', value: `${(Math.round(totalEstimated / formData.duration_days) / 100).toLocaleString()} SAR` },
    { label: 'Categories', value: `${breakdown.length} line items` },
    { label: 'Duration Factor', value: `${durationFactor.toFixed(1)}x` },
  ]

  return {
    total_estimated: totalEstimated,
    breakdown,
    benchmarks,
    currency: 'SAR',
  }
}

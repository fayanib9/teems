import { db } from '@/db'
import { vendors, vendor_match_weights, event_vendors, events } from '@/db/schema'
import { eq, sql, count, and, lte, gte } from 'drizzle-orm'
import type { VendorMatchCriteria, VendorMatchResult } from './types'

/** Map budget_range labels to SAR halala ranges */
const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  'under_500k': { min: 0, max: 50_000_000 },
  '500k_2m': { min: 50_000_000, max: 200_000_000 },
  '2m_10m': { min: 200_000_000, max: 1_000_000_000 },
  'over_10m': { min: 1_000_000_000, max: Infinity },
}

export async function matchVendors(criteria: VendorMatchCriteria): Promise<VendorMatchResult[]> {
  // Load weights
  const weights = await db
    .select()
    .from(vendor_match_weights)
    .where(eq(vendor_match_weights.is_active, true))

  const weightMap: Record<string, number> = {}
  for (const w of weights) {
    weightMap[w.criterion] = w.weight
  }

  // Load all active vendors
  const allVendors = await db
    .select()
    .from(vendors)
    .where(eq(vendors.is_active, true))

  // Load past event counts and average contract amounts per vendor
  const vendorEventCounts = await db
    .select({
      vendor_id: event_vendors.vendor_id,
      event_count: count(),
      avg_contract: sql<number>`COALESCE(AVG(${event_vendors.contract_amount}), 0)`,
    })
    .from(event_vendors)
    .groupBy(event_vendors.vendor_id)

  const eventCountMap: Record<number, number> = {}
  const avgContractMap: Record<number, number> = {}
  for (const v of vendorEventCounts) {
    if (v.vendor_id) {
      eventCountMap[v.vendor_id] = v.event_count
      avgContractMap[v.vendor_id] = Number(v.avg_contract)
    }
  }

  // Load vendors with overlapping events for availability check
  const busyVendorIds = new Set<number>()
  if (criteria.event_date) {
    const eventDateStr = criteria.event_date
    const overlapping = await db
      .select({ vendor_id: event_vendors.vendor_id })
      .from(event_vendors)
      .innerJoin(events, eq(event_vendors.event_id, events.id))
      .where(
        and(
          lte(events.start_date, new Date(eventDateStr)),
          gte(events.end_date, new Date(eventDateStr))
        )
      )
    for (const row of overlapping) {
      if (row.vendor_id) busyVendorIds.add(row.vendor_id)
    }
  }

  const totalWeight = Object.values(weightMap).reduce((sum, w) => sum + w, 0) || 100
  const results: VendorMatchResult[] = []

  for (const vendor of allVendors) {
    const scoreBreakdown: { criterion: string; score: number; weight: number }[] = []

    // Category match
    const categoryWeight = weightMap['category_match'] || 30
    const categoryMatch = criteria.services_needed.some(s =>
      vendor.category?.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(vendor.category?.toLowerCase() || '')
    )
    const categoryScore = categoryMatch ? 100 : 0
    scoreBreakdown.push({ criterion: 'Category Match', score: categoryScore, weight: categoryWeight })

    // Rating
    const ratingWeight = weightMap['rating'] || 25
    const ratingScore = vendor.rating ? (vendor.rating / 5) * 100 : 50
    scoreBreakdown.push({ criterion: 'Rating', score: Math.round(ratingScore), weight: ratingWeight })

    // Budget fit: compare vendor's average contract amount against criteria budget range
    const budgetWeight = weightMap['budget_fit'] || 20
    const pastEvents = eventCountMap[vendor.id] || 0
    const avgContract = avgContractMap[vendor.id] || 0
    let budgetScore = 50 // default if no data
    const budgetRange = BUDGET_RANGES[criteria.budget_range]
    if (budgetRange && avgContract > 0) {
      if (avgContract >= budgetRange.min && avgContract <= budgetRange.max) {
        budgetScore = 100
      } else if (avgContract < budgetRange.min) {
        // Vendor typically handles smaller budgets
        budgetScore = Math.max(20, Math.round((avgContract / budgetRange.min) * 80))
      } else {
        // Vendor typically handles larger budgets (overqualified but still viable)
        budgetScore = Math.max(40, 100 - Math.round(((avgContract - budgetRange.max) / budgetRange.max) * 50))
      }
    }
    scoreBreakdown.push({ criterion: 'Budget Fit', score: budgetScore, weight: budgetWeight })

    // Experience
    const experienceWeight = weightMap['experience'] || 15
    const experienceScore = Math.min(100, pastEvents * 25)
    scoreBreakdown.push({ criterion: 'Experience', score: experienceScore, weight: experienceWeight })

    // Availability: check if vendor has events overlapping with criteria.event_date
    const availabilityWeight = weightMap['availability'] || 10
    const isBusy = busyVendorIds.has(vendor.id)
    const availabilityScore = isBusy ? 10 : 100
    scoreBreakdown.push({ criterion: 'Availability', score: availabilityScore, weight: availabilityWeight })

    // Calculate weighted score
    const weightedSum = scoreBreakdown.reduce((sum, s) => sum + (s.score * s.weight), 0)
    const totalScore = Math.round(weightedSum / totalWeight)

    // Only include vendors with some relevance (score > 20)
    if (totalScore > 20) {
      results.push({
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        category: vendor.category || 'General',
        score: totalScore,
        score_breakdown: scoreBreakdown,
        rating: vendor.rating || 0,
        past_events: pastEvents,
        contact_email: vendor.email || '',
        phone: vendor.phone || '',
      })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results
}

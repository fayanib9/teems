import { db } from '@/db'
import { risk_rules } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { evaluateCondition } from './evaluator'
import type { RiskFormData, RiskItem, RiskAssessmentResult, ConditionNode } from './types'

const SEVERITY_SCORES: Record<string, number> = {
  low: 10,
  medium: 30,
  high: 60,
  critical: 90,
}

export async function assessRisks(formData: RiskFormData): Promise<RiskAssessmentResult> {
  const rules = await db
    .select()
    .from(risk_rules)
    .where(eq(risk_rules.is_active, true))
    .orderBy(asc(risk_rules.priority))

  const risks: RiskItem[] = []

  for (const rule of rules) {
    let condition: ConditionNode
    let output: {
      level: string
      title: string
      description: string
      mitigation: string
    }
    try {
      condition = JSON.parse(rule.condition) as ConditionNode
      output = JSON.parse(rule.risk_output) as typeof output
    } catch (err) {
      console.warn(`Skipping risk rule ${rule.id} (${rule.name}): invalid JSON`, err)
      continue
    }

    if (evaluateCondition(condition, formData as unknown as Record<string, unknown>)) {
      risks.push({
        category: rule.category,
        severity: output.level as RiskItem['severity'],
        title: output.title,
        description: output.description,
        mitigation: output.mitigation,
        score: SEVERITY_SCORES[output.level] || 0,
      })
    }
  }

  // Calculate overall score and level
  const totalScore = risks.length > 0
    ? Math.round(risks.reduce((sum, r) => sum + r.score, 0) / risks.length)
    : 0

  let overallLevel: RiskAssessmentResult['overall_level'] = 'low'
  if (totalScore >= 70) overallLevel = 'critical'
  else if (totalScore >= 50) overallLevel = 'high'
  else if (totalScore >= 25) overallLevel = 'medium'

  // Group mitigations by category
  const mitigationMap: Record<string, string[]> = {}
  for (const risk of risks) {
    if (!mitigationMap[risk.category]) mitigationMap[risk.category] = []
    if (risk.mitigation) mitigationMap[risk.category].push(risk.mitigation)
  }

  const mitigations = Object.entries(mitigationMap).map(([category, actions]) => ({
    category,
    actions,
  }))

  // Summary
  const criticalCount = risks.filter(r => r.severity === 'critical').length
  const highCount = risks.filter(r => r.severity === 'high').length
  let summary = `Identified ${risks.length} risk(s) with an overall ${overallLevel} risk level.`
  if (criticalCount > 0) summary += ` ${criticalCount} critical risk(s) require immediate attention.`
  if (highCount > 0) summary += ` ${highCount} high-priority risk(s) should be addressed in planning.`
  if (risks.length === 0) summary = 'No significant risks identified for the current event parameters.'

  return {
    overall_level: overallLevel,
    score: totalScore,
    risks,
    mitigations,
    summary,
  }
}

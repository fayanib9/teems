'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { ArrowLeft, AlertTriangle, Shield, CheckCircle } from 'lucide-react'

type Risk = {
  category: string
  severity: string
  title: string
  description: string
  mitigation: string
  score: number
}

type Mitigation = {
  category: string
  actions: string[]
}

type Props = {
  assessment: {
    id: number
    name: string
    overall_risk_level: string
    score: number | null
    risks: Risk[]
    mitigations: Mitigation[]
    form_data: Record<string, unknown>
  }
}

function getLevelColor(level: string) {
  switch (level) {
    case 'low': return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
    case 'medium': return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' }
    case 'high': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' }
    case 'critical': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
    default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />
    case 'medium': return <Shield className="h-4 w-4 text-amber-500" />
    default: return <CheckCircle className="h-4 w-4 text-green-500" />
  }
}

export function RiskResultClient({ assessment }: Props) {
  const levelColors = getLevelColor(assessment.overall_risk_level)

  return (
    <>
      <PageHeader
        title={assessment.name}
        description="Risk assessment results and mitigation strategies"
        actions={
          <Link href="/tools/risks" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />Back
          </Link>
        }
      />

      {/* Overall Score */}
      <div className={`rounded-xl border ${levelColors.border} ${levelColors.bg} p-6 mb-6 text-center`}>
        <p className="text-sm text-text-tertiary mb-1">Overall Risk Level</p>
        <p className={`text-3xl font-bold capitalize ${levelColors.text}`}>{assessment.overall_risk_level}</p>
        <p className="text-sm text-text-secondary mt-1">Score: {assessment.score}/100</p>
      </div>

      {/* Risk Summary Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(['critical', 'high', 'medium', 'low'] as const).map(level => {
          const count = assessment.risks.filter(r => r.severity === level).length
          const colors = getLevelColor(level)
          return (
            <div key={level} className={`rounded-xl p-3 text-center ${colors.bg} border ${colors.border}`}>
              <p className={`text-xl font-bold ${colors.text}`}>{count}</p>
              <p className={`text-xs font-medium capitalize ${colors.text}`}>{level}</p>
            </div>
          )
        })}
      </div>

      {/* Risk List */}
      {assessment.risks.length > 0 && (
        <div className="bg-surface rounded-xl border border-border mb-6">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Identified Risks</h3>
          </div>
          <div className="divide-y divide-border">
            {assessment.risks.map((risk, i) => (
              <div key={i} className="p-5">
                <div className="flex items-start gap-3 mb-2">
                  {getSeverityIcon(risk.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-text-primary">{risk.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getLevelColor(risk.severity).bg} ${getLevelColor(risk.severity).text}`}>
                        {risk.severity}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{risk.category}</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-2">{risk.description}</p>
                    {risk.mitigation && (
                      <div className="bg-surface-secondary rounded-lg p-2.5">
                        <p className="text-xs font-medium text-text-tertiary mb-0.5">Mitigation</p>
                        <p className="text-xs text-text-secondary">{risk.mitigation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mitigation Plan */}
      {assessment.mitigations.length > 0 && (
        <div className="bg-surface rounded-xl border border-border">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary-500" />
              Mitigation Plan
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {assessment.mitigations.map((m, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 capitalize">{m.category}</p>
                <ul className="space-y-1">
                  {m.actions.map((action, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {assessment.risks.length === 0 && (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <h3 className="text-base font-medium text-text-primary">No Significant Risks</h3>
          <p className="text-sm text-text-secondary mt-1">The current parameters don&apos;t trigger any risk flags.</p>
        </div>
      )}
    </>
  )
}

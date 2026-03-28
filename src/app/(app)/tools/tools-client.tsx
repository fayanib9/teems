'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Wand2, Calculator, GitCompare, ShieldAlert, ArrowRight } from 'lucide-react'

const tools = [
  {
    title: 'Plan Generator',
    description: 'Generate comprehensive project plans with phases, tasks, timelines, and risk analysis from a simple questionnaire.',
    icon: Wand2,
    href: '/tools/planner',
    color: '#312C6A',
    bgColor: 'bg-[#312C6A]/10',
  },
  {
    title: 'Budget Calculator',
    description: 'Estimate itemized event budgets by category with benchmarks and cost-per-person analysis.',
    icon: Calculator,
    href: '/tools/budget',
    color: '#059669',
    bgColor: 'bg-emerald-50',
  },
  {
    title: 'Vendor Matcher',
    description: 'Score and rank vendors from your directory based on event requirements, budget, and past performance.',
    icon: GitCompare,
    href: '/tools/vendors',
    color: '#2563EB',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Risk Assessor',
    description: 'Analyze event parameters to identify risks, severity levels, and actionable mitigation strategies.',
    icon: ShieldAlert,
    href: '/tools/risks',
    color: '#DC2626',
    bgColor: 'bg-red-50',
  },
]

export function ToolsClient() {
  return (
    <>
      <PageHeader
        title="Smart Tools"
        description="Intelligent tools to help you plan, budget, match vendors, and assess risks for your events"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group bg-surface rounded-xl border border-border p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 ${tool.bgColor}`}>
                  <Icon className="h-6 w-6" style={{ color: tool.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary-700 transition-colors">
                      {tool.title}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

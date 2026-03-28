'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Workflow, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'

type Rule = {
  id: number
  name: string
  description: string | null
  category: string
  condition: unknown
  actions: unknown[]
  priority: number
  is_active: boolean | null
}

const CATEGORY_COLORS: Record<string, string> = {
  template_selection: 'bg-purple-100 text-purple-700',
  service_injection: 'bg-blue-100 text-blue-700',
  complexity: 'bg-amber-100 text-amber-700',
  timeline: 'bg-orange-100 text-orange-700',
  risk: 'bg-red-100 text-red-700',
  recommendation: 'bg-green-100 text-green-700',
}

export function RulesClient({ rules }: { rules: Rule[] }) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function toggleActive(id: number, current: boolean) {
    await fetch(`/api/tools/plan-rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    router.refresh()
  }

  async function deleteRule(id: number) {
    await fetch(`/api/tools/plan-rules/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    router.refresh()
  }

  return (
    <>
      <PageHeader title="Plan Rules" description="Manage dynamic rules that control plan generation" />

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Rule</th>
              <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Category</th>
              <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Priority</th>
              <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Actions</th>
              <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rules.map(rule => (
              <tr key={rule.id} className="hover:bg-surface-secondary transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-primary-500" />
                    <div>
                      <span className="text-sm font-medium text-text-primary">{rule.name}</span>
                      {rule.description && <p className="text-xs text-text-tertiary">{rule.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[rule.category] || 'bg-gray-100 text-gray-600'}`}>
                    {rule.category.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">{rule.priority}</td>
                <td className="px-4 py-3 text-xs text-text-secondary">{Array.isArray(rule.actions) ? rule.actions.length : 0} action(s)</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(rule.id, rule.is_active ?? true)} className="text-text-tertiary hover:text-primary-500">
                      {rule.is_active ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </button>
                    <button onClick={() => setDeleteId(rule.id)} className="text-text-tertiary hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete this rule?"
        message="This rule will be permanently removed. This action cannot be undone."
        confirmLabel="Delete Rule"
        variant="danger"
        onConfirm={() => deleteId && deleteRule(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </>
  )
}

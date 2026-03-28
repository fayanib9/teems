'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, CalendarDays, ClipboardList, UserPlus,
  ChevronRight, X, CheckCircle, Circle, Rocket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type Step = {
  label: string
  description: string
  href: string
  icon: React.ElementType
  completed: boolean
}

type Props = {
  hasClients: boolean
  hasEvents: boolean
  hasPlans: boolean
  hasTeamAssignments: boolean
}

const DISMISSED_KEY = 'teems_onboarding_dismissed'

export function GettingStarted({ hasClients, hasEvents, hasPlans, hasTeamAssignments }: Props) {
  const [dismissed, setDismissed] = useState(true) // Start hidden to avoid flash

  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_KEY)
    setDismissed(stored === 'true')
  }, [])

  if (dismissed) return null

  const steps: Step[] = [
    {
      label: 'Create your first client',
      description: 'Add a client to associate events with',
      href: '/clients',
      icon: Users,
      completed: hasClients,
    },
    {
      label: 'Create an event',
      description: 'Set up your first event with dates and venue',
      href: '/events/new',
      icon: CalendarDays,
      completed: hasEvents,
    },
    {
      label: 'Run the Plan Generator',
      description: 'Use AI tools to generate a comprehensive project plan',
      href: '/tools/planner/new',
      icon: ClipboardList,
      completed: hasPlans,
    },
    {
      label: 'Assign your team',
      description: 'Add team members to your event',
      href: hasEvents ? '/events' : '/teams',
      icon: UserPlus,
      completed: hasTeamAssignments,
    },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const allDone = completedCount === steps.length
  const percentage = Math.round((completedCount / steps.length) * 100)

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div className="bg-surface rounded-xl border border-primary-200 p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              {allDone ? 'All set!' : 'Getting Started with TEEMS'}
            </h3>
            <p className="text-sm text-text-secondary">
              {allDone ? 'You have completed all setup steps.' : `Complete these steps to get the most out of TEEMS (${completedCount}/${steps.length})`}
            </p>
          </div>
        </div>
        <button onClick={handleDismiss} className="p-1 text-text-tertiary hover:text-text-primary cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-primary-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <Link
              key={i}
              href={step.href}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                step.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-surface border-border hover:border-primary-200'
              }`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                step.completed ? 'bg-green-100' : 'bg-primary-50'
              }`}>
                {step.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Icon className="h-4 w-4 text-primary-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.completed ? 'text-green-700 line-through' : 'text-text-primary'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-text-tertiary">{step.description}</p>
              </div>
              {!step.completed && <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

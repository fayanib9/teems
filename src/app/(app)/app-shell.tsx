'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ToastProvider } from '@/components/ui/toast'
import { ProgressBar } from '@/components/ui/progress-bar'
import { CommandPalette } from '@/components/providers/command-palette'
import { OnboardingTour } from '@/components/ui/onboarding-tour'
import type { SessionUser } from '@/lib/auth'

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ToastProvider>
      <ProgressBar />
      <CommandPalette />
      <div className="min-h-screen bg-surface-secondary">
        <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-60">
          <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
          <main id="main-content" className="p-4 lg:p-6 max-w-[1400px]">{children}</main>
        </div>
      </div>
      <OnboardingTour />
    </ToastProvider>
  )
}

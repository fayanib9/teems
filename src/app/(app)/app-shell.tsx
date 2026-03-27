'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ToastProvider } from '@/components/ui/toast'
import type { SessionUser } from '@/lib/auth'

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-secondary">
        <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-60">
          <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-4 lg:p-6 max-w-[1400px]">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}

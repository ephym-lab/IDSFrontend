'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar'
import { ProtectedRoute } from '@/components/protected-route'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background grid-overlay">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}

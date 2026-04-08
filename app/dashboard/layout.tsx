'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, isLoading, router])

  // Always render the shell so the Sidebar never unmounts between navigations.
  // Only the content area shows a spinner while we wait for auth state.
  return (
    <div className="flex h-screen overflow-hidden bg-background grid-overlay">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        {isLoading ? (
          <div className="flex h-full min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          </div>
        ) : user ? (
          children
        ) : null}
      </main>
    </div>
  )
}

'use client'

import { HelpPage } from '@/components/help/help-page'

export default function PublicHelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <HelpPage />
      </div>
    </div>
  )
}

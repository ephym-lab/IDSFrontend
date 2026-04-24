'use client'

import { motion } from 'framer-motion'
import { AdminFeedbackManager } from '@/components/dashboard/admin-feedback-manager'
import { MessageSquare, Shield } from 'lucide-react'

export default function AdminFeedbackPage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center sm:text-left"
        >
          <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
            <div className="p-2.5 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30">
              <div className="relative">
                <MessageSquare className="w-6 h-6 text-orange-400" />
                <Shield className="w-3 h-3 text-orange-400 absolute -bottom-0.5 -right-0.5" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Feedback Management
            </h1>
          </div>
          <p className="text-slate-400 text-base sm:text-lg mt-3 max-w-2xl mx-auto sm:mx-0">
            Review all feedback submissions from users. Update status, track progress, and manage feature requests and bug reports.
          </p>
        </motion.div>

        {/* Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-md p-6 sm:p-8 shadow-2xl"
        >
          <AdminFeedbackManager />
        </motion.div>
      </div>
    </div>
  )
}

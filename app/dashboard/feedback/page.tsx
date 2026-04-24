'use client'

import { motion } from 'framer-motion'
import { FeedbackForm } from '@/components/dashboard/feedback-form'
import { FeedbackList } from '@/components/dashboard/feedback-list'
import { MessageSquare, Lightbulb, AlertTriangle, MessageCircle } from 'lucide-react'

const feedbackCategories = [
  {
    icon: AlertTriangle,
    title: 'Bug Report',
    description: 'Report technical issues or unexpected behavior',
    color: 'from-red-500/10 to-red-500/5',
    borderColor: 'border-red-500/30',
  },
  {
    icon: Lightbulb,
    title: 'Suggestion',
    description: 'Suggest new features or improvements',
    color: 'from-blue-500/10 to-blue-500/5',
    borderColor: 'border-blue-500/30',
  },
  {
    icon: MessageCircle,
    title: 'General Feedback',
    description: 'Share general comments and thoughts',
    color: 'from-purple-500/10 to-purple-500/5',
    borderColor: 'border-purple-500/30',
  },
]

export default function FeedbackPage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center sm:text-left"
        >
          <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Feedback
            </h1>
          </div>
          <p className="text-slate-400 text-base sm:text-lg mt-3 max-w-2xl mx-auto sm:mx-0">
            Help us improve by sharing your thoughts, reporting issues, or suggesting features. Your feedback directly impacts our product development.
          </p>
        </motion.div>

        {/* Category Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {feedbackCategories.map((category, idx) => {
            const Icon = category.icon
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className={`relative overflow-hidden rounded-lg border ${category.borderColor} bg-gradient-to-br ${category.color} p-6 backdrop-blur-sm transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-800/50 rounded-lg flex-shrink-0">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm">{category.title}</h3>
                    <p className="text-slate-400 text-xs mt-1">{category.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Form Section - Takes 2 columns on large screens */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="sticky top-24 rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-md p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Submit Feedback</h2>
              </div>
              <FeedbackForm />
            </div>
          </motion.div>

          {/* Sidebar - Tips and Guidelines */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            {/* Tips Card */}
            <div className="rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-md p-5 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                Tips for Best Feedback
              </h3>
              <ul className="space-y-2">
                {[
                  'Be specific and detailed',
                  'Include reproduction steps',
                  'Explain expected behavior',
                  'Be constructive and kind',
                  'One issue per submission',
                ].map((tip, idx) => (
                  <li key={idx} className="flex gap-2 text-xs text-slate-400">
                    <span className="text-cyan-400 flex-shrink-0 mt-1">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Status Guide Card */}
            <div className="rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-md p-5 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Status Timeline
              </h3>
              <div className="space-y-3">
                {[
                  { status: 'Open', color: 'text-amber-400', desc: 'Just submitted' },
                  { status: 'Reviewed', color: 'text-blue-400', desc: 'Under review' },
                  { status: 'Resolved', color: 'text-emerald-400', desc: 'Implemented' },
                  { status: 'Dismissed', color: 'text-slate-500', desc: 'Not applicable' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className={`${item.color} text-lg leading-none`}>●</span>
                    <div>
                      <p className={`${item.color} font-medium`}>{item.status}</p>
                      <p className="text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-md p-5 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                Quick Info
              </h3>
              <div className="space-y-2 text-xs text-slate-400">
                <p>💡 Your feedback helps us prioritize improvements</p>
                <p>⚡ Typical response time: 24-48 hours</p>
                <p>🔒 All feedback is confidential</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feedback List Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-md p-6 sm:p-8 shadow-2xl"
        >
          <FeedbackList />
        </motion.div>
      </div>
    </div>
  )
}

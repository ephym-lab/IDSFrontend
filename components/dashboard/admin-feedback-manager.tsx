'use client'

import { useState } from 'react'
import {
  useAdminFeedbacks,
  useUpdateFeedbackStatus,
  type AdminFeedbacksFilter,
  type FeedbackStatus,
  type FeedbackCategory,
} from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Loader2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SkeletonCard } from '@/components/skeleton-loader'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  bug: 'bg-red-500/10 text-red-400 border-red-500/30',
  suggestion: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  general: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  reviewed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  dismissed: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

const STATUS_OPTIONS: FeedbackStatus[] = ['open', 'reviewed', 'resolved', 'dismissed']
const CATEGORY_OPTIONS: FeedbackCategory[] = ['bug', 'suggestion', 'general']

export function AdminFeedbackManager() {
  const [filters, setFilters] = useState<AdminFeedbacksFilter>({ limit: 200 })
  const { data, isLoading, error } = useAdminFeedbacks(filters)
  const updateStatus = useUpdateFeedbackStatus()
  const [statusMap, setStatusMap] = useState<Record<number, FeedbackStatus>>({})

  const handleStatusChange = (feedbackId: number, newStatus: FeedbackStatus) => {
    setStatusMap((prev) => ({ ...prev, [feedbackId]: newStatus }))
  }

  const handleUpdateStatus = async (feedbackId: number) => {
    const newStatus = statusMap[feedbackId]
    if (!newStatus) return

    try {
      await updateStatus.mutateAsync({ feedbackId, status: newStatus })
      toast.success(`Feedback status updated to "${newStatus}"`)
      setStatusMap((prev) => {
        const updated = { ...prev }
        delete updated[feedbackId]
        return updated
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-red-200">Failed to load feedback</h4>
          <p className="text-sm text-red-300/80 mt-1">
            {error instanceof Error ? error.message : 'Please try again later'}
          </p>
        </div>
      </motion.div>
    )
  }

  const feedbacks = data?.feedbacks ?? []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filter</span>
        </div>

        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              status: (value === 'all' ? undefined : value) as FeedbackStatus | undefined,
            })
          }
        >
          <SelectTrigger className="border-slate-600/50 bg-slate-900/30 h-10 text-sm flex-1 sm:w-48 hover:border-slate-500 transition-colors">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-950">
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category || 'all'}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              category: (value === 'all' ? undefined : value) as FeedbackCategory | undefined,
            })
          }
        >
          <SelectTrigger className="border-slate-600/50 bg-slate-900/30 h-10 text-sm flex-1 sm:w-48 hover:border-slate-500 transition-colors">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-950">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-100 text-lg">All Feedback</h3>
          <p className="text-sm text-slate-400 mt-1">{feedbacks.length} {feedbacks.length === 1 ? 'entry' : 'entries'}</p>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-slate-700/30 bg-gradient-to-br from-slate-800/20 to-slate-900/20 p-12 text-center"
        >
          <AlertCircle className="w-14 h-14 text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-slate-300 mb-2">No Feedback Found</h3>
          <p className="text-sm text-slate-500">
            Try adjusting your filters or check back later for new submissions.
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {feedbacks.map((feedback) => {
              const hasChanged = statusMap[feedback.id] && statusMap[feedback.id] !== feedback.status
              return (
                <motion.div
                  key={feedback.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    'rounded-lg border p-4 sm:p-5 transition-all',
                    hasChanged
                      ? 'border-cyan-500/50 bg-gradient-to-r from-cyan-500/10 to-cyan-500/5'
                      : 'border-slate-700/30 bg-gradient-to-br from-slate-800/20 to-slate-900/20 hover:from-slate-800/40 hover:to-slate-900/40'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-slate-200 line-clamp-1">{feedback.title}</h4>
                        <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                          User #{feedback.user_id}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">{feedback.message}</p>
                    </div>
                  </div>

                  {/* Badges and Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                          CATEGORY_COLORS[feedback.category] || CATEGORY_COLORS['general']
                        )}
                      >
                        {feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={statusMap[feedback.id] || feedback.status}
                        onValueChange={(v) =>
                          handleStatusChange(feedback.id, v as FeedbackStatus)
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            'h-9 text-xs border rounded transition-all',
                            hasChanged
                              ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                              : cn(
                                  'border-slate-600/50 bg-slate-900/30 hover:border-slate-500',
                                  STATUS_COLORS[feedback.status]
                                )
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-950">
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {hasChanged && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex gap-1"
                        >
                          <Button
                            onClick={() => handleUpdateStatus(feedback.id)}
                            disabled={updateStatus.isPending}
                            size="sm"
                            className="h-9 px-3 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
                          >
                            {updateStatus.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Apply'
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              setStatusMap((prev) => {
                                const updated = { ...prev }
                                delete updated[feedback.id]
                                return updated
                              })
                            }}
                            disabled={updateStatus.isPending}
                            size="sm"
                            variant="outline"
                            className="h-9 px-3 text-xs border-slate-600 hover:bg-slate-800"
                          >
                            Undo
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-slate-600 pt-3 border-t border-slate-700/30 mt-3">
                    Submitted {new Date(feedback.created_at).toLocaleDateString()} at{' '}
                    {new Date(feedback.created_at).toLocaleTimeString()} 
                    {feedback.updated_at !== feedback.created_at &&
                      ` • Updated ${new Date(feedback.updated_at).toLocaleTimeString()}`}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}

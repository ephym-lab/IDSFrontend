'use client'

import { useState } from 'react'
import { useFeedbacks, useUpdateFeedback, useDeleteFeedback, type FeedbackCategory } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2, X, Check, AlertCircle, Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

interface EditingId {
  id: number
  title: string
  message: string
  category: FeedbackCategory
}

export function FeedbackList() {
  const { data, isLoading, error } = useFeedbacks()
  const updateFeedback = useUpdateFeedback()
  const deleteFeedback = useDeleteFeedback()
  const [editingId, setEditingId] = useState<EditingId | null>(null)

  const handleUpdateFeedback = async () => {
    if (!editingId) return
    try {
      await updateFeedback.mutateAsync({
        feedbackId: editingId.id,
        data: {
          title: editingId.title,
          message: editingId.message,
          category: editingId.category,
        },
      })
      toast.success('Feedback updated successfully')
      setEditingId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update feedback')
    }
  }

  const handleDeleteFeedback = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return
    try {
      await deleteFeedback.mutateAsync(id)
      toast.success('Feedback deleted successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete feedback')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
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

  if (feedbacks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-slate-700 bg-slate-950/50 p-8 text-center"
      >
        <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="font-medium text-slate-300 mb-1">No Feedback Yet</h3>
        <p className="text-sm text-slate-500">
          You haven't submitted any feedback yet. Share your thoughts in the form above!
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-100 text-lg">Your Feedback</h3>
          <p className="text-sm text-slate-400 mt-1">{feedbacks.length} {feedbacks.length === 1 ? 'entry' : 'entries'}</p>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-slate-700/30 bg-gradient-to-br from-slate-800/20 to-slate-900/20 p-12 text-center"
        >
          <MessageSquare className="w-14 h-14 text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-slate-300 mb-2">No Feedback Yet</h3>
          <p className="text-sm text-slate-500">
            You haven't submitted any feedback. Use the form above to share your thoughts!
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {feedbacks.map((feedback) => (
              <motion.div
                key={feedback.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-lg border border-slate-700/30 bg-gradient-to-br from-slate-800/20 to-slate-900/20 hover:from-slate-800/40 hover:to-slate-900/40 p-4 sm:p-5 transition-all"
              >
                {editingId?.id === feedback.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Title"
                      value={editingId.title}
                      onChange={(e) => setEditingId({ ...editingId, title: e.target.value.slice(0, 200) })}
                      maxLength={200}
                      className="border-slate-600/50 bg-slate-900/30 text-slate-100 h-10 text-sm"
                    />
                    <Textarea
                      placeholder="Message"
                      value={editingId.message}
                      onChange={(e) => setEditingId({ ...editingId, message: e.target.value.slice(0, 5000) })}
                      maxLength={5000}
                      className="border-slate-600/50 bg-slate-900/30 text-slate-100 min-h-24 resize-none text-sm"
                    />
                    <Select value={editingId.category} onValueChange={(v) => setEditingId({ ...editingId, category: v as FeedbackCategory })}>
                      <SelectTrigger className="border-slate-600/50 bg-slate-900/30 h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 bg-slate-950">
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="suggestion">Suggestion</SelectItem>
                        <SelectItem value="general">General Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleUpdateFeedback}
                        disabled={updateFeedback.isPending}
                        size="sm"
                        className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        disabled={updateFeedback.isPending}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9 border-slate-600 hover:bg-slate-800"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-200 line-clamp-2">{feedback.title}</h4>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">{feedback.message}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                            CATEGORY_COLORS[feedback.category] || CATEGORY_COLORS['general']
                          )}
                        >
                          {feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)}
                        </span>
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                            STATUS_COLORS[feedback.status]
                          )}
                        >
                          {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() =>
                            setEditingId({
                              id: feedback.id,
                              title: feedback.title,
                              message: feedback.message,
                              category: feedback.category,
                            })
                          }
                          disabled={deleteFeedback.isPending}
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-slate-500 hover:text-slate-300 hover:bg-slate-700/30"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteFeedback(feedback.id)}
                          disabled={deleteFeedback.isPending}
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          {deleteFeedback.isPending && deleteFeedback.variables === feedback.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 pt-3 border-t border-slate-700/30 mt-3">
                      Submitted {new Date(feedback.created_at).toLocaleDateString()} at{' '}
                      {new Date(feedback.created_at).toLocaleTimeString()}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}

'use client'

import { useState } from 'react'
import { useSubmitFeedback, type FeedbackCategory } from '@/lib/api'
import { motion } from 'framer-motion'
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CATEGORIES: { value: FeedbackCategory; label: string; description: string }[] = [
  {
    value: 'bug',
    label: 'Bug Report',
    description: 'Report a technical issue or unexpected behavior',
  },
  {
    value: 'suggestion',
    label: 'Suggestion',
    description: 'Suggest a new feature or improvement',
  },
  {
    value: 'general',
    label: 'General Feedback',
    description: 'General comment or feedback',
  },
]

export function FeedbackForm() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<FeedbackCategory>('general')
  const [submitted, setSubmitted] = useState(false)
  const submitFeedback = useSubmitFeedback()

  const isValid = title.trim().length >= 3 && message.trim().length >= 10

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    try {
      await submitFeedback.mutateAsync({ title: title.trim(), message: message.trim(), category })
      toast.success('Feedback submitted successfully!')
      setTitle('')
      setMessage('')
      setCategory('general')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback')
    }
  }

  const selectedCategory = CATEGORIES.find((c) => c.value === category)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 p-4 flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-emerald-200 text-sm">Feedback Submitted!</h4>
            <p className="text-xs text-emerald-300/70 mt-1">
              Thank you for your valuable input. We'll review it shortly.
            </p>
          </div>
        </motion.div>
      )}

      {/* Category Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-200">Category</label>
        <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
          <SelectTrigger className="border-slate-600/50 bg-slate-900/30 h-10 text-sm hover:border-slate-500 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-950">
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value} className="text-sm">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategory && (
          <p className="text-xs text-slate-400">{selectedCategory.description}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-200">Title *</label>
          <span className={cn('text-xs font-medium', title.length >= 3 ? 'text-emerald-400' : 'text-slate-500')}>
            {title.length}/200
          </span>
        </div>
        <Input
          type="text"
          placeholder="Summarize your feedback in one sentence..."
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 200))}
          maxLength={200}
          className="border-slate-600/50 bg-slate-900/30 text-slate-100 placeholder:text-slate-500 h-10 text-sm hover:border-slate-500 focus:border-cyan-500 transition-colors"
        />
        {title.length > 0 && title.length < 3 && (
          <p className="text-xs text-amber-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> At least 3 characters
          </p>
        )}
      </div>

      {/* Message */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-200">Details *</label>
          <span className={cn('text-xs font-medium', message.length >= 10 ? 'text-emerald-400' : 'text-slate-500')}>
            {message.length}/5000
          </span>
        </div>
        <Textarea
          placeholder="Provide context, steps to reproduce (for bugs), or explain your suggestion..."
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
          maxLength={5000}
          className="border-slate-600/50 bg-slate-900/30 text-slate-100 placeholder:text-slate-500 min-h-32 resize-none text-sm hover:border-slate-500 focus:border-cyan-500 transition-colors"
        />
        {message.length > 0 && message.length < 10 && (
          <p className="text-xs text-amber-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> At least 10 characters
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid || submitFeedback.isPending}
        className={cn(
          'w-full font-semibold transition-all duration-200 h-11 text-sm',
          isValid
            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
        )}
      >
        <Send className="w-4 h-4 mr-2" />
        {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        Fields marked with * are required. We'll respond within 24-48 hours.
      </p>
    </motion.div>
  )
}

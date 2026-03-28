'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, Zap } from 'lucide-react'

interface AlertBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low'
  size?: 'sm' | 'md' | 'lg'
}

const severityConfig = {
  critical: {
    bg: 'bg-red-900/30',
    text: 'text-red-300',
    border: 'border-red-700/50',
    icon: AlertTriangle,
    color: '#ef4444',
  },
  high: {
    bg: 'bg-orange-900/30',
    text: 'text-orange-300',
    border: 'border-orange-700/50',
    icon: Zap,
    color: '#f59e0b',
  },
  medium: {
    bg: 'bg-yellow-900/30',
    text: 'text-yellow-300',
    border: 'border-yellow-700/50',
    icon: AlertCircle,
    color: '#eab308',
  },
  low: {
    bg: 'bg-blue-900/30',
    text: 'text-blue-300',
    border: 'border-blue-700/50',
    icon: Info,
    color: '#3b82f6',
  },
}

export function AlertBadge({ severity, size = 'md' }: AlertBadgeProps) {
  const config = severityConfig[severity]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`inline-flex items-center rounded-md border font-medium ${config.bg} ${config.border} ${config.text} ${sizeClasses[size]} ${
        severity === 'critical' ? 'animate-pulse' : ''
      }`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </motion.div>
  )
}

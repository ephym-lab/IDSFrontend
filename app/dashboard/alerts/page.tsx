'use client'

import { useState } from 'react'
import { useAlerts, Alert } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Filter, X, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const fade = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay, ease: 'easeOut' } },
})

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { cls: string; dot: string }> = {
    High:   { cls: 'severity-high',   dot: 'bg-red-500' },
    Medium: { cls: 'severity-medium', dot: 'bg-amber-500' },
    Low:    { cls: 'severity-low',    dot: 'bg-emerald-500' },
  }
  const style = map[severity] ?? { cls: 'severity-low', dot: 'bg-slate-500' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider', style.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
      {severity}
    </span>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-slate-500 flex-shrink-0 w-8 text-right">
        {pct}%
      </span>
    </div>
  )
}

const ROW_STYLE: Record<string, string> = {
  High:   'row-attack-high',
  Medium: 'row-attack-medium',
  Low:    'row-attack-low',
}

type SortKey = 'timestamp' | 'severity' | 'confidence' | 'attack_type'
type SortDir = 'asc' | 'desc'

function SortableHeader({
  label,
  sortKey,
  active,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  active: boolean
  dir: SortDir
  onSort: (k: SortKey) => void
}) {
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-left hover:text-cyan-400 transition-colors"
    >
      {label}
      {active ? (
        dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3 opacity-30" />
      )}
    </button>
  )
}

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState('')
  const [limitFilter, setLimitFilter] = useState(50)
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { data, isLoading } = useAlerts({
    limit: limitFilter,
    severity: severityFilter || undefined,
  })

  const alerts = data?.alerts ?? []

  const sorted = [...alerts].sort((a, b) => {
    let av: string | number = a[sortKey as keyof Alert] as string | number
    let bv: string | number = b[sortKey as keyof Alert] as string | number
    if (typeof av === 'string') av = av.toLowerCase()
    if (typeof bv === 'string') bv = bv.toLowerCase()
    return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fade(0)} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            Alerts
          </h1>
          <p className="text-slate-600 text-sm mt-0.5">
            {isLoading ? 'Loading…' : `${data?.count ?? 0} alerts found`}
          </p>
        </div>
        {(sorted.filter(a => a.severity === 'High').length > 0) && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-400 font-mono">
              {sorted.filter(a => a.severity === 'High').length} HIGH severity
            </span>
          </div>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fade(0.05)} className="glass rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filter:</span>
          </div>

          {/* Severity pills */}
          <div className="flex gap-2">
            {['', 'High', 'Medium', 'Low'].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold font-mono transition-all',
                  severityFilter === s
                    ? s === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : s === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : s === 'Low' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-transparent text-slate-600 border border-slate-800 hover:border-slate-600'
                )}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          {/* Limit */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs text-slate-600">Limit:</label>
            <select
              value={limitFilter}
              onChange={(e) => setLimitFilter(Number(e.target.value))}
              className="ids-select text-xs py-1 px-2"
            >
              {[25, 50, 100, 200].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {severityFilter && (
              <button
                onClick={() => setSeverityFilter('')}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fade(0.1)} className="glass rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-[#0f2040] text-[11px] font-semibold text-slate-600 font-mono uppercase tracking-wider bg-[#040c18]/60">
          <div className="col-span-2">
            <SortableHeader label="Time" sortKey="timestamp" active={sortKey === 'timestamp'} dir={sortDir} onSort={handleSort} />
          </div>
          <div className="col-span-2">
            <SortableHeader label="Severity" sortKey="severity" active={sortKey === 'severity'} dir={sortDir} onSort={handleSort} />
          </div>
          <div className="col-span-2">
            <SortableHeader label="Attack Type" sortKey="attack_type" active={sortKey === 'attack_type'} dir={sortDir} onSort={handleSort} />
          </div>
          <div className="col-span-2">Src IP</div>
          <div className="col-span-2">Dst IP</div>
          <div className="col-span-2">
            <SortableHeader label="Confidence" sortKey="confidence" active={sortKey === 'confidence'} dir={sortDir} onSort={handleSort} />
          </div>
        </div>

        {/* Body */}
        <div className="divide-y divide-[#0f2040]/50 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="skeleton h-5 rounded" />
              </div>
            ))
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-700">
              <Bell className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No alerts found</p>
            </div>
          ) : (
            <AnimatePresence>
              {sorted.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn(
                    'grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors',
                    ROW_STYLE[alert.severity] ?? ''
                  )}
                >
                  <div className="col-span-2 text-[11px] font-mono text-slate-600">
                    {new Date(alert.timestamp).toLocaleString([], {
                      month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </div>
                  <div className="col-span-2">
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <div className="col-span-2 text-xs font-mono font-semibold text-slate-300">
                    {alert.attack_type}
                  </div>
                  <div className="col-span-2 text-[11px] font-mono text-slate-500">{alert.src_ip}</div>
                  <div className="col-span-2 text-[11px] font-mono text-slate-500">{alert.dst_ip}</div>
                  <div className="col-span-2">
                    <ConfidenceBar value={alert.confidence} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

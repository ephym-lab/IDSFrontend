'use client'

import { useState } from 'react'
import { useAlerts, Alert } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Filter, X, ChevronDown, ChevronUp, ShieldAlert, Search } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [attackTypeFilter, setAttackTypeFilter] = useState<string>('all')
  const [ipFilter, setIpFilter] = useState('')
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { data, isLoading } = useAlerts({
    limit: limitFilter,
    severity: severityFilter || undefined,
  })

  const alerts = data?.alerts ?? []
  
  // Get unique attack types
  const uniqueAttackTypes = Array.from(new Set(alerts.map(a => a.attack_type))).sort()

  // Apply all filters
  const filtered = alerts.filter(a => {
    // Severity filter
    if (severityFilter && a.severity !== severityFilter) return false
    // Search query (IP or attack type)
    if (searchQuery && !a.src_ip.includes(searchQuery) && !a.dst_ip.includes(searchQuery) && !a.attack_type.toLowerCase().includes(searchQuery.toLowerCase())) return false
    // Attack type filter
    if (attackTypeFilter !== 'all' && a.attack_type !== attackTypeFilter) return false
    // IP filter
    if (ipFilter && !a.src_ip.includes(ipFilter) && !a.dst_ip.includes(ipFilter)) return false
    // Confidence threshold
    if (Math.round(a.confidence * 100) < confidenceThreshold) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
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
            {isLoading ? 'Loading…' : `${sorted.length} ${sorted.length !== alerts.length ? 'filtered' : 'total'} alerts found`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(sorted.filter(a => a.severity === 'High').length > 0) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-red-400 font-mono">
                {sorted.filter(a => a.severity === 'High').length} HIGH severity
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-mono">LIMIT:</label>
            <select
              value={limitFilter}
              onChange={(e) => setLimitFilter(Number(e.target.value))}
              className="ids-select text-xs py-1 px-2"
            >
              {[25, 50, 100, 200].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fade(0.05)} className="space-y-3">
        {/* Quick Search & Severity */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex gap-3 flex-col sm:flex-row">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Search by IP or attack type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            
            {/* Severity Filter */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-600 font-mono">SEVERITY:</span>
              <div className="flex gap-1">
                {['', 'High', 'Medium', 'Low'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-semibold font-mono transition-all',
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
            </div>
          </div>

          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span className="uppercase tracking-widest">
              {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
            </span>
            {(attackTypeFilter !== 'all' || ipFilter || confidenceThreshold > 0) && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px]">
                {[
                  attackTypeFilter !== 'all' ? 1 : 0,
                  ipFilter ? 1 : 0,
                  confidenceThreshold > 0 ? 1 : 0,
                ].reduce((a, b) => a + b, 0)} active
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-xl p-4 space-y-3 border border-slate-700/30"
            >
              {/* Attack Type Filter */}
              <div>
                <label className="text-xs font-mono text-slate-600 uppercase tracking-widest">Attack Type</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => setAttackTypeFilter('all')}
                    className={cn(
                      'px-2 py-1 rounded text-xs font-mono transition-all border',
                      attackTypeFilter === 'all'
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                        : 'border-slate-700 text-slate-600 hover:text-slate-400'
                    )}
                  >
                    All
                  </button>
                  {uniqueAttackTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setAttackTypeFilter(type)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-mono transition-all border',
                        attackTypeFilter === type
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                          : 'border-slate-700 text-slate-600 hover:text-slate-400'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* IP Address Filter */}
              <div>
                <label className="text-xs font-mono text-slate-600 uppercase tracking-widest">IP Address (partial match)</label>
                <input
                  type="text"
                  placeholder="Search by IP..."
                  value={ipFilter}
                  onChange={(e) => setIpFilter(e.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              {/* Confidence Threshold */}
              <div>
                <label className="text-xs font-mono text-slate-600 uppercase tracking-widest flex items-center justify-between">
                  <span>Min Confidence</span>
                  <span className="text-cyan-400">{confidenceThreshold}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                  className="w-full mt-2 accent-cyan-500"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setAttackTypeFilter('all')
                  setIpFilter('')
                  setConfidenceThreshold(0)
                  setSearchQuery('')
                }}
                className="w-full px-3 py-2 text-xs font-mono text-slate-600 hover:text-slate-400 border border-slate-700 rounded hover:bg-slate-900/50 transition-all"
              >
                Reset All Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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

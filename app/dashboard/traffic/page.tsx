'use client'

import { useState } from 'react'
import { useLogs } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollText, Filter, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const fade = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay, ease: 'easeOut' } },
})

const TIME_RANGES = [
  { label: '1h',   hours: 1 },
  { label: '6h',   hours: 6 },
  { label: '24h',  hours: 24 },
  { label: '7d',   hours: 168 },
  { label: 'All',  hours: 0 },
]

function Badge({ children, variant }: { children: React.ReactNode; variant: 'attack' | 'normal' }) {
  return (
    <span
      className={cn(
        'inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase',
        variant === 'attack'
          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
      )}
    >
      {children}
    </span>
  )
}

const PAGE_SIZE = 25

export default function TrafficPage() {
  const [timeRange, setTimeRange] = useState(0) // hours; 0 = all
  const [page, setPage] = useState(0)
  const [typeFilter, setTypeFilter] = useState<'' | 'attack' | 'normal'>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [ipFilter, setIpFilter] = useState('')
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const fromTime = timeRange > 0
    ? new Date(Date.now() - timeRange * 3600 * 1000).toISOString()
    : undefined

  const { data, isLoading } = useLogs({ limit: 500, from_time: fromTime })

  const allLogs = data?.logs ?? []
  
  // Get unique classes
  const uniqueClasses = Array.from(new Set(allLogs.map(l => l.predicted_class))).sort()

  // Apply all filters
  const filtered = allLogs.filter(l => {
    // Type filter
    if (typeFilter === 'attack' && !l.is_attack) return false
    if (typeFilter === 'normal' && l.is_attack) return false
    // Search query (IP or class)
    if (searchQuery && !l.src_ip.includes(searchQuery) && !l.dst_ip.includes(searchQuery) && !l.predicted_class.toLowerCase().includes(searchQuery.toLowerCase())) return false
    // Class filter
    if (classFilter !== 'all' && l.predicted_class !== classFilter) return false
    // IP filter
    if (ipFilter && !l.src_ip.includes(ipFilter) && !l.dst_ip.includes(ipFilter)) return false
    // Confidence threshold
    if (Math.round(l.confidence * 100) < confidenceThreshold) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageLogs = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const attackCount = allLogs.filter(l => l.is_attack).length
  const normalCount = allLogs.filter(l => !l.is_attack).length

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fade(0)}>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-cyan-400" />
          Traffic Logs
        </h1>
        <p className="text-slate-600 text-sm mt-0.5">
          {isLoading ? 'Loading…' : `${filtered.length} records · ${attackCount} attacks · ${normalCount} normal`}
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fade(0.05)} className="space-y-3">
        {/* Quick Search & Type Filters */}
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex gap-3 flex-col sm:flex-row">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Search by IP or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>

            {/* Time & Type Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-600 font-mono">TIME:</span>
                <div className="flex gap-1">
                  {TIME_RANGES.map(({ label, hours }) => (
                    <button
                      key={label}
                      onClick={() => { setTimeRange(hours); setPage(0) }}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-mono transition-all border',
                        timeRange === hours
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                          : 'text-slate-600 border-slate-800 hover:border-slate-600'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-mono">TYPE:</span>
            {(['', 'attack', 'normal'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(0) }}
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-mono transition-all border',
                  typeFilter === t
                    ? t === 'attack'
                      ? 'bg-red-500/15 border-red-500/40 text-red-400'
                      : t === 'normal'
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                        : 'bg-slate-700/30 border-slate-700 text-slate-300'
                    : 'text-slate-600 border-slate-800 hover:border-slate-600'
                )}
              >
                {t === '' ? 'All' : t === 'attack' ? '⚠ Attacks' : '✓ Normal'}
              </button>
            ))}
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
            {(classFilter !== 'all' || ipFilter || confidenceThreshold > 0) && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px]">
                {[
                  classFilter !== 'all' ? 1 : 0,
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
              {/* Class Filter */}
              <div>
                <label className="text-xs font-mono text-slate-600 uppercase tracking-widest">Predicted Class</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => setClassFilter('all')}
                    className={cn(
                      'px-2 py-1 rounded text-xs font-mono transition-all border',
                      classFilter === 'all'
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                        : 'border-slate-700 text-slate-600 hover:text-slate-400'
                    )}
                  >
                    All
                  </button>
                  {uniqueClasses.map(cls => (
                    <button
                      key={cls}
                      onClick={() => setClassFilter(cls)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-mono transition-all border',
                        classFilter === cls
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                          : 'border-slate-700 text-slate-600 hover:text-slate-400'
                      )}
                    >
                      {cls}
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
                  setClassFilter('all')
                  setIpFilter('')
                  setConfidenceThreshold(0)
                  setSearchQuery('')
                  setPage(0)
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
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-[#0f2040] text-[11px] font-semibold text-slate-600 font-mono uppercase tracking-wider bg-[#040c18]/60">
          <div className="col-span-2">Time</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Class</div>
          <div className="col-span-2">Src IP</div>
          <div className="col-span-2">Dst IP</div>
          <div className="col-span-1">Severity</div>
          <div className="col-span-2">Confidence</div>
        </div>

        <div className="divide-y divide-[#0f2040]/50 max-h-[560px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="skeleton h-5 rounded" />
              </div>
            ))
          ) : pageLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-700">
              <ScrollText className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No logs found</p>
            </div>
          ) : (
            <AnimatePresence>
              {pageLogs.map((log, i) => {
                const pct = Math.round(log.confidence * 100)
                const barColor = log.is_attack ? '#ef4444' : '#00d4ff'
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className={cn(
                      'grid grid-cols-12 gap-3 px-4 py-2.5 items-center hover:bg-white/[0.02] transition-colors',
                      log.is_attack ? 'row-attack-high' : 'row-normal'
                    )}
                  >
                    <div className="col-span-2 text-[11px] font-mono text-slate-600">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <div className="col-span-1">
                      <Badge variant={log.is_attack ? 'attack' : 'normal'}>
                        {log.is_attack ? 'ATK' : 'OK'}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-xs font-mono font-semibold text-slate-300">
                      {log.predicted_class}
                    </div>
                    <div className="col-span-2 text-[11px] font-mono text-slate-500">{log.src_ip}</div>
                    <div className="col-span-2 text-[11px] font-mono text-slate-500">{log.dst_ip}</div>
                    <div className="col-span-1 text-[10px] font-mono text-slate-600">
                      {log.severity ?? '—'}
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: barColor }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 w-7 text-right">{pct}%</span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#0f2040] bg-[#040c18]/60">
            <span className="text-xs font-mono text-slate-600">
              Page {page + 1} of {totalPages} ({filtered.length} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded glass disabled:opacity-30 hover:border-cyan-500/30 transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded glass disabled:opacity-30 hover:border-cyan-500/30 transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

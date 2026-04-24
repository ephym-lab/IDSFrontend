'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radar,
  Power,
  PowerOff,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Shield,
  Wifi,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useCaptureStatus,
  useStartCapture,
  useStopCapture,
  useLiveLogs,
  useStats,
  type Log,
} from '@/lib/api'

// ─── Constants ─────────────────────────────────────────────────────────────

const ATTACK_COLORS: Record<string, string> = {
  DoS: '#ef4444',
  Exploits: '#f97316',
  Reconnaissance: '#f59e0b',
  Generic: '#eab308',
  Fuzzers: '#10b981',
  Other: '#6366f1',
  Normal: '#00d4ff',
}

const SEVERITY_CONFIG = {
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)',   glow: '0 0 12px rgba(239,68,68,0.3)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', glow: '0 0 12px rgba(245,158,11,0.3)' },
  Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', glow: '0 0 12px rgba(16,185,129,0.3)' },
}

const MAX_SPARKLINE_POINTS = 30

// ─── Subcomponents ─────────────────────────────────────────────────────────

function StatusPill({ isCapturing }: { isCapturing: boolean }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold"
      style={{
        background: isCapturing ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
        border: isCapturing ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(100,116,139,0.2)',
        color: isCapturing ? '#f87171' : '#64748b',
      }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: isCapturing ? '#ef4444' : '#475569',
          animation: isCapturing ? 'pulse-glow-red 1.5s infinite' : 'none',
        }}
      />
      {isCapturing ? 'CAPTURING' : 'IDLE'}
    </div>
  )
}

function MiniStatCard({
  icon: Icon,
  label,
  value,
  accent,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  accent: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass glass-hover rounded-xl p-4 flex items-center gap-4 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2" style={{ background: accent }} />
      <div
        className="p-2.5 rounded-lg flex-shrink-0"
        style={{ background: `${accent}22`, border: `1px solid ${accent}33`, color: accent }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="relative z-10 min-w-0">
        <p className="text-xl font-bold text-slate-100 font-mono leading-none">{value}</p>
        <p className="text-[11px] text-slate-500 mt-1 truncate">{label}</p>
      </div>
    </motion.div>
  )
}

function SeverityBadge({ severity, count }: { severity: 'High' | 'Medium' | 'Low'; count: number }) {
  const cfg = SEVERITY_CONFIG[severity]
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color, boxShadow: cfg.glow }} />
      <div>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{severity}</p>
        <p className="text-xl font-bold font-mono" style={{ color: cfg.color }}>{count}</p>
      </div>
    </div>
  )
}

function AttackDonut({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-44 text-slate-600">
        <Shield className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-xs">No attacks in current session</p>
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={72}
          paddingAngle={3}
          dataKey="value"
          animationBegin={0}
          animationDuration={600}
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={ATTACK_COLORS[entry.name] ?? '#6366f1'}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#0a1628',
            border: '1px solid #0f2040',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: '#64748b' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function SparklineChart({ data }: { data: { time: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
        <defs>
          <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fill: '#334155', fontSize: 9, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#334155', fontSize: 9, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#0a1628',
            border: '1px solid #0f2040',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono',
          }}
          formatter={(v: number) => [`${v} pkts`, 'Throughput']}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#00d4ff"
          strokeWidth={1.5}
          fill="url(#throughputGrad)"
          animationDuration={300}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function LogRow({ log, index }: { log: Log; index: number }) {
  const isAttack = log.is_attack
  const severityCfg = log.severity ? SEVERITY_CONFIG[log.severity as keyof typeof SEVERITY_CONFIG] : null

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className="grid gap-2 px-3 py-2 rounded-lg text-xs font-mono group hover:bg-white/[0.02] transition-colors"
      style={{
        gridTemplateColumns: '80px 1fr 100px 60px 52px',
        background: isAttack ? 'rgba(239,68,68,0.04)' : 'rgba(0,212,255,0.01)',
        borderLeft: `2px solid ${isAttack ? 'rgba(239,68,68,0.5)' : 'rgba(0,212,255,0.15)'}`,
      }}
    >
      {/* Time */}
      <span className="text-slate-600 text-[10px] flex items-center">
        {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
      </span>
      {/* IPs */}
      <span className="text-slate-400 truncate flex items-center">
        <span className={isAttack ? 'text-red-400/80' : 'text-cyan-400/60'}>{log.src_ip}</span>
        <span className="text-slate-700 mx-1">→</span>
        <span className="text-slate-400">{log.dst_ip}</span>
      </span>
      {/* Prediction */}
      <span
        className="font-semibold flex items-center"
        style={{ color: isAttack ? '#f87171' : '#22d3ee' }}
      >
        {log.predicted_class}
      </span>
      {/* Confidence */}
      <span className="text-slate-500 flex items-center justify-end">
        {Math.round(log.confidence * 100)}%
      </span>
      {/* Severity */}
      <div className="flex items-center justify-end">
        {severityCfg && log.severity ? (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
            style={{
              background: severityCfg.bg,
              border: `1px solid ${severityCfg.border}`,
              color: severityCfg.color,
            }}
          >
            {log.severity}
          </span>
        ) : (
          <span className="text-[9px] text-slate-700">—</span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function LiveCapturePage() {
  const { data: captureData } = useCaptureStatus()
  const isCapturing = captureData?.capturing ?? false
  const start = useStartCapture()
  const stop = useStopCapture()
  const isPending = start.isPending || stop.isPending

  // Track when this capture session started so we only show packets from now
  const [sessionStart, setSessionStart] = useState<string | undefined>(undefined)

  const { data: logsData } = useLiveLogs(isCapturing, sessionStart)
  const { data: stats } = useStats()

  const logs = logsData?.logs ?? []
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [trafficTypeFilter, setTrafficTypeFilter] = useState<'all' | 'attack' | 'normal'>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Get unique classes from current logs
  const uniqueClasses = Array.from(new Set(logs.map(l => l.predicted_class))).sort()

  // Apply all filters to logs
  const filtered = logs.filter(l => {
    // Type filter
    if (trafficTypeFilter === 'attack' && !l.is_attack) return false
    if (trafficTypeFilter === 'normal' && l.is_attack) return false
    // Search query (IP or class)
    if (searchQuery && !l.src_ip.includes(searchQuery) && !l.dst_ip.includes(searchQuery) && !l.predicted_class.toLowerCase().includes(searchQuery.toLowerCase())) return false
    // Class filter
    if (classFilter !== 'all' && l.predicted_class !== classFilter) return false
    // Confidence threshold
    if (Math.round(l.confidence * 100) < confidenceThreshold) return false
    return true
  })

  // ── Scroll to bottom ref ─────────────────────────────────────────────────
  const logEndRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs.length, autoScroll])

  // ── Throughput sparkline ─────────────────────────────────────────────────
  const prevCountRef = useRef<number>(0)
  const [sparkline, setSparkline] = useState<{ time: string; count: number }[]>([])

  useEffect(() => {
    const currentCount = logs.length
    const delta = Math.max(0, currentCount - prevCountRef.current)
    prevCountRef.current = currentCount

    const point = {
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      count: delta,
    }

    setSparkline((prev) => {
      const next = [...prev, point]
      return next.length > MAX_SPARKLINE_POINTS ? next.slice(-MAX_SPARKLINE_POINTS) : next
    })
  }, [logs.length])

  // ── Derived stats from logs ──────────────────────────────────────────────
  const attackLogs = filtered.filter((l) => l.is_attack)
  const normalLogs = filtered.filter((l) => !l.is_attack)

  const severityCounts = filtered.reduce(
    (acc, l) => {
      if (l.severity === 'High') acc.High++
      else if (l.severity === 'Medium') acc.Medium++
      else if (l.severity === 'Low') acc.Low++
      return acc
    },
    { High: 0, Medium: 0, Low: 0 }
  )

  const attackClassData = (() => {
    const counts: Record<string, number> = {}
    attackLogs.forEach((l) => {
      counts[l.predicted_class] = (counts[l.predicted_class] ?? 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  })()

  // ── Capture toggle ───────────────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (isCapturing) {
      stop.mutate(undefined, {
        onSuccess: () => toast.success('Live capture stopped'),
        onError: () => toast.error('Failed to stop capture'),
      })
    } else {
      // Record the exact moment capture starts — only packets after this time
      // will be shown in the Live Log Stream.
      const now = new Date().toISOString()
      setSessionStart(now)
      // Reset sparkline and packet counter for the new session
      setSparkline([])
      prevCountRef.current = 0

      start.mutate(undefined, {
        onSuccess: () => toast.success('Live capture started', { description: 'Sniffing network packets…' }),
        onError: () => {
          toast.error('Failed to start capture')
          setSessionStart(undefined)
        },
      })
    }
  }, [isCapturing, start, stop])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-4 border-b"
        style={{ borderColor: '#0f2040', background: 'rgba(4,12,24,0.8)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
          >
            <Radar className="w-5 h-5 text-cyan-400" style={{ animation: isCapturing ? 'radar-sweep 3s linear infinite' : 'none' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Live Capture</h1>
            <p className="text-[11px] text-slate-600 font-mono">Real-time network log stream &amp; ML predictions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill isCapturing={isCapturing} />
          {isCapturing && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono text-slate-500"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
              2s refresh
            </div>
          )}
          <button
            id="live-capture-toggle"
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300',
              isCapturing
                ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : 'text-[#050d1a] hover:shadow-[0_0_24px_rgba(0,212,255,0.4)]',
              isPending && 'opacity-50 cursor-not-allowed'
            )}
            style={!isCapturing ? { background: 'linear-gradient(135deg, #00d4ff, #0ea5e9)' } : undefined}
          >
            {isCapturing ? (
              <><PowerOff className="w-4 h-4" />Stop</>
            ) : (
              <><Power className="w-4 h-4" />Start Capture</>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 grid-overlay">
        {/* ── Stats Strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MiniStatCard icon={Wifi} label="Packets Sniffed" value={logs.length} accent="#00d4ff" delay={0} />
          <MiniStatCard icon={AlertTriangle} label="Attacks Detected" value={attackLogs.length} accent="#ef4444" delay={0.05} />
          <MiniStatCard icon={ShieldCheck} label="Normal Traffic" value={normalLogs.length} accent="#10b981" delay={0.1} />
          <MiniStatCard icon={TrendingUp} label="Total Alerts Today" value={stats?.alerts_today ?? 0} accent="#f59e0b" delay={0.15} />
        </div>

        {/* ── Severity + Attack distribution row ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Severity Counters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass rounded-xl p-4"
          >
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Severity Distribution
              <span className="ml-auto text-[10px] font-mono text-slate-600">current session</span>
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <SeverityBadge severity="High" count={severityCounts.High} />
              <SeverityBadge severity="Medium" count={severityCounts.Medium} />
              <SeverityBadge severity="Low" count={severityCounts.Low} />
            </div>
          </motion.div>

          {/* Attack Class Donut */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="glass rounded-xl p-4"
          >
            <h2 className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Attack Class Breakdown
              <span className="ml-auto text-[10px] font-mono text-slate-600">live session</span>
            </h2>
            <AttackDonut data={attackClassData} />
          </motion.div>
        </div>

        {/* ── Throughput Sparkline ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass rounded-xl p-4"
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Packet Throughput
            <span className="ml-auto text-[10px] font-mono text-slate-600">packets / poll interval</span>
          </h2>
          {sparkline.length < 2 ? (
            <div className="flex items-center justify-center h-36 text-slate-600 text-[11px] font-mono">
              {isCapturing ? 'Collecting data…' : 'Start capture to see throughput'}
            </div>
          ) : (
            <SparklineChart data={sparkline} />
          )}
        </motion.div>

        {/* ── Live Log Stream ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.30 }}
          className="space-y-3"
        >
          {/* Filters */}
          <div className="space-y-2">
            {/* Quick Search & Type Filters */}
            <div className="glass rounded-xl p-3 space-y-2">
              <div className="flex gap-2 flex-col sm:flex-row">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Search by IP or class..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-600 font-mono">TYPE:</span>
                  {(['all', 'attack', 'normal'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTrafficTypeFilter(t)}
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-mono transition-all border',
                        trafficTypeFilter === t
                          ? t === 'attack'
                            ? 'bg-red-500/15 border-red-500/40 text-red-400'
                            : t === 'normal'
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                              : 'bg-slate-700/30 border-slate-700 text-slate-300'
                          : 'text-slate-600 border-slate-800 hover:border-slate-600'
                      )}
                    >
                      {t === 'all' ? 'All' : t === 'attack' ? '⚠' : '✓'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span className="uppercase tracking-widest">
                  {showAdvanced ? 'Hide' : 'Show'} Filters
                </span>
                {(classFilter !== 'all' || confidenceThreshold > 0) && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[9px]">
                    {[classFilter !== 'all' ? 1 : 0, confidenceThreshold > 0 ? 1 : 0].reduce((a, b) => a + b, 0)} active
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
                  className="glass rounded-xl p-3 space-y-2 border border-slate-700/30"
                >
                  {/* Class Filter */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Predicted Class</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <button
                        onClick={() => setClassFilter('all')}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-mono transition-all border',
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
                            'px-1.5 py-0.5 rounded text-[10px] font-mono transition-all border',
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

                  {/* Confidence Threshold */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-600 uppercase tracking-widest flex items-center justify-between">
                      <span>Min Confidence</span>
                      <span className="text-cyan-400">{confidenceThreshold}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                      className="w-full mt-1 accent-cyan-500"
                      style={{ height: '4px' }}
                    />
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      setClassFilter('all')
                      setConfidenceThreshold(0)
                      setSearchQuery('')
                    }}
                    className="w-full px-2 py-1 text-[10px] font-mono text-slate-600 hover:text-slate-400 border border-slate-700 rounded hover:bg-slate-900/50 transition-all"
                  >
                    Reset
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Live Log Stream ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="glass rounded-xl overflow-hidden flex flex-col"
          style={{ minHeight: '320px' }}
        >
          {/* Table header */}
          <div
            className="flex-shrink-0 px-3 py-3 flex items-center gap-3 border-b"
            style={{ borderColor: '#0f2040', background: 'rgba(4,12,24,0.5)' }}
          >
            <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-slate-300">Live Log Stream</h2>
            {isCapturing && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-semibold text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ animation: 'pulse-glow-red 1.5s infinite' }} />
                LIVE
              </span>
            )}
            <span className="ml-auto text-[10px] font-mono text-slate-600">{filtered.length} {filtered.length !== logs.length ? 'filtered' : 'total'} records</span>
            <button
              onClick={() => setAutoScroll((v) => !v)}
              id="autoscroll-toggle"
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors',
                autoScroll
                  ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-400/20'
                  : 'text-slate-600 bg-transparent border border-slate-800'
              )}
            >
              <ChevronDown className="w-3 h-3" />
              Auto-scroll
            </button>
          </div>

          {/* Column headers */}
          <div
            className="flex-shrink-0 grid gap-2 px-3 py-1.5 text-[9px] font-mono font-semibold uppercase tracking-widest text-slate-600"
            style={{ gridTemplateColumns: '80px 1fr 100px 60px 52px', background: 'rgba(4,12,24,0.3)' }}
          >
            <span>Time</span>
            <span>Src → Dst</span>
            <span>Prediction</span>
            <span className="text-right">Conf.</span>
            <span className="text-right">Sev.</span>
          </div>

          {/* Scrollable log area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-96">
            <AnimatePresence initial={false}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                  <Radar className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-mono">
                    {isCapturing ? 'Waiting for packets…' : 'Start capture to see live logs'}
                  </p>
                </div>
              ) : (
                filtered.map((log, i) => <LogRow key={log.id} log={log} index={i} />)
              )}
            </AnimatePresence>
            <div ref={logEndRef} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

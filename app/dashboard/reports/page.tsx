'use client'

import { useState, useRef, useCallback } from 'react'
import { useStats, useAlerts, useLogs, Alert, Log } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Download,
  RefreshCw,
  ShieldAlert,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Filter,
  Printer,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const fade = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay, ease: 'easeOut' } },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(ts: string) {
  try {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return ts
  }
}

function severityColor(severity: string | null) {
  if (severity === 'High') return 'text-red-400'
  if (severity === 'Medium') return 'text-amber-400'
  if (severity === 'Low') return 'text-emerald-400'
  return 'text-slate-500'
}

function severityBg(severity: string | null) {
  if (severity === 'High') return 'bg-red-500/10 border-red-500/30 text-red-400'
  if (severity === 'Medium') return 'bg-amber-500/10 border-amber-500/30 text-amber-400'
  if (severity === 'Low') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
  return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
}

// ─── Inline Bar Chart ─────────────────────────────────────────────────────────

function AttackBarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const max = entries[0]?.[1] ?? 1

  const COLORS = ['#00d4ff', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

  return (
    <div className="space-y-3">
      {entries.map(([label, count], i) => {
        const pct = Math.round((count / max) * 100)
        const color = COLORS[i % COLORS.length]
        return (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 truncate max-w-[60%]">{label}</span>
              <span style={{ color }} className="font-bold">{count.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Donut Chart (SVG) ────────────────────────────────────────────────────────

function DonutChart({ data }: { data: Record<string, number> }) {
  const COLORS = ['#00d4ff', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899']
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return <p className="text-slate-600 text-sm text-center py-8">No data</p>

  const cx = 80, cy = 80, r = 60, strokeWidth = 20
  const circumference = 2 * Math.PI * r

  let cumulativePct = 0
  const slices = entries.map(([label, count], i) => {
    const pct = count / total
    const offset = circumference * (1 - cumulativePct)
    const dash = circumference * pct
    cumulativePct += pct
    return { label, count, pct, offset, dash, color: COLORS[i % COLORS.length] }
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0f2040" strokeWidth={strokeWidth} />
        {slices.map((s, i) => (
          <motion.circle
            key={s.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={s.offset}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize="20" fontWeight="bold" fontFamily="JetBrains Mono">
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">
          TOTAL
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 w-full">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[10px] text-slate-500 font-mono truncate">{s.label}</span>
            <span className="text-[10px] text-slate-400 font-bold ml-auto">{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, subtext
}: {
  label: string, value: string | number, icon: React.ElementType, color: string, subtext?: string
}) {
  return (
    <div
      className="glass rounded-xl p-5 space-y-3"
      style={{ border: `1px solid ${color}22` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-600 uppercase tracking-widest">{label}</span>
        <div className="p-1.5 rounded-lg" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold font-mono"
        style={{ color }}
      >
        {value}
      </motion.p>
      {subtext && <p className="text-xs text-slate-600">{subtext}</p>}
    </div>
  )
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

type TimeRange = '1h' | '6h' | '24h' | '7d' | 'all'

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [showFullTable, setShowFullTable] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [attackTypeFilter, setAttackTypeFilter] = useState<string>('all')
  const [ipFilter, setIpFilter] = useState<string>('')
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0)
  const [trafficTypeFilter, setTrafficTypeFilter] = useState<'all' | 'attack' | 'normal'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useStats()
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useAlerts({
    limit: 200,
    severity: severityFilter !== 'all' ? severityFilter : undefined,
  })
  const { data: logsData, isLoading: logsLoading } = useLogs({ limit: 500 })

  const allAlerts = alertsData?.alerts ?? []
  const allLogs = logsData?.logs ?? []

  // Apply additional filters to alerts
  const filteredAlerts = allAlerts.filter(a => {
    // Attack type filter
    if (attackTypeFilter !== 'all' && a.attack_type !== attackTypeFilter) return false
    // IP filter (source or destination)
    if (ipFilter && !a.src_ip.includes(ipFilter) && !a.dst_ip.includes(ipFilter)) return false
    // Confidence threshold filter
    if (Math.round(a.confidence * 100) < confidenceThreshold) return false
    return true
  })

  // Apply filters to logs
  const filteredLogs = allLogs.filter(l => {
    // Traffic type filter
    if (trafficTypeFilter === 'attack' && !l.is_attack) return false
    if (trafficTypeFilter === 'normal' && l.is_attack) return false
    // IP filter
    if (ipFilter && !l.src_ip.includes(ipFilter) && !l.dst_ip.includes(ipFilter)) return false
    // Confidence threshold filter
    if (Math.round(l.confidence * 100) < confidenceThreshold) return false
    return true
  })

  // Compute derived stats
  const attackLogs = filteredLogs.filter(l => l.is_attack)
  const normalLogs = filteredLogs.filter(l => !l.is_attack)
  const attackRate = filteredLogs.length > 0 ? Math.round((attackLogs.length / filteredLogs.length) * 100) : 0

  const avgConfidence = filteredLogs.length > 0
    ? Math.round((filteredLogs.reduce((s, l) => s + l.confidence, 0) / filteredLogs.length) * 100)
    : 0

  // Severity breakdown for alerts
  const severityCounts = filteredAlerts.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const displayedAlerts = showFullTable ? filteredAlerts : filteredAlerts.slice(0, 10)

  // Get unique attack types from all alerts for filter dropdown
  const uniqueAttackTypes = Array.from(new Set(allAlerts.map(a => a.attack_type))).sort()

  // ─── Refresh
  const handleRefresh = useCallback(() => {
    refetchStats()
    refetchAlerts()
    toast.success('Report data refreshed')
  }, [refetchStats, refetchAlerts])

  // ─── Export as CSV
  const exportCSV = useCallback(() => {
    if (filteredAlerts.length === 0) {
      toast.error('No alert data to export')
      return
    }
    const header = ['ID', 'Timestamp', 'Source IP', 'Destination IP', 'Attack Type', 'Confidence', 'Severity']
    const rows = filteredAlerts.map(a => [
      a.id,
      a.timestamp,
      a.src_ip,
      a.dst_ip,
      a.attack_type,
      `${Math.round(a.confidence * 100)}%`,
      a.severity,
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ids-alerts-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Alerts exported as CSV')
  }, [filteredAlerts])

  // ─── Export as JSON
  const exportJSON = useCallback(() => {
    if (!stats && filteredAlerts.length === 0) {
      toast.error('No data to export')
      return
    }
    const report = {
      generated_at: new Date().toISOString(),
      filters_applied: {
        attack_type: attackTypeFilter !== 'all' ? attackTypeFilter : null,
        ip_address: ipFilter || null,
        confidence_threshold: confidenceThreshold > 0 ? confidenceThreshold : null,
        traffic_type: trafficTypeFilter !== 'all' ? trafficTypeFilter : null,
      },
      summary: {
        total_traffic: stats?.total_traffic ?? 0,
        alerts_today: stats?.alerts_today ?? 0,
        attack_rate_pct: attackRate,
        avg_confidence_pct: avgConfidence,
        attacks_by_class: stats?.attacks_by_class ?? {},
      },
      severity_breakdown: severityCounts,
      alerts: filteredAlerts,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ids-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported as JSON')
  }, [stats, filteredAlerts, attackRate, avgConfidence, severityCounts, attackTypeFilter, ipFilter, confidenceThreshold, trafficTypeFilter])

  // ─── Generate full HTML report
  const generateHTMLReport = useCallback(async () => {
    setIsGenerating(true)
    await new Promise(r => setTimeout(r, 800))

    const attacksByClass = stats?.attacks_by_class ?? {}
    const topAttacks = Object.entries(attacksByClass)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t, c]) => `<tr><td>${t}</td><td>${c.toLocaleString()}</td></tr>`)
      .join('')

    const alertRows = filteredAlerts.slice(0, 50).map(a => `
      <tr>
        <td>${a.id}</td>
        <td>${formatTimestamp(a.timestamp)}</td>
        <td>${a.src_ip}</td>
        <td>${a.dst_ip}</td>
        <td>${a.attack_type}</td>
        <td>${Math.round(a.confidence * 100)}%</td>
        <td><span class="severity-${a.severity.toLowerCase()}">${a.severity}</span></td>
      </tr>`).join('')

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IDS Security Report — ${new Date().toLocaleDateString()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #050d1a; color: #e2e8f0; padding: 40px; }
    h1 { font-size: 28px; color: #00d4ff; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: #0a1628; border: 1px solid #0f2040; border-radius: 12px; padding: 20px; }
    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 8px; }
    .card-value { font-size: 28px; font-weight: 700; color: #00d4ff; font-family: monospace; }
    .card-value.attack { color: #ef4444; }
    .card-value.success { color: #10b981; }
    h2 { font-size: 16px; color: #94a3b8; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; background: #0a1628; border-radius: 10px; overflow: hidden; }
    th { text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; border-bottom: 1px solid #0f2040; }
    td { padding: 9px 14px; font-size: 12px; border-bottom: 1px solid #0a1f3a; font-family: monospace; }
    tr:last-child td { border-bottom: none; }
    .severity-high { color: #ef4444; font-weight: bold; }
    .severity-medium { color: #f59e0b; font-weight: bold; }
    .severity-low { color: #10b981; font-weight: bold; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #0f2040; font-size: 11px; color: #334155; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🛡 Network IDS Security Report</h1>
  <p class="subtitle">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Powered by Network IDS Command Center</p>

  <div class="grid">
    <div class="card">
      <div class="card-label">Total Traffic Logs</div>
      <div class="card-value">${(stats?.total_traffic ?? 0).toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="card-label">Alerts Today</div>
      <div class="card-value attack">${stats?.alerts_today ?? 0}</div>
    </div>
    <div class="card">
      <div class="card-label">Attack Rate</div>
      <div class="card-value attack">${attackRate}%</div>
    </div>
    <div class="card">
      <div class="card-label">Avg Confidence</div>
      <div class="card-value">${avgConfidence}%</div>
    </div>
    <div class="card">
      <div class="card-label">High Severity</div>
      <div class="card-value attack">${severityCounts['High'] ?? 0}</div>
    </div>
    <div class="card">
      <div class="card-label">Normal Traffic</div>
      <div class="card-value success">${normalLogs.length.toLocaleString()}</div>
    </div>
  </div>

  <h2>Attack Type Breakdown</h2>
  <table>
    <thead>
      <tr><th>Attack Class</th><th>Count</th></tr>
    </thead>
    <tbody>${topAttacks || '<tr><td colspan="2" style="color:#64748b;text-align:center;padding:20px">No attack data available</td></tr>'}</tbody>
  </table>

  <h2>Recent Alerts (top 50)</h2>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Timestamp</th><th>Src IP</th><th>Dst IP</th>
        <th>Attack Type</th><th>Confidence</th><th>Severity</th>
      </tr>
    </thead>
    <tbody>${alertRows || '<tr><td colspan="7" style="color:#64748b;text-align:center;padding:20px">No alerts recorded</td></tr>'}</tbody>
  </table>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Network IDS Command Center &mdash; Confidential Security Report
  </div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ids-security-report-${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
    setIsGenerating(false)
    toast.success('HTML report generated and downloaded')
  }, [stats, filteredAlerts, attackRate, avgConfidence, severityCounts, normalLogs])

  const isLoading = statsLoading || alertsLoading || logsLoading

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
      ref={reportRef}
    >
      {/* ── Header */}
      <motion.div variants={fade(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            Security Reports
          </h1>
          <p className="text-slate-600 text-sm mt-0.5">
            Generate and export comprehensive analysis of network threat data
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="report-refresh"
            onClick={handleRefresh}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
          <button
            id="report-export-csv"
            onClick={exportCSV}
            className="btn-ghost flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            id="report-export-json"
            onClick={exportJSON}
            className="btn-ghost flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
          <button
            id="report-generate-html"
            onClick={generateHTMLReport}
            disabled={isGenerating}
            className={cn('btn-primary flex items-center gap-2', isGenerating && 'opacity-70 cursor-not-allowed')}
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-[#050d1a]/40 border-t-[#050d1a] rounded-full"
                />
                Generating…
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ── Filters */}
      <motion.div variants={fade(0.05)} className="space-y-4">
        {/* Quick Severity Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-xs font-mono uppercase tracking-widest">Severity</span>
          </div>
          {(['all', 'High', 'Medium', 'Low'] as const).map(s => (
            <button
              key={s}
              id={`filter-severity-${s.toLowerCase()}`}
              onClick={() => setSeverityFilter(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all',
                severityFilter === s
                  ? s === 'all'
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                    : s === 'High'
                    ? 'bg-red-500/15 border-red-500/40 text-red-400'
                    : s === 'Medium'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'border-slate-700 text-slate-600 hover:text-slate-400 hover:border-slate-600'
              )}
            >
              {s === 'all' ? 'All' : s}
              {s !== 'all' && severityCounts[s] !== undefined && (
                <span className="ml-1.5 opacity-60">({severityCounts[s] ?? 0})</span>
              )}
            </button>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors"
        >
          {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span className="uppercase tracking-widest">
            {showFilters ? 'Hide' : 'Show'} Advanced Filters
          </span>
          {(attackTypeFilter !== 'all' || ipFilter || confidenceThreshold > 0 || trafficTypeFilter !== 'all') && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px]">
              {[
                attackTypeFilter !== 'all' ? 1 : 0,
                ipFilter ? 1 : 0,
                confidenceThreshold > 0 ? 1 : 0,
                trafficTypeFilter !== 'all' ? 1 : 0,
              ].reduce((a, b) => a + b, 0)} active
            </span>
          )}
        </button>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-xl p-4 space-y-4 border border-slate-700/30"
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

              {/* Traffic Type Filter */}
              <div>
                <label className="text-xs font-mono text-slate-600 uppercase tracking-widest">Traffic Type</label>
                <div className="flex gap-2 mt-2">
                  {(['all', 'attack', 'normal'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setTrafficTypeFilter(type)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all',
                        trafficTypeFilter === type
                          ? type === 'all'
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                            : type === 'attack'
                            ? 'bg-red-500/15 border-red-500/40 text-red-400'
                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'border-slate-700 text-slate-600 hover:text-slate-400'
                      )}
                    >
                      {type === 'all' ? 'All Traffic' : type === 'attack' ? '⚠ Attacks' : '✓ Normal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setAttackTypeFilter('all')
                  setIpFilter('')
                  setConfidenceThreshold(0)
                  setTrafficTypeFilter('all')
                }}
                className="w-full px-3 py-2 text-xs font-mono text-slate-600 hover:text-slate-400 border border-slate-700 rounded hover:bg-slate-900/50 transition-all"
              >
                Reset Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>


      {/* ── Summary KPI cards */}
      <motion.div variants={fade(0.08)} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Traffic"
          value={statsLoading ? '—' : (stats?.total_traffic ?? 0).toLocaleString()}
          icon={Activity}
          color="#00d4ff"
          subtext="All logged packets"
        />
        <StatCard
          label="Alerts Today"
          value={statsLoading ? '—' : stats?.alerts_today ?? 0}
          icon={ShieldAlert}
          color="#ef4444"
          subtext="Active threat alerts"
        />
        <StatCard
          label="Attack Rate"
          value={logsLoading ? '—' : `${attackRate}%`}
          icon={TrendingUp}
          color={attackRate > 50 ? '#ef4444' : attackRate > 20 ? '#f59e0b' : '#10b981'}
          subtext="Of all traffic logs"
        />
        <StatCard
          label="Avg Confidence"
          value={logsLoading ? '—' : `${avgConfidence}%`}
          icon={BarChart3}
          color="#8b5cf6"
          subtext="ML model certainty"
        />
        <StatCard
          label="Normal Flows"
          value={logsLoading ? '—' : normalLogs.length.toLocaleString()}
          icon={CheckCircle2}
          color="#10b981"
          subtext="Benign traffic events"
        />
        <StatCard
          label="High Severity"
          value={alertsLoading ? '—' : (severityCounts['High'] ?? 0)}
          icon={AlertTriangle}
          color="#ef4444"
          subtext="Critical threat events"
        />
      </motion.div>

      {/* ── Charts row */}
      <motion.div variants={fade(0.12)} className="grid md:grid-cols-2 gap-4">

        {/* Attack class breakdown bar chart */}
        <div className="glass rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Attack Class Distribution</h2>
              <p className="text-xs text-slate-600 mt-0.5">Frequency by ML-predicted attack class</p>
            </div>
            <BarChart3 className="w-4 h-4 text-cyan-400/50" />
          </div>
          {statsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="skeleton h-3 w-32" />
                  <div className="skeleton h-2 w-full" />
                </div>
              ))}
            </div>
          ) : Object.keys(stats?.attacks_by_class ?? {}).length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8">No attack data recorded</p>
          ) : (
            <AttackBarChart data={stats!.attacks_by_class} />
          )}
        </div>

        {/* Donut / distribution */}
        <div className="glass rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Threat Composition</h2>
            <p className="text-xs text-slate-600 mt-0.5">Proportional breakdown of detected attack types</p>
          </div>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="skeleton w-36 h-36 rounded-full" />
            </div>
          ) : Object.keys(stats?.attacks_by_class ?? {}).length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8">No attack data recorded</p>
          ) : (
            <DonutChart data={stats!.attacks_by_class} />
          )}
        </div>
      </motion.div>

      {/* ── Severity breakdown mini-cards */}
      <motion.div variants={fade(0.16)}>
        <div className="glass rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Severity Analysis
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {(['High', 'Medium', 'Low'] as const).map(sev => {
              const count = severityCounts[sev] ?? 0
              const total = allAlerts.length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              const colors = {
                High: { text: 'text-red-400', bar: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
                Medium: { text: 'text-amber-400', bar: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
                Low: { text: 'text-emerald-400', bar: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
              }
              const c = colors[sev]
              return (
                <div key={sev} className="rounded-lg p-4 space-y-2"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-mono font-bold uppercase', c.text)}>{sev}</span>
                    <span className={cn('text-lg font-bold font-mono', c.text)}>{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: c.bar }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 font-mono">{pct}% of alerts</p>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Alerts Table */}
      <motion.div variants={fade(0.2)}>
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0f2040]">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Alert Log
                {filteredAlerts.length > 0 && (
                  <span className="text-xs font-mono text-slate-600 ml-1">({filteredAlerts.length} {filteredAlerts.length !== allAlerts.length ? 'filtered' : 'total'})</span>
                )}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {severityFilter !== 'all' || attackTypeFilter !== 'all' || ipFilter || confidenceThreshold > 0 || trafficTypeFilter !== 'all'
                  ? `Filtered: ${[
                    severityFilter !== 'all' ? severityFilter : '',
                    attackTypeFilter !== 'all' ? attackTypeFilter : '',
                    ipFilter ? `IP: ${ipFilter}` : '',
                    confidenceThreshold > 0 ? `≥${confidenceThreshold}% conf` : '',
                    trafficTypeFilter !== 'all' ? trafficTypeFilter : '',
                  ].filter(Boolean).join(', ')}`
                  : 'All severity levels'}
              </p>
            </div>
            <button
              id="toggle-full-table"
              onClick={() => setShowFullTable(v => !v)}
              className="btn-ghost text-xs flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              {showFullTable ? 'Show Less' : 'Show All'}
              {showFullTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {alertsLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 w-full rounded-lg" />)}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/40" />
              <p className="text-slate-600 text-sm">No alerts found for the selected filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#0f2040]">
                      {['#', 'Timestamp', 'Source IP', 'Destination IP', 'Attack Type', 'Confidence', 'Severity'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {displayedAlerts.map((alert, idx) => (
                        <motion.tr
                          key={alert.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="border-b border-[#0a1f3a] hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-4 py-2.5 text-xs font-mono text-slate-700">
                            {alert.id}
                          </td>
                          <td className="px-4 py-2.5 text-xs font-mono text-slate-500 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 opacity-50 flex-shrink-0" />
                              {formatTimestamp(alert.timestamp)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs font-mono text-cyan-400/80">{alert.src_ip}</td>
                          <td className="px-4 py-2.5 text-xs font-mono text-slate-400">{alert.dst_ip}</td>
                          <td className="px-4 py-2.5 text-xs font-bold font-mono text-slate-200">
                            {alert.attack_type}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.round(alert.confidence * 100)}%`,
                                    background: alert.severity === 'High' ? '#ef4444' : alert.severity === 'Medium' ? '#f59e0b' : '#10b981',
                                  }}
                                />
                              </div>
                              <span className="text-xs font-mono text-slate-500">{Math.round(alert.confidence * 100)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn(
                              'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border',
                              severityBg(alert.severity)
                            )}>
                              {alert.severity}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              {!showFullTable && filteredAlerts.length > 10 && (
                <div className="px-5 py-3 border-t border-[#0f2040] text-center">
                  <button
                    onClick={() => setShowFullTable(true)}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Show {filteredAlerts.length - 10} more alerts ↓
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* ── Recent Traffic Snapshot */}
      <motion.div variants={fade(0.24)}>
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0f2040]">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Recent Traffic Snapshot
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">Latest {Math.min(filteredLogs.length, 15)} log entries</p>
            </div>
          </div>
          {logsLoading ? (
            <div className="p-5 space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8 w-full rounded" />)}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Activity className="w-10 h-10 text-slate-700" />
              <p className="text-slate-600 text-sm">No traffic logs available for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#0f2040]">
                    {['Timestamp', 'Src IP', 'Dst IP', 'ML Class', 'Confidence', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.slice(0, 15).map((log, idx) => (
                    <tr
                      key={log.id}
                      className={cn(
                        'border-b border-[#0a1f3a] transition-colors hover:bg-white/[0.015]',
                        log.is_attack
                          ? log.severity === 'High' ? 'row-attack-high' : log.severity === 'Medium' ? 'row-attack-medium' : 'row-attack-low'
                          : 'row-normal'
                      )}
                    >
                      <td className="px-4 py-2 text-xs font-mono text-slate-600 whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-2 text-xs font-mono text-cyan-400/80">{log.src_ip}</td>
                      <td className="px-4 py-2 text-xs font-mono text-slate-500">{log.dst_ip}</td>
                      <td className="px-4 py-2 text-xs font-bold font-mono text-slate-200">{log.predicted_class}</td>
                      <td className="px-4 py-2 text-xs font-mono text-slate-500">{Math.round(log.confidence * 100)}%</td>
                      <td className="px-4 py-2">
                        <span className={cn(
                          'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
                          log.is_attack
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        )}>
                          {log.is_attack ? '⚠ ATTACK' : '✓ NORMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Footer */}
      <motion.div variants={fade(0.28)} className="flex items-center justify-between text-xs text-slate-700 font-mono border-t border-[#0f2040] pt-4">
        <span>Network IDS Command Center &mdash; Security Reports</span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </motion.div>
    </motion.div>
  )
}

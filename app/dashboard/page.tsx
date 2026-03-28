'use client'

import { useStats, useLogs, useCaptureStatus, useStartCapture, useStopCapture } from '@/lib/api'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Radio,
  TrendingUp,
  Shield,
  Zap,
  Power,
  PowerOff,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const fade = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay, ease: 'easeOut' } },
})

const ATTACK_COLORS: Record<string, string> = {
  DoS: '#ef4444',
  Exploits: '#f97316',
  Reconnaissance: '#f59e0b',
  Generic: '#eab308',
  Fuzzers: '#10b981',
  Other: '#6366f1',
  Normal: '#00d4ff',
}

const SEVERITY_META: Record<string, { label: string; color: string; glow: string }> = {
  Low:    { label: 'LOW',    color: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
  Medium: { label: 'MEDIUM', color: 'text-amber-400',   glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
  High:   { label: 'HIGH',   color: 'text-red-400',     glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: string
  accent: string
  delay: number
}) {
  return (
    <motion.div
      variants={fade(delay)}
      className="glass glass-hover rounded-xl p-5 relative overflow-hidden"
    >
      {/* bg glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div
          className="p-2.5 rounded-lg"
          style={{ background: `${accent}20`, border: `1px solid ${accent}30`, color: accent }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <TrendingUp className="w-4 h-4 text-slate-700" />
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-bold text-slate-100 font-mono animate-count-up">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
        {sub && <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{sub}</p>}
      </div>
    </motion.div>
  )
}

function CaptureButton() {
  const { data } = useCaptureStatus()
  const start = useStartCapture()
  const stop = useStopCapture()
  const isCapturing = data?.capturing ?? false
  const isPending = start.isPending || stop.isPending

  const handleToggle = () => {
    if (isCapturing) {
      stop.mutate(undefined, {
        onSuccess: () => toast.success('Live capture stopped'),
        onError: () => toast.error('Failed to stop capture'),
      })
    } else {
      start.mutate(undefined, {
        onSuccess: () => toast.success('Live capture started', { description: 'Sniffing network packets…' }),
        onError: () => toast.error('Failed to start capture'),
      })
    }
  }

  return (
    <motion.div variants={fade(0.1)} className="glass rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-1">Live Packet Capture</h2>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isCapturing ? 'bg-red-500' : 'bg-slate-600'
              )}
              style={{
                animation: isCapturing ? 'pulse-glow-red 1.5s infinite' : 'none',
              }}
            />
            <span className={cn('text-xs font-mono font-semibold', isCapturing ? 'text-red-400' : 'text-slate-600')}>
              {isCapturing ? 'CAPTURING' : 'IDLE'}
            </span>
            {isCapturing && (
              <span className="text-[10px] text-slate-600">Scapy active</span>
            )}
          </div>
        </div>
        <button
          id="capture-toggle-main"
          onClick={handleToggle}
          disabled={isPending}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300',
            isCapturing
              ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              : 'text-[#050d1a] hover:shadow-[0_0_24px_rgba(0,212,255,0.4)]',
            isPending && 'opacity-50 cursor-not-allowed'
          )}
          style={
            !isCapturing
              ? { background: 'linear-gradient(135deg, #00d4ff, #0ea5e9)' }
              : undefined
          }
        >
          {isCapturing ? (
            <>
              <PowerOff className="w-4 h-4" />
              Stop Capture
            </>
          ) : (
            <>
              <Power className="w-4 h-4" />
              Start Capture
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

function AttackDonut({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-600">
        <Shield className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">No attacks detected</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
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
            fontSize: '12px',
            fontFamily: 'JetBrains Mono',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#64748b' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function LiveFeed() {
  const { data, isLoading } = useLogs({ limit: 12 })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-10 rounded-lg" />
        ))}
      </div>
    )
  }

  const logs = data?.logs ?? []

  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {logs.length === 0 ? (
        <div className="text-center text-slate-600 py-8 text-sm">
          No traffic logs yet
        </div>
      ) : (
        logs.map((log, i) => {
          const isAttack = log.is_attack
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono',
                isAttack ? 'row-attack-high' : 'row-normal'
              )}
              style={{ background: isAttack ? 'rgba(239,68,68,0.04)' : 'rgba(0,212,255,0.02)' }}
            >
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  isAttack ? 'bg-red-500' : 'bg-cyan-500/60'
                )}
              />
              <span className="text-slate-500 flex-shrink-0 text-[10px]">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={cn('flex-shrink-0 font-semibold', isAttack ? 'text-red-400' : 'text-cyan-400/70')}>
                {log.predicted_class}
              </span>
              <span className="text-slate-600 truncate">
                {log.src_ip} → {log.dst_ip}
              </span>
              <span className="ml-auto text-[10px] text-slate-700 flex-shrink-0">
                {Math.round(log.confidence * 100)}%
              </span>
            </motion.div>
          )
        })
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats()

  const totalAttacks = stats
    ? Object.values(stats.attacks_by_class).reduce((a, b) => a + b, 0)
    : 0

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fade(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            Overview
          </h1>
          <p className="text-slate-600 text-sm mt-0.5">Real-time network intrusion detection</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[10px] font-mono text-slate-500">
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
          LIVE · 5s refresh
        </div>
      </motion.div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatCard
            icon={Activity}
            label="Total Traffic Analyzed"
            value={(stats?.total_traffic ?? 0).toLocaleString()}
            sub="cumulative records"
            accent="#00d4ff"
            delay={0.05}
          />
          <StatCard
            icon={AlertTriangle}
            label="Attacks Detected"
            value={totalAttacks.toLocaleString()}
            sub={`${Object.keys(stats?.attacks_by_class ?? {}).length} attack classes`}
            accent="#ef4444"
            delay={0.1}
          />
          <StatCard
            icon={Radio}
            label="Alerts Today"
            value={(stats?.alerts_today ?? 0).toLocaleString()}
            sub="from midnight UTC"
            accent="#f59e0b"
            delay={0.15}
          />
        </motion.div>
      )}

      {/* Capture Toggle */}
      <CaptureButton />

      {/* Charts + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Distribution */}
        <motion.div variants={fade(0.2)} className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Attack Distribution
          </h2>
          {statsLoading ? (
            <div className="skeleton h-48 rounded-lg" />
          ) : (
            <AttackDonut data={stats?.attacks_by_class ?? {}} />
          )}
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div variants={fade(0.25)} className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Live Activity Feed
            <span className="ml-auto text-[10px] text-slate-600 font-mono">auto-refresh 5s</span>
          </h2>
          <LiveFeed />
        </motion.div>
      </div>
    </motion.div>
  )
}

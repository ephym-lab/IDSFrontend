'use client'

import { useState } from 'react'
import { usePredict, PredictRequest, PredictResponse } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, ChevronDown, ChevronUp, Zap, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const fade = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay, ease: 'easeOut' } },
})

const DEFAULT_VALUES: PredictRequest = {
  dur: 0.001,
  spkts: 2,
  dpkts: 2,
  sbytes: 140,
  dbytes: 140,
  rate: 2000,
  sttl: 31,
  dttl: 29,
  sload: 560000,
  dload: 560000,
  sinpkt: 0.001,
  dinpkt: 0.001,
  sjit: 0,
  djit: 0,
  swin: 255,
  stcpb: 0,
  dtcpb: 0,
  dwin: 255,
  smean: 70,
  dmean: 70,
  ct_srv_src: 1,
  ct_state_ttl: 0,
  ct_dst_ltm: 1,
  ct_src_dport_ltm: 1,
  ct_dst_sport_ltm: 1,
  ct_dst_src_ltm: 1,
  is_ftp_login: 0,
  ct_ftp_cmd: 0,
  ct_flw_http_mthd: 0,
  ct_src_ltm: 1,
  ct_srv_dst: 1,
  is_sm_ips_ports: 0,
  proto: 'tcp',
  service: 'http',
  state: 'FIN',
  src_ip: '192.168.1.5',
  dst_ip: '192.168.1.10',
}

type FieldGroup = {
  title: string
  fields: Array<{ key: keyof PredictRequest; label: string; type: 'number' | 'text' }>
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    title: 'Network Endpoints',
    fields: [
      { key: 'src_ip', label: 'Source IP', type: 'text' },
      { key: 'dst_ip', label: 'Destination IP', type: 'text' },
      { key: 'proto', label: 'Protocol', type: 'text' },
      { key: 'service', label: 'Service', type: 'text' },
      { key: 'state', label: 'Connection State', type: 'text' },
    ],
  },
  {
    title: 'Packet Counts & Bytes',
    fields: [
      { key: 'spkts', label: 'Src Packets (spkts)', type: 'number' },
      { key: 'dpkts', label: 'Dst Packets (dpkts)', type: 'number' },
      { key: 'sbytes', label: 'Src Bytes (sbytes)', type: 'number' },
      { key: 'dbytes', label: 'Dst Bytes (dbytes)', type: 'number' },
    ],
  },
  {
    title: 'Timing & Rate',
    fields: [
      { key: 'dur', label: 'Duration (dur)', type: 'number' },
      { key: 'rate', label: 'Rate', type: 'number' },
      { key: 'sinpkt', label: 'Src Inter-Pkt Time (sinpkt)', type: 'number' },
      { key: 'dinpkt', label: 'Dst Inter-Pkt Time (dinpkt)', type: 'number' },
      { key: 'sjit', label: 'Src Jitter (sjit)', type: 'number' },
      { key: 'djit', label: 'Dst Jitter (djit)', type: 'number' },
      { key: 'sttl', label: 'Src TTL (sttl)', type: 'number' },
      { key: 'dttl', label: 'Dst TTL (dttl)', type: 'number' },
    ],
  },
  {
    title: 'Load & Window',
    fields: [
      { key: 'sload', label: 'Src Load (sload)', type: 'number' },
      { key: 'dload', label: 'Dst Load (dload)', type: 'number' },
      { key: 'swin', label: 'Src Window (swin)', type: 'number' },
      { key: 'dwin', label: 'Dst Window (dwin)', type: 'number' },
      { key: 'stcpb', label: 'Src TCP Base Seq (stcpb)', type: 'number' },
      { key: 'dtcpb', label: 'Dst TCP Base Seq (dtcpb)', type: 'number' },
      { key: 'smean', label: 'Src Pkt Mean (smean)', type: 'number' },
      { key: 'dmean', label: 'Dst Pkt Mean (dmean)', type: 'number' },
    ],
  },
  {
    title: 'Connection Counters',
    fields: [
      { key: 'ct_srv_src', label: 'ct_srv_src', type: 'number' },
      { key: 'ct_state_ttl', label: 'ct_state_ttl', type: 'number' },
      { key: 'ct_dst_ltm', label: 'ct_dst_ltm', type: 'number' },
      { key: 'ct_src_dport_ltm', label: 'ct_src_dport_ltm', type: 'number' },
      { key: 'ct_dst_sport_ltm', label: 'ct_dst_sport_ltm', type: 'number' },
      { key: 'ct_dst_src_ltm', label: 'ct_dst_src_ltm', type: 'number' },
      { key: 'ct_src_ltm', label: 'ct_src_ltm', type: 'number' },
      { key: 'ct_srv_dst', label: 'ct_srv_dst', type: 'number' },
      { key: 'is_ftp_login', label: 'is_ftp_login (0/1)', type: 'number' },
      { key: 'ct_ftp_cmd', label: 'ct_ftp_cmd', type: 'number' },
      { key: 'ct_flw_http_mthd', label: 'ct_flw_http_mthd', type: 'number' },
      { key: 'is_sm_ips_ports', label: 'is_sm_ips_ports (0/1)', type: 'number' },
    ],
  },
]

const SEVERITY_STYLE: Record<string, { label: string; cls: string }> = {
  High:   { label: '🔴 HIGH',   cls: 'severity-high' },
  Medium: { label: '🟡 MEDIUM', cls: 'severity-medium' },
  Low:    { label: '🟢 LOW',    cls: 'severity-low' },
}

function VerdictPanel({ result }: { result: PredictResponse }) {
  const pct = Math.round(result.confidence * 100)
  const isAttack = result.is_attack

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'rounded-2xl p-6 text-center space-y-5',
        isAttack ? 'glow-border-red' : 'glow-border-cyan'
      )}
      style={{
        background: isAttack
          ? 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(10,22,40,0.8))'
          : 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(10,22,40,0.8))',
      }}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="flex justify-center"
      >
        {isAttack ? (
          <ShieldAlert className="w-16 h-16 text-red-400" />
        ) : (
          <CheckCircle2 className="w-16 h-16 text-cyan-400" />
        )}
      </motion.div>

      {/* Verdict */}
      <div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'text-3xl font-bold font-mono tracking-widest',
            isAttack ? 'text-red-400' : 'text-cyan-400'
          )}
        >
          {isAttack ? '⚠ ATTACK' : '✓ NORMAL'}
        </motion.p>
        <p className="text-slate-500 text-sm mt-1 font-mono">{result.predicted_class}</p>
      </div>

      {/* Confidence arc */}
      <div className="space-y-2">
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden mx-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: isAttack ? '#ef4444' : '#00d4ff' }}
          />
        </div>
        <p className="text-sm font-mono text-slate-400">
          Confidence: <span className="font-bold">{pct}%</span>
        </p>
      </div>

      {/* Severity badge */}
      {result.severity && SEVERITY_STYLE[result.severity] && (
        <div className="flex justify-center">
          <span className={cn('text-sm font-mono font-bold px-4 py-1.5 rounded-full', SEVERITY_STYLE[result.severity].cls)}>
            Severity: {SEVERITY_STYLE[result.severity].label}
          </span>
        </div>
      )}
    </motion.div>
  )
}

function FieldGroupSection({ group, values, onChange }: {
  group: FieldGroup
  values: PredictRequest
  onChange: (k: keyof PredictRequest, v: string | number) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-semibold text-slate-300">{group.title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 border-t border-[#0f2040]">
              {group.fields.map(({ key, label, type }) => (
                <div key={key} className="space-y-1 pt-3">
                  <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                    {label}
                  </label>
                  <input
                    id={`field-${key}`}
                    type={type}
                    step={type === 'number' ? 'any' : undefined}
                    value={String(values[key] ?? '')}
                    onChange={(e) =>
                      onChange(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)
                    }
                    className="ids-input text-sm"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PredictPage() {
  const [values, setValues] = useState<PredictRequest>(DEFAULT_VALUES)
  const predict = usePredict()

  const handleChange = (key: keyof PredictRequest, val: string | number) => {
    setValues(prev => ({ ...prev, [key]: val }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    predict.mutate(values, {
      onSuccess: () => toast.success('Prediction complete'),
      onError: (err) => toast.error('Prediction failed', { description: err.message }),
    })
  }

  const handleReset = () => {
    setValues(DEFAULT_VALUES)
    predict.reset()
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="p-6 md:p-8 max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fade(0)}>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-cyan-400" />
          Manual Predict
        </h1>
        <p className="text-slate-600 text-sm mt-0.5">
          Submit a single network flow record for real-time ML classification
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field groups */}
        {FIELD_GROUPS.map((group, i) => (
          <motion.div key={group.title} variants={fade(0.05 + i * 0.04)}>
            <FieldGroupSection group={group} values={values} onChange={handleChange} />
          </motion.div>
        ))}

        {/* Actions */}
        <motion.div variants={fade(0.3)} className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            id="predict-submit"
            disabled={predict.isPending}
            className={cn(
              'btn-primary flex-1 md:flex-none md:px-10 justify-center',
              predict.isPending && 'opacity-60 cursor-not-allowed'
            )}
          >
            {predict.isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-[#050d1a]/30 border-t-[#050d1a] rounded-full"
                />
                Classifying…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Prediction
              </>
            )}
          </button>
          <button type="button" onClick={handleReset} className="btn-ghost">
            Reset
          </button>
        </motion.div>
      </form>

      {/* Result */}
      <AnimatePresence>
        {predict.data && (
          <motion.div
            variants={fade(0)}
            initial="hidden"
            animate="visible"
            className="pt-2"
          >
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider font-mono mb-4">
              — Classification Result —
            </h2>
            <VerdictPanel result={predict.data} />
          </motion.div>
        )}
        {predict.isError && (
          <motion.div variants={fade(0)} initial="hidden" animate="visible"
            className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">Prediction Failed</p>
              <p className="text-xs text-slate-500 mt-0.5">{predict.error?.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

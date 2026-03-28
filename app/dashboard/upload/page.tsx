'use client'

import { useState, useRef, useCallback } from 'react'
import { useUploadCSV, UploadResult } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  X,
  BarChart2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
}

function DropZone({
  onFile,
  file,
  onClear,
  isUploading,
}: {
  onFile: (f: File) => void
  file: File | null
  onClear: () => void
  isUploading: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.csv')) {
      onFile(dropped)
    } else {
      toast.error('Please drop a CSV file')
    }
  }, [onFile])

  return (
    <label
      htmlFor="csv-file-input"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center min-h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 relative overflow-hidden',
        isDragging
          ? 'border-cyan-400/60 bg-cyan-500/10'
          : file
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : 'border-slate-700 bg-transparent hover:border-cyan-500/40 hover:bg-cyan-500/5'
      )}
    >
      {/* Animated glow on drag */}
      {isDragging && (
        <div className="absolute inset-0 bg-cyan-500/5 animate-pulse rounded-2xl" />
      )}

      {file ? (
        <div className="flex flex-col items-center gap-3 relative z-10">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          <div className="text-center">
            <p className="font-semibold text-slate-200 text-sm">{file.name}</p>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {(file.size / 1024).toFixed(1)} KB · CSV
            </p>
          </div>
          {!isUploading && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onClear() }}
              className="text-xs text-slate-600 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 relative z-10 px-6 text-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <FileUp className="w-12 h-12 text-slate-600" />
          </motion.div>
          <div>
            <p className="font-semibold text-slate-300 text-sm">
              Drop your CSV file here
            </p>
            <p className="text-xs text-slate-600 mt-1">
              or <span className="text-cyan-400 underline-offset-2 underline">click to browse</span> · Max 100 MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id="csv-file-input"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
    </label>
  )
}

function ResultsPanel({ result }: { result: UploadResult }) {
  const chartData = Object.entries(result.attack_counts).map(([name, value]) => ({
    name,
    value,
    color: ATTACK_COLORS[name] ?? '#6366f1',
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: result.total_records, color: '#00d4ff' },
          { label: 'Processed',     value: result.processed,     color: '#10b981' },
          { label: 'Errors',        value: result.errors,        color: '#ef4444' },
          {
            label: 'Attacks Found',
            value: Object.values(result.attack_counts).reduce((a, b) => a + b, 0),
            color: '#f59e0b',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color }}>
              {value.toLocaleString()}
            </p>
            <p className="text-xs text-slate-600 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Attack breakdown chart */}
      {chartData.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Attack Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
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
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-emerald-400 font-semibold">No attacks detected</p>
          <p className="text-slate-600 text-sm mt-1">All {result.processed} records classified as Normal</p>
        </div>
      )}
    </motion.div>
  )
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const upload = useUploadCSV()

  const handleUpload = () => {
    if (!file) return

    // Simulate progress bar
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) { clearInterval(interval); return p }
        return p + Math.random() * 12
      })
    }, 200)

    upload.mutate(file, {
      onSuccess: () => {
        clearInterval(interval)
        setProgress(100)
        toast.success('Upload complete! Results ready below.')
      },
      onError: (err) => {
        clearInterval(interval)
        setProgress(0)
        toast.error('Upload failed', { description: err.message })
      },
    })
  }

  const handleClear = () => {
    setFile(null)
    setProgress(0)
    upload.reset()
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="p-6 md:p-8 max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fade(0)}>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Upload className="w-6 h-6 text-cyan-400" />
          Batch Upload
        </h1>
        <p className="text-slate-600 text-sm mt-0.5">
          Upload a CSV containing network flow records for bulk ML classification
        </p>
      </motion.div>

      {/* Drop zone */}
      <motion.div variants={fade(0.05)}>
        <DropZone
          onFile={setFile}
          file={file}
          onClear={handleClear}
          isUploading={upload.isPending}
        />
      </motion.div>

      {/* Progress bar */}
      <AnimatePresence>
        {upload.isPending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-500">
                <span>Processing…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #00d4ff, #0ea5e9)',
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button */}
      {file && !upload.data && (
        <motion.div variants={fade(0.1)} className="flex gap-3">
          <button
            id="upload-submit"
            onClick={handleUpload}
            disabled={upload.isPending}
            className={cn(
              'btn-primary flex-1 justify-center md:flex-none md:px-10',
              upload.isPending && 'opacity-60 cursor-not-allowed'
            )}
          >
            {upload.isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-[#050d1a]/30 border-t-[#050d1a] rounded-full"
                />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload & Classify
              </>
            )}
          </button>
          <button onClick={handleClear} className="btn-ghost">
            Cancel
          </button>
        </motion.div>
      )}

      {/* Error */}
      {upload.isError && (
        <motion.div variants={fade(0)} className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{upload.error?.message}</p>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {upload.data && <ResultsPanel result={upload.data} />}
      </AnimatePresence>

      {/* Format guide */}
      <motion.div variants={fade(0.2)} className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">CSV Format Reference</h3>
        <p className="text-xs text-slate-600 mb-3">
          Each row must match the prediction model&apos;s expected columns (from the UNSW-NB15 feature set):
        </p>
        <div className="bg-[#040c18] rounded-lg p-3 overflow-x-auto">
          <code className="text-[11px] font-mono text-cyan-400/80 whitespace-nowrap">
            dur, spkts, dpkts, sbytes, dbytes, rate, sttl, dttl, sload, dload, sinpkt, dinpkt, sjit, djit, swin, stcpb, dtcpb, dwin, smean, dmean, ct_srv_src, ct_state_ttl, ct_dst_ltm, ct_src_dport_ltm, ct_dst_sport_ltm, ct_dst_src_ltm, is_ftp_login, ct_ftp_cmd, ct_flw_http_mthd, ct_src_ltm, ct_srv_dst, is_sm_ips_ports, proto, service, state
          </code>
        </div>
      </motion.div>
    </motion.div>
  )
}

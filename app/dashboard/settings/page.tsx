'use client'

import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Bell, Database, Lock } from 'lucide-react'

const fade = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay, ease: 'easeOut' } },
})

export default function SettingsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="p-6 md:p-8 max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fade(0)}>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
          Settings
        </h1>
        <p className="text-slate-600 text-sm mt-0.5">Configure dashboard preferences</p>
      </motion.div>

      {/* Alert Settings */}
      <motion.div variants={fade(0.05)} className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#0f2040]">
          <Bell className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-300">Alert Settings</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'High Severity Alerts', sub: 'Get visual notifications for high severity alerts' },
            { label: 'Dashboard Alerts',     sub: 'Show alert flash on the overview panel' },
          ].map(({ label, sub }) => (
            <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-[#040c18]/60">
              <div>
                <p className="text-sm font-medium text-slate-300">{label}</p>
                <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer accent-cyan-400" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* API Configuration */}
      <motion.div variants={fade(0.1)} className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#0f2040]">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-300">API Configuration</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-600 uppercase tracking-wider">Backend URL</label>
            <input
              type="text"
              defaultValue={apiUrl}
              readOnly
              className="ids-input opacity-60 cursor-not-allowed w-full"
            />
            <p className="text-[11px] text-slate-700 font-mono">
              Set via NEXT_PUBLIC_API_URL environment variable
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-600 uppercase tracking-wider">Polling Interval</label>
            <select className="ids-select w-full" defaultValue="5000">
              <option value="2000">2 seconds</option>
              <option value="5000">5 seconds (default)</option>
              <option value="10000">10 seconds</option>
              <option value="30000">30 seconds</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div variants={fade(0.15)} className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#0f2040]">
          <Lock className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-300">Security</h2>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#040c18]/60">
          <div>
            <p className="text-sm font-medium text-slate-300">Session Timeout</p>
            <p className="text-xs text-slate-600 mt-0.5">Auto-logout after inactivity</p>
          </div>
          <select className="ids-select text-sm py-1 px-2 w-auto" defaultValue="30">
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="60">1 hour</option>
            <option value="0">Never</option>
          </select>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={fade(0.2)} className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h2>
        <button className="w-full px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
          Clear All Cached Data
        </button>
        <p className="text-[11px] text-slate-700 mt-2 font-mono">
          This clears only local cache. Backend data is unaffected.
        </p>
      </motion.div>

      <motion.div variants={fade(0.25)}>
        <button className="btn-primary w-full justify-center">
          Save Settings
        </button>
      </motion.div>
    </motion.div>
  )
}

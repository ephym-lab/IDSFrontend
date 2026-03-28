'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Bell,
  ScrollText,
  Upload,
  Cpu,
  Menu,
  X,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCaptureStatus, useStartCapture, useStopCapture } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

const navigationItems = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: 'Alerts',
    href: '/dashboard/alerts',
    icon: Bell,
  },
  {
    name: 'Traffic Logs',
    href: '/dashboard/traffic',
    icon: ScrollText,
  },
  {
    name: 'Predict',
    href: '/dashboard/predict',
    icon: Cpu,
  },
  {
    name: 'Batch Upload',
    href: '/dashboard/upload',
    icon: Upload,
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const { data: captureData } = useCaptureStatus()
  const startCapture = useStartCapture()
  const stopCapture = useStopCapture()

  const isCapturing = captureData?.capturing ?? false

  const handleCaptureToggle = () => {
    if (isCapturing) {
      stopCapture.mutate(undefined, {
        onSuccess: () => toast.success('Live capture stopped'),
        onError: () => toast.error('Failed to stop capture'),
      })
    } else {
      startCapture.mutate(undefined, {
        onSuccess: () => toast.success('Live capture started'),
        onError: () => toast.error('Failed to start capture'),
      })
    }
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="sidebar-toggle"
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg glass text-slate-100 hover:border-cyan-500/40 transition-all"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <motion.nav
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed md:relative w-64 h-screen z-40 md:z-0 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #040c18 0%, #050d1a 100%)',
          borderRight: '1px solid #0f2040',
        }}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#0f2040]">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(14,165,233,0.1))',
                border: '1px solid rgba(0,212,255,0.2)',
              }}
            >
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-bold text-slate-100 text-sm leading-tight">Network IDS</p>
              <p className="text-[10px] text-cyan-400/70 uppercase tracking-widest font-mono">
                Command Center
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                id={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'text-cyan-300'
                    : 'text-slate-500 hover:text-slate-200'
                )}
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(14,165,233,0.05))',
                        border: '1px solid rgba(0,212,255,0.2)',
                        boxShadow: '0 0 16px rgba(0,212,255,0.06)',
                      }
                    : {
                        background: 'transparent',
                        border: '1px solid transparent',
                      }
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(14,165,233,0.04))',
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    'w-4 h-4 flex-shrink-0 relative z-10',
                    isActive ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'
                  )}
                />
                <span className="font-medium text-sm relative z-10">{item.name}</span>
                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto text-cyan-500/60 relative z-10" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Live Capture Control */}
        <div className="px-3 pb-3">
          <button
            onClick={handleCaptureToggle}
            id="capture-toggle-sidebar"
            disabled={startCapture.isPending || stopCapture.isPending}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-300 group',
              isCapturing
                ? 'hover:bg-red-500/10 border border-red-500/20'
                : 'hover:bg-emerald-500/10 border border-emerald-500/20'
            )}
            style={{
              background: isCapturing ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
            }}
          >
            {/* Pulsing dot */}
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  isCapturing ? 'bg-red-500' : 'bg-emerald-500'
                )}
                style={{
                  animation: isCapturing ? 'pulse-glow-red 1.5s infinite' : 'pulse-glow-green 2s infinite',
                }}
              />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p
                className={cn(
                  'text-xs font-semibold font-mono',
                  isCapturing ? 'text-red-400' : 'text-emerald-400'
                )}
              >
                {isCapturing ? 'CAPTURING' : 'IDLE'}
              </p>
              <p className="text-[10px] text-slate-600 truncate">
                {isCapturing ? 'Click to stop capture' : 'Click to start capture'}
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-[#0f2040] pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-cyan-400">
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{user?.name ?? 'User'}</p>
                <p className="text-[10px] text-slate-600 truncate font-mono">{user?.email ?? ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              id="logout-btn"
              title="Logout"
              className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

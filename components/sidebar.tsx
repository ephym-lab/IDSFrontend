'use client'

import { useState, useEffect } from 'react'
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
  Radar,
  ExternalLink,
  FileText,
  Users,
  ShieldAlert,
  MessageSquare,
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
    name: 'Live Capture',
    href: '/dashboard/live-capture',
    icon: Radar,
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
  {
    name: 'Feedback',
    href: '/dashboard/feedback',
    icon: MessageSquare,
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
  },
]

const adminNavItems = [
  {
    name: 'User Management',
    href: '/dashboard/admin/users',
    icon: Users,
  },
  {
    name: 'Feedback Management',
    href: '/dashboard/admin/feedback',
    icon: MessageSquare,
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

  // On desktop the sidebar must always stay open.
  // When the route changes (e.g. after a nav-link click that set isOpen=false
  // on mobile), restore it on desktop screens.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setIsOpen(true)
    }
    // Re-open on desktop whenever route changes
    if (window.innerWidth >= 768) setIsOpen(true)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [pathname])

  // Only close the sidebar when navigating on mobile
  const handleNavClick = () => {
    if (window.innerWidth < 768) setIsOpen(false)
  }

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
                onClick={handleNavClick}
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

          {/* Admin section — only visible to admins */}
          {user?.role === 'admin' && (
            <>
              <div className="pt-2 pb-1 px-3">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-amber-400/70" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70 font-mono">Admin</p>
                </div>
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    id={`nav-${item.name.toLowerCase().replace(/\s/g, '-')}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                      isActive ? 'text-amber-300' : 'text-slate-500 hover:text-slate-200'
                    )}
                    style={
                      isActive
                        ? {
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))',
                            border: '1px solid rgba(251,191,36,0.2)',
                          }
                        : { background: 'transparent', border: '1px solid transparent' }
                    }
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isActive ? 'text-amber-400' : 'text-slate-600 group-hover:text-slate-400'
                      )}
                    />
                    <span className="font-medium text-sm">{item.name}</span>
                    {isActive && <ChevronRight className="w-3 h-3 ml-auto text-amber-500/60" />}
                  </Link>
                )
              })}
            </>
          )}
        </div>

        {/* Live Capture Control */}
        <div className="px-3 pb-3 space-y-1.5">
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
          {isCapturing && (
            <Link
              href="/dashboard/live-capture"
              onClick={handleNavClick}
              id="nav-live-capture-view"
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-[10px] font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}
            >
              <ExternalLink className="w-3 h-3" />
              View Live Dashboard
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-[#0f2040] pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-cyan-400">
                  {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-slate-300 truncate">{user?.full_name ?? 'User'}</p>
                  {user?.role === 'admin' && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">Admin</span>
                  )}
                </div>
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

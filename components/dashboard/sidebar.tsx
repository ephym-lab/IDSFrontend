'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Shield, BarChart3, AlertTriangle, Network, Upload, Settings, LogOut, User, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const navigationItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    label: 'Alert Inbox',
    href: '/dashboard/alerts',
    icon: AlertTriangle,
  },
  {
    label: 'Traffic Logs',
    href: '/dashboard/traffic',
    icon: Network,
  },
  {
    label: 'Batch Upload',
    href: '/dashboard/upload',
    icon: Upload,
  },
  {
    label: 'Feedback',
    href: '/dashboard/feedback',
    icon: MessageSquare,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

const adminNavigationItems = [
  {
    label: 'Feedback Mgmt',
    href: '/dashboard/admin/feedback',
    icon: MessageSquare,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/auth/signin')
  }

  return (
    <aside className="w-64 border-r border-border bg-card min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg border border-primary/50">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-bold text-card-foreground text-sm">IDS Command</h1>
          <p className="text-xs text-muted-foreground">Center</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard')

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'text-muted-foreground hover:text-card-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          )
        })}

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Admin
              </p>
            </div>
            {adminNavigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary/20 text-primary border border-primary/50'
                        : 'text-muted-foreground hover:text-card-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Footer - User Info & Logout */}
      <div className="p-6 border-t border-border space-y-4">
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="p-2 bg-primary/20 rounded-lg">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-card-foreground truncate">{user.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}

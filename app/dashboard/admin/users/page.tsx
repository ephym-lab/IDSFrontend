'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  ShieldCheck,
  ShieldOff,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Filter,
  Search,
  ShieldAlert,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useAdminUsers,
  useAdminPendingUsers,
  useApproveUser,
  useRevokeUser,
  type AdminUser,
} from '@/lib/api'

type ViewMode = 'all' | 'pending'

function StatusBadge({ user }: { user: AdminUser }) {
  if (!user.is_verified) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        <Clock className="w-2.5 h-2.5" /> Unverified
      </span>
    )
  }
  if (!user.admin_verified) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
        <Clock className="w-2.5 h-2.5" /> Pending Approval
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="w-2.5 h-2.5" /> Active
    </span>
  )
}

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
        <ShieldAlert className="w-2.5 h-2.5" /> Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
      <UserCheck className="w-2.5 h-2.5" /> User
    </span>
  )
}

function UserRow({ user, onApprove, onRevoke, isApproving, isRevoking }: {
  user: AdminUser
  onApprove: () => void
  onRevoke: () => void
  isApproving: boolean
  isRevoking: boolean
}) {
  const isActive = user.is_verified && user.admin_verified
  const canApprove = user.is_verified && !user.admin_verified
  const isAdmin = user.role === 'admin'

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-[#0f2040] hover:bg-white/[0.02] transition-colors group"
    >
      {/* Avatar + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-cyan-400">
              {user.full_name[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user.full_name}</p>
            <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge user={user} />
      </td>

      {/* Joined */}
      <td className="px-4 py-3">
        <span className="text-xs text-slate-500 font-mono">
          {new Date(user.created_at).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {isAdmin ? (
          <span className="text-xs text-slate-600 italic">—</span>
        ) : (
          <div className="flex items-center gap-2">
            {canApprove && (
              <button
                id={`approve-user-${user.id}`}
                onClick={onApprove}
                disabled={isApproving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isApproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                Approve
              </button>
            )}
            {isActive && (
              <button
                id={`revoke-user-${user.id}`}
                onClick={onRevoke}
                disabled={isRevoking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isRevoking ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                Revoke
              </button>
            )}
            {!canApprove && !isActive && (
              <span className="text-xs text-slate-600 italic">No actions</span>
            )}
          </div>
        )}
      </td>
    </motion.tr>
  )
}

export default function AdminUsersPage() {
  const [view, setView] = useState<ViewMode>('all')
  const [search, setSearch] = useState('')

  const allUsers = useAdminUsers()
  const pendingUsers = useAdminPendingUsers()
  const approve = useApproveUser()
  const revoke = useRevokeUser()

  const activeQuery = view === 'all' ? allUsers : pendingUsers
  const users = activeQuery.data?.users ?? []
  const count = activeQuery.data?.count ?? 0

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const pendingCount = pendingUsers.data?.count ?? 0

  const handleApprove = async (user: AdminUser) => {
    approve.mutate(user.id, {
      onSuccess: (data) => {
        toast.success('User Approved', { description: data.message })
      },
      onError: (err) => {
        toast.error('Approval Failed', {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      },
    })
  }

  const handleRevoke = async (user: AdminUser) => {
    revoke.mutate(user.id, {
      onSuccess: (data) => {
        toast.success('Access Revoked', { description: data.message })
      },
      onError: (err) => {
        toast.error('Revoke Failed', {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      },
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">User Management</h1>
          </div>
          <p className="text-sm text-slate-500">
            Approve new accounts, manage access, and monitor user activity.
          </p>
        </div>

        <button
          id="refresh-users"
          onClick={() => activeQuery.refetch()}
          disabled={activeQuery.isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08] hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={['w-3.5 h-3.5', activeQuery.isFetching ? 'animate-spin' : ''].join(' ')} />
          Refresh
        </button>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Total Users', value: allUsers.data?.count ?? '—', icon: Users, color: 'text-cyan-400', bg: 'rgba(0,212,255,0.06)', border: 'rgba(0,212,255,0.15)' },
          { label: 'Pending Approval', value: pendingUsers.data?.count ?? '—', icon: Clock, color: 'text-orange-400', bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.2)' },
          {
            label: 'Active Users',
            value: allUsers.data
              ? allUsers.data.users.filter((u) => u.is_verified && u.admin_verified).length
              : '—',
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'rgba(16,185,129,0.06)',
            border: 'rgba(16,185,129,0.2)',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
            >
              <Icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Filters + Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 flex-wrap"
      >
        {/* View toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(['all', 'pending'] as ViewMode[]).map((v) => (
            <button
              key={v}
              id={`view-${v}`}
              onClick={() => setView(v)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize flex items-center gap-1.5',
                view === v
                  ? 'bg-white/[0.08] text-slate-200'
                  : 'text-slate-500 hover:text-slate-300',
              ].join(' ')}
            >
              <Filter className="w-3 h-3" />
              {v === 'pending' ? `Pending (${pendingCount})` : 'All Users'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg min-w-48"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Search className="w-4 h-4 text-slate-600 flex-shrink-0" />
          <input
            id="search-users"
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-600 hover:text-slate-400 transition-colors">
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid #0f2040', background: 'rgba(4,12,24,0.6)' }}
      >
        {activeQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : activeQuery.isError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <XCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-slate-400">Failed to load users</p>
            <button
              onClick={() => activeQuery.refetch()}
              className="text-xs text-cyan-400 hover:underline mt-1"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Users className="w-8 h-8 text-slate-700" />
            <p className="text-sm text-slate-500">
              {search ? 'No users match your search.' : view === 'pending' ? 'No users pending approval.' : 'No users found.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr
                className="text-left"
                style={{ borderBottom: '1px solid #0f2040', background: 'rgba(255,255,255,0.02)' }}
              >
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onApprove={() => handleApprove(user)}
                    onRevoke={() => handleRevoke(user)}
                    isApproving={approve.isPending && approve.variables === user.id}
                    isRevoking={revoke.isPending && revoke.variables === user.id}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}

        {/* Footer count */}
        {!activeQuery.isLoading && filtered.length > 0 && (
          <div
            className="px-4 py-2 flex items-center justify-between"
            style={{ borderTop: '1px solid #0f2040', background: 'rgba(255,255,255,0.01)' }}
          >
            <p className="text-xs text-slate-600">
              Showing <span className="text-slate-400 font-medium">{filtered.length}</span> of{' '}
              <span className="text-slate-400 font-medium">{count}</span> users
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

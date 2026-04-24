'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { queryClient } from '@/app/providers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ─── Types ────────────────────────────────────────────────────────────────

export interface User {
  id: number
  full_name: string
  email: string
  role: 'user' | 'admin'
  created_at: string
}

/** Returned by signinStep1 — admin gets a token immediately, regular users need OTP */
export type SigninStep1Result =
  | { requiresOtp: true; message: string }
  | { requiresOtp: false }

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  /** Step 1 of login. Admin → stores session & returns requiresOtp:false. Regular user → emails OTP & returns requiresOtp:true. */
  signinStep1: (email: string, password: string) => Promise<SigninStep1Result>
  /** Step 2 of login – verifies OTP, stores session */
  signinStep2: (email: string, otp: string) => Promise<void>
  /** Step 1 of signup – creates pending account, sends OTP */
  signupStep1: (full_name: string, email: string, password: string) => Promise<string>
  /** Step 2 of signup – verifies OTP, activates account, stores session */
  signupStep2: (email: string, otp: string) => Promise<void>
  /** Resend OTP to the given email (works for both flows) */
  resendOtp: (email: string) => Promise<string>
  logout: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function authFetch<T>(endpoint: string, body: object): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    // FastAPI validation errors come as { detail: [...] }
    if (Array.isArray(data?.detail)) {
      const msg = data.detail.map((e: { msg: string }) => e.msg).join(', ')
      throw new Error(msg)
    }
    throw new Error(data?.detail || `Request failed (${response.status})`)
  }

  return data as T
}

// ─── Context ──────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('access_token')
      const storedUser = localStorage.getItem('user')
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Login Step 1: admin → JWT directly; regular user → OTP email ──────────
  const signinStep1 = async (email: string, password: string): Promise<SigninStep1Result> => {
    // The backend returns either { message } (regular user) or { access_token, user, ... } (admin)
    const data = await authFetch<
      { message: string } | { access_token: string; token_type: string; user: User }
    >('/auth/login', { email, password })

    if ('access_token' in data) {
      // Admin path — session is established right away
      setToken(data.access_token)
      setUser(data.user)
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return { requiresOtp: false }
    }

    // Regular user path — OTP was emailed
    return { requiresOtp: true, message: data.message }
  }

  // ── Login Step 2: verify OTP, store session ──────────────────────────────
  const signinStep2 = async (email: string, otp: string): Promise<void> => {
    const data = await authFetch<{
      access_token: string
      token_type: string
      user: User
    }>('/auth/login/verify-otp', { email, otp })

    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  // ── Signup Step 1: create pending account, send OTP ─────────────────────
  const signupStep1 = async (full_name: string, email: string, password: string): Promise<string> => {
    const data = await authFetch<{ message: string }>('/auth/signup', { full_name, email, password })
    return data.message
  }

  // ── Signup Step 2: verify OTP, activate account, store session ──────────
  const signupStep2 = async (email: string, otp: string): Promise<void> => {
    const data = await authFetch<{
      access_token: string
      token_type: string
      user: User
    }>('/auth/signup/verify-otp', { email, otp })

    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const resendOtp = async (email: string): Promise<string> => {
    const data = await authFetch<{ message: string }>('/auth/resend-otp', { email })
    return data.message
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    // Wipe all cached query data so a subsequent user sees a clean slate.
    queryClient.clear()
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signinStep1, signinStep2, signupStep1, signupStep2, resendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

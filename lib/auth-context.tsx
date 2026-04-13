'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { queryClient } from '@/app/providers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ─── Types ────────────────────────────────────────────────────────────────

export interface User {
  id: number
  full_name: string
  email: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  signin: (email: string, password: string) => Promise<void>
  signup: (full_name: string, email: string, password: string) => Promise<void>
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

  const signin = async (email: string, password: string) => {
    const data = await authFetch<{
      access_token: string
      token_type: string
      user: User
    }>('/auth/login', { email, password })

    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  const signup = async (full_name: string, email: string, password: string) => {
    const data = await authFetch<{
      access_token: string
      token_type: string
      user: User
    }>('/auth/signup', { full_name, email, password })

    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
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
    <AuthContext.Provider value={{ user, token, isLoading, signin, signup, logout }}>
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

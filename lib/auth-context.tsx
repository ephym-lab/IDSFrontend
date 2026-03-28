'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signin: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('user')
      }
    }
    // Initialize with demo account for testing
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    if (users.length === 0) {
      const demoUsers = [
        { id: 'demo_001', email: 'demo@example.com', password: 'demo123', name: 'Demo User' },
        { id: 'demo_002', email: 'admin@example.com', password: 'admin123', name: 'Admin User' },
      ]
      localStorage.setItem('users', JSON.stringify(demoUsers))
    }
    setIsLoading(false)
  }, [])

  const signin = async (email: string, password: string) => {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // In a real app, this would call an API endpoint
    // For MVP, we'll simulate authentication
    if (password.length < 6) {
      throw new Error('Invalid credentials')
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
    }

    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const signup = async (email: string, password: string, name: string) => {
    // Validate inputs
    if (!email || !password || !name) {
      throw new Error('All fields are required')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address')
    }

    // In a real app, this would call an API endpoint
    // For MVP, we'll simulate registration
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
    }

    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signin, signup, logout }}>
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

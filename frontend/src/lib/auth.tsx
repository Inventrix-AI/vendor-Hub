'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { User } from '@/types'
import { authApi } from '@/lib/api'
import { toast } from 'react-toastify'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: { username: string; password: string }) => Promise<void>
  register: (data: {
    email: string
    password: string
    full_name: string
    phone?: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      const token = Cookies.get('access_token')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        try {
          setUser(JSON.parse(userData))
        } catch (error) {
          console.error('Failed to parse user data:', error)
          logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await authApi.login(credentials)
      
      // Store token
      Cookies.set('access_token', response.access_token, { expires: 1 }) // 1 day
      
      // Decode JWT to get user info (simple approach)
      const tokenPayload = JSON.parse(atob(response.access_token.split('.')[1]))
      const userData: User = {
        id: 0, // This should come from a separate API call in production
        email: tokenPayload.sub,
        full_name: tokenPayload.sub, // This should be fetched properly
        role: tokenPayload.role,
        is_active: true,
      }
      
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      toast.success('Login successful!')
    } catch (error) {
      throw error
    }
  }

  const register = async (data: {
    email: string
    password: string
    full_name: string
    phone?: string
  }) => {
    try {
      const response = await authApi.register(data)
      
      // Auto-login after registration
      await login({ username: data.email, password: data.password })
      
      toast.success('Registration successful!')
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    Cookies.remove('access_token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/auth/login'
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
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